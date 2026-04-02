export interface WorkflowState {
  workflowId: string;
  runId: string;
  error: string | null;
  input: unknown;
  startedAt: Date;
  finishedAt: Date | null;
  leaseExpiredAt: Date;
}

export interface StepState {
  runId: string;
  stepId: string;
  result: unknown;
  error: string | null;
  attempt: number;
}

export interface Adapter {
  getLastestRun(
    workflowId: string,
    input: unknown,
  ): Promise<WorkflowState | null>;
  getNextWorkflow(leaseDuration: number): Promise<WorkflowState | null>;
  createWorkflow(input: {
    workflowId: string;
    input: unknown;
  }): Promise<WorkflowState>;
  failWorkflow(runId: string, error: string): Promise<void>;
  lease(runId: string, leaseDuration: number): Promise<void>;
  finishWorkflow(runId: string): Promise<void>;
  getSteps(runId: string): Promise<Map<string, StepState>>;
  putStep(state: StepState): Promise<void>;
}
