import { and, asc, desc, eq, isNull, lt, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { Adapter, StepState, WorkflowState } from "../adapter";
import { stepState, workflowState } from "./schema-sqlite";

const now = () => sql<number>`unixepoch()`;
const inXSeconds = (leaseDuration: number) =>
  sql<number>`unixepoch() + ${leaseDuration}`;
const oneSecondAgo = () => sql<number>`unixepoch() - 1`;

export class DrizzleSqliteAdapter implements Adapter {
  constructor(private db: BetterSQLite3Database) {}

  async createWorkflow(input: {
    workflowId: string;
    input: unknown;
  }): Promise<WorkflowState> {
    const [result] = await this.db
      .insert(workflowState)
      .values({
        workflowId: input.workflowId,
        runId: crypto.randomUUID(),
        error: null,
        input: input.input,
        leaseExpiredAt: 0,
        startedAt: now(),
        finishedAt: null,
      })
      .returning();

    if (!result) {
      throw new Error("Failed to create workflow");
    }

    return mapWorkflowState(result);
  }

  async renewLease(runId: string, leaseDuration: number): Promise<void> {
    await this.db
      .update(workflowState)
      .set({
        leaseExpiredAt: inXSeconds(leaseDuration),
      })
      .where(eq(workflowState.runId, runId));
  }

  async getLastestRun(
    workflowId: string,
    input: unknown,
  ): Promise<WorkflowState | null> {
    const [result] = await this.db
      .select()
      .from(workflowState)
      .where(
        and(
          eq(workflowState.workflowId, workflowId),
          eq(workflowState.input, input),
        ),
      )
      .orderBy(desc(workflowState.startedAt))
      .limit(1);

    return result ? mapWorkflowState(result) : null;
  }

  async getNextWorkflow(leaseDuration: number): Promise<WorkflowState | null> {
    const [running] = await this.db
      .update(workflowState)
      .set({
        leaseExpiredAt: inXSeconds(leaseDuration),
      })
      .where(
        and(
          isNull(workflowState.finishedAt),
          lt(workflowState.leaseExpiredAt, oneSecondAgo()),
        ),
      )
      .orderBy(asc(workflowState.startedAt))
      .limit(1)
      .returning();

    if (running) {
      return mapWorkflowState(running);
    }

    return null;
  }

  async finishWorkflow(runId: string): Promise<void> {
    await this.db
      .update(workflowState)
      .set({
        finishedAt: now(),
      })
      .where(eq(workflowState.runId, runId));
  }

  async failWorkflow(runId: string, error: string): Promise<void> {
    await this.db
      .update(workflowState)
      .set({
        finishedAt: now(),
        error,
      })
      .where(eq(workflowState.runId, runId));
  }

  async getSteps(runId: string): Promise<Map<string, StepState>> {
    const steps = await this.db
      .select()
      .from(stepState)
      .where(eq(stepState.runId, runId));

    return new Map(steps.map((step) => [step.stepId, step]));
  }

  async putStep(state: StepState): Promise<void> {
    await this.db
      .insert(stepState)
      .values({
        runId: state.runId,
        stepId: state.stepId,
        result: state.result,
        error: state.error,
        attempt: state.attempt,
      })
      .onConflictDoUpdate({
        target: [stepState.runId, stepState.stepId],
        set: {
          result: state.result,
          error: state.error,
          attempt: state.attempt,
        },
      });
  }
}

function mapWorkflowState(
  result: typeof workflowState.$inferSelect,
): WorkflowState {
  return {
    workflowId: result.workflowId,
    runId: result.runId,
    error: result.error,
    input: result.input,
    startedAt: new Date(result.startedAt),
    finishedAt: result.finishedAt ? new Date(result.finishedAt) : null,
    leaseExpiredAt: new Date(result.leaseExpiredAt),
  };
}
