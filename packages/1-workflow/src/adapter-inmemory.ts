import { isDeepStrictEqual } from "node:util";
import type {
  Adapter,
  ListOptions,
  Page,
  StepState,
  WorkflowState,
} from "./adapter";
import crypto from "node:crypto";

export class InMemoryAdapter implements Adapter {
  workflows = new Map<string, WorkflowState>();
  steps = new Map<string, StepState>();

  getLastestRun(
    workflowId: string,
    input: unknown,
  ): Promise<WorkflowState | null> {
    return Promise.resolve(
      Array.from(this.workflows.values())
        .filter(
          (wf) =>
            wf.workflowId === workflowId && isDeepStrictEqual(wf.input, input),
        )
        .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())
        .pop() ?? null,
    );
  }
  getNextWorkflow(leaseDuration: number): Promise<WorkflowState | null> {
    const wf = Array.from(this.workflows.values())
      .filter(
        (wf) => !wf.finishedAt && wf.leaseExpiredAt.getTime() <= Date.now(),
      )
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())
      .pop();

    if (!wf) return Promise.resolve(null);

    wf.leaseExpiredAt = new Date(Date.now() + leaseDuration * 1000);

    return Promise.resolve(wf);
  }
  createWorkflow(input: {
    workflowId: string;
    input: unknown;
  }): Promise<WorkflowState> {
    const wf: WorkflowState = {
      workflowId: input.workflowId,
      runId: crypto.randomUUID(),
      error: null,
      input: input.input,
      startedAt: new Date(),
      finishedAt: null,
      leaseExpiredAt: new Date(0),
    };
    this.workflows.set(wf.runId, wf);
    return Promise.resolve(wf);
  }
  failWorkflow(runId: string, error: string): Promise<void> {
    const wf = this.workflows.get(runId);
    if (!wf) return Promise.resolve();
    wf.error = error;
    wf.finishedAt = new Date();
    return Promise.resolve();
  }
  lease(runId: string, leaseDuration: number): Promise<void> {
    const wf = this.workflows.get(runId);
    if (!wf) return Promise.resolve();
    wf.leaseExpiredAt = new Date(
      Math.max(Date.now() + leaseDuration * 1000, wf.leaseExpiredAt.getTime()),
    );
    return Promise.resolve();
  }
  finishWorkflow(runId: string): Promise<void> {
    const wf = this.workflows.get(runId);
    if (!wf) return Promise.resolve();
    wf.finishedAt = new Date();
    return Promise.resolve();
  }
  getSteps(runId: string): Promise<Map<string, StepState>> {
    return Promise.resolve(
      new Map(
        Array.from(this.steps.values())
          .filter((step) => step.runId === runId)
          .map((step) => [step.stepId, step]),
      ),
    );
  }
  putStep(state: StepState): Promise<void> {
    this.steps.set(`${state.runId}:${state.stepId}`, state);
    return Promise.resolve();
  }
  listWorkflows(options: ListOptions = {}): Promise<Page> {
    const { cursor, pageSize = 30, page = 1 } = options;
    const workflows = Array.from(this.workflows.values()).sort(
      (a, b) => b.startedAt.getTime() - a.startedAt.getTime(),
    );

    if (options.cursor) {
      const page: WorkflowState[] = [];
      let cursorFound = false;
      for (const workflow of workflows) {
        if (workflow.runId === cursor) {
          cursorFound = true;
        }
        if (page.length > pageSize) {
          return Promise.resolve({
            nextCursor: workflow.runId,
            workflows: page,
          });
        }
        if (cursorFound) {
          page.push(workflow);
        }
      }
      return Promise.resolve({
        nextCursor: null,
        workflows: page,
      });
    }

    const startIndex = (page - 1) * pageSize;
    return Promise.resolve({
      nextCursor: workflows[startIndex + pageSize + 1]?.runId ?? null,
      workflows: workflows.slice(startIndex, startIndex + pageSize),
    });
  }
}
