import {
  DummyDriver,
  Kysely,
  PostgresAdapter as KyselyPostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
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

export interface PostgresDatabase {
  query(sql: string, params?: unknown[]): Promise<{ rows: unknown[] }>;
}

const now = () => sql<number>`EXTRACT(EPOCH FROM NOW())::integer`;
const inXSeconds = (seconds: number) =>
  sql<number>`(EXTRACT(EPOCH FROM NOW()) + ${seconds})::integer`;

const qb = new Kysely<DB>({
  dialect: {
    createAdapter: () => new KyselyPostgresAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (db) => new PostgresIntrospector(db),
    createQueryCompiler: () => new PostgresQueryCompiler(),
  },
});

export class PostgresAdapter implements Adapter {
  constructor(protected db: PostgresDatabase) {}

  private async all<T>(compiled: {
    sql: string;
    parameters: readonly unknown[];
  }): Promise<T[]> {
    const { rows } = await this.db.query(compiled.sql, [
      ...compiled.parameters,
    ]);
    return rows as T[];
  }

  async createWorkflow(input: {
    workflowId: string;
    input: unknown;
  }): Promise<WorkflowState> {
    const rows = await this.all<DB["workflow_state"]>(
      qb
        .insertInto("workflow_state")
        .values({
          workflow_id: input.workflowId,
          run_id: crypto.randomUUID(),
          error: null,
          input: sql`${JSON.stringify(input.input)}::jsonb`,
          lease_expired_at: 0,
          started_at: now(),
          finished_at: null,
          resume_at: 0,
        })
        .returningAll()
        .compile(),
    );

    const result = rows[0];
    if (!result) throw new Error("Failed to create workflow");
    return mapWorkflowState(result);
  }

  async lease(runId: string, leaseDuration: number): Promise<void> {
    await this.all(
      qb
        .updateTable("workflow_state")
        .set({
          lease_expired_at: inXSeconds(leaseDuration),
        })
        .where("run_id", "=", runId)
        .where("lease_expired_at", "<", inXSeconds(leaseDuration))
        .compile(),
    );
  }

  async getLastestRun(
    workflowId: string,
    input: unknown,
  ): Promise<WorkflowState | null> {
    const rows = await this.all<DB["workflow_state"]>(
      qb
        .selectFrom("workflow_state")
        .selectAll()
        .where("workflow_id", "=", workflowId)
        .where("input", "=", sql<any>`${JSON.stringify(input)}::jsonb`)
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
      .where("lease_expired_at", "<=", now())
      .orderBy("started_at", "asc")
      .limit(1)
      .forUpdate()
      .skipLocked();

    const rows = await this.all<DB["workflow_state"]>(
      qb
        .updateTable("workflow_state")
        .set({
          lease_expired_at: inXSeconds(leaseDuration),
        })
        .where("run_id", "=", subquery)
        .returningAll()
        .compile(),
    );

    return rows[0] ? mapWorkflowState(rows[0]) : null;
  }

  async finishWorkflow(runId: string): Promise<void> {
    await this.all(
      qb
        .updateTable("workflow_state")
        .set({
          finished_at: now(),
        })
        .where("run_id", "=", runId)
        .compile(),
    );
  }

  async failWorkflow(runId: string, error: string): Promise<void> {
    await this.all(
      qb
        .updateTable("workflow_state")
        .set({
          finished_at: now(),
          error,
        })
        .where("run_id", "=", runId)
        .compile(),
    );
  }

  async getSteps(runId: string): Promise<Map<string, StepState>> {
    const steps = await this.all<DB["workflow_step_state"]>(
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
          result: step.result as unknown,
          error: step.error,
          attempt: step.attempt as unknown as number,
        },
      ]),
    );
  }

  async putStep(state: StepState): Promise<void> {
    await this.all(
      qb
        .insertInto("workflow_step_state")
        .values({
          run_id: state.runId,
          step_id: state.stepId,
          result: state.result != null ? sql`${JSON.stringify(state.result)}::jsonb` : null,
          error: state.error,
          attempt: state.attempt,
        })
        .onConflict((oc) =>
          oc.columns(["run_id", "step_id"]).doUpdateSet({
            result: state.result != null ? sql`${JSON.stringify(state.result)}::jsonb` : null,
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
      const workflows = await this.all<DB["workflow_state"]>(
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

    const workflows = await this.all<DB["workflow_state"]>(
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
    | "lease_expired_at"
  >,
): WorkflowState {
  return {
    workflowId: result.workflow_id,
    runId: result.run_id,
    error: result.error,
    input: result.input,
    startedAt: new Date(
      (typeof result.started_at === "number" ? result.started_at : 0) * 1000,
    ),
    finishedAt: result.finished_at ? new Date(result.finished_at * 1000) : null,
    leaseExpiredAt: new Date(
      (typeof result.lease_expired_at === "number"
        ? result.lease_expired_at
        : 0) * 1000,
    ),
  };
}
