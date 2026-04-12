import {
  DummyDriver,
  Kysely,
  SqliteAdapter as KyselySqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  sql,
} from "kysely";
import type {
  Adapter,
  ListOptions,
  Page,
  StepState,
  WorkflowState,
} from "../adapter";
import type { DB } from "./types";

export interface SqliteDatabase {
  prepare(sql: string): {
    all(...params: unknown[]): unknown[];
    run(...params: unknown[]): void;
  };
}

const qb = new Kysely<DB>({
  dialect: {
    createAdapter: () => new KyselySqliteAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (db) => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler(),
  },
});

export class SqliteAdapter implements Adapter {
  constructor(protected db: SqliteDatabase) {}

  private all<T>(compiled: { sql: string; parameters: readonly unknown[] }): T[] {
    return this.db.prepare(compiled.sql).all(...compiled.parameters) as T[];
  }

  private run(compiled: { sql: string; parameters: readonly unknown[] }): void {
    this.db.prepare(compiled.sql).run(...compiled.parameters);
  }

  async createWorkflow(input: {
    workflowId: string;
    input: unknown;
  }): Promise<WorkflowState> {
    const compiled = qb
      .insertInto("workflow_state")
      .values({
        workflow_id: input.workflowId,
        run_id: crypto.randomUUID(),
        error: null,
        input: JSON.stringify(input.input),
        leaseExpiredAt: 0,
        started_at: sql<number>`unixepoch()`,
        finished_at: null,
        resume_at: 0,
      })
      .returningAll()
      .compile();

    const rows = this.all<DB["workflow_state"]>(compiled);
    const result = rows[0];
    if (!result) throw new Error("Failed to create workflow");
    return mapWorkflowState(result);
  }

  async lease(runId: string, leaseDuration: number): Promise<void> {
    this.run(
      qb
        .updateTable("workflow_state")
        .set({
          leaseExpiredAt: sql<number>`unixepoch() + ${leaseDuration}`,
        })
        .where("run_id", "=", runId)
        .where("leaseExpiredAt", "<", sql<number>`unixepoch() + ${leaseDuration}`)
        .compile(),
    );
  }

  async getLastestRun(
    workflowId: string,
    input: unknown,
  ): Promise<WorkflowState | null> {
    const rows = this.all<DB["workflow_state"]>(
      qb
        .selectFrom("workflow_state")
        .selectAll()
        .where("workflow_id", "=", workflowId)
        .where("input", "=", JSON.stringify(input))
        .orderBy("started_at", "desc")
        .limit(1)
        .compile(),
    );

    return rows[0] ? mapWorkflowState(rows[0]) : null;
  }

  async getNextWorkflow(leaseDuration: number): Promise<WorkflowState | null> {
    const subquery = qb
      .selectFrom("workflow_state")
      .select("run_id")
      .where("finished_at", "is", null)
      .where("leaseExpiredAt", "<=", sql<number>`unixepoch()`)
      .orderBy("started_at", "asc")
      .limit(1);

    const rows = this.all<DB["workflow_state"]>(
      qb
        .updateTable("workflow_state")
        .set({
          leaseExpiredAt: sql<number>`unixepoch() + ${leaseDuration}`,
        })
        .where("run_id", "=", subquery)
        .returningAll()
        .compile(),
    );

    return rows[0] ? mapWorkflowState(rows[0]) : null;
  }

  async finishWorkflow(runId: string): Promise<void> {
    this.run(
      qb
        .updateTable("workflow_state")
        .set({
          finished_at: sql<number>`unixepoch()`,
        })
        .where("run_id", "=", runId)
        .compile(),
    );
  }

  async failWorkflow(runId: string, error: string): Promise<void> {
    this.run(
      qb
        .updateTable("workflow_state")
        .set({
          finished_at: sql<number>`unixepoch()`,
          error,
        })
        .where("run_id", "=", runId)
        .compile(),
    );
  }

  async getSteps(runId: string): Promise<Map<string, StepState>> {
    const steps = this.all<DB["workflow_step_state"]>(
      qb
        .selectFrom("workflow_step_state")
        .selectAll()
        .where("run_id", "=", runId)
        .compile(),
    );

    return new Map(
      steps.map((step) => [
        step.step_id,
        {
          runId: step.run_id,
          stepId: step.step_id,
          result: step.result != null ? JSON.parse(step.result) : null,
          error: step.error,
          attempt: step.attempt as unknown as number,
        },
      ]),
    );
  }

  async putStep(state: StepState): Promise<void> {
    this.run(
      qb
        .insertInto("workflow_step_state")
        .values({
          run_id: state.runId,
          step_id: state.stepId,
          result: state.result != null ? JSON.stringify(state.result) : null,
          error: state.error,
          attempt: state.attempt,
        })
        .onConflict((oc) =>
          oc.columns(["run_id", "step_id"]).doUpdateSet({
            result: state.result != null ? JSON.stringify(state.result) : null,
            error: state.error,
            attempt: state.attempt,
          }),
        )
        .compile(),
    );
  }

  async listWorkflows(options: ListOptions = {}): Promise<Page> {
    const { page = 1, pageSize = 30, cursor } = options;

    if (cursor) {
      const [date, id] = cursor.split(":");
      const workflows = this.all<DB["workflow_state"]>(
        qb
          .selectFrom("workflow_state")
          .selectAll()
          .orderBy("started_at", "desc")
          .orderBy("run_id", "asc")
          .where((eb) =>
            eb.or([
              eb("started_at", "<", parseInt(date!, 10)),
              eb.and([
                eb("started_at", "=", parseInt(date!, 10)),
                eb("run_id", ">=", id!),
              ]),
            ]),
          )
          .limit(pageSize + 1)
          .compile(),
      );

      const next = workflows[pageSize];
      return {
        workflows: workflows.slice(0, pageSize).map(mapWorkflowState),
        nextCursor: next ? `${next.started_at}:${next.run_id}` : null,
      };
    }

    const workflows = this.all<DB["workflow_state"]>(
      qb
        .selectFrom("workflow_state")
        .selectAll()
        .orderBy("started_at", "desc")
        .orderBy("run_id", "asc")
        .offset((page - 1) * pageSize)
        .limit(pageSize + 1)
        .compile(),
    );

    const next = workflows[pageSize];
    return {
      workflows: workflows.slice(0, pageSize).map(mapWorkflowState),
      nextCursor: next ? `${next.started_at}:${next.run_id}` : null,
    };
  }
}

function mapWorkflowState(
  result: Pick<
    DB["workflow_state"],
    | "workflow_id"
    | "run_id"
    | "error"
    | "input"
    | "started_at"
    | "finished_at"
    | "leaseExpiredAt"
  >,
): WorkflowState {
  return {
    workflowId: result.workflow_id,
    runId: result.run_id,
    error: result.error,
    input: result.input != null ? JSON.parse(result.input) : null,
    startedAt: new Date(
      (typeof result.started_at === "number" ? result.started_at : 0) * 1000,
    ),
    finishedAt: result.finished_at ? new Date(result.finished_at * 1000) : null,
    leaseExpiredAt: new Date(
      (typeof result.leaseExpiredAt === "number" ? result.leaseExpiredAt : 0) *
        1000,
    ),
  };
}
