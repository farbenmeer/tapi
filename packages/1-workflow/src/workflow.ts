import type { Adapter, WorkflowState } from "./adapter.js";
import { context, type RunContext } from "./context.js";

export function workflow<I = void>(gen: (input: I) => Promise<void>) {
  return new Workflow(gen);
}

export class Workflow<I> {
  constructor(private gen: (input: I) => Promise<void>) {}

  async run(storage: Adapter, state: WorkflowState, abortSignal: AbortSignal) {
    const steps = await storage.getSteps(state.runId);
    const ctx: RunContext = {
      runId: state.runId,
      storage,
      abortSignal,
      stepState: steps,
      callIndex: 0,
    };
    await context.run(ctx, () => this.gen(state.input as I));
  }
}
