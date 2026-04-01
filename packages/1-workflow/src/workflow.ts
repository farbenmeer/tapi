import type { Adapter, StepState, WorkflowState } from "./adapter.js";
import { context } from "./context.js";
import { Step } from "./step.js";

export function workflow<I = void>(gen: (input: I) => void) {
  return new Workflow(gen);
}

export class Workflow<I> {
  constructor(private gen: (input: I) => void) {}

  async run(storage: Adapter, state: WorkflowState, abortSignal: AbortSignal) {
    const steps = await storage.getSteps(state.runId);

    while (true) {
      if (abortSignal.aborted) {
        throw new Error(abortSignal.reason);
      }
      try {
        context.stepState = steps;
        this.gen(state.input as I);
        return;
      } catch (v) {
        if (v instanceof Step) {
          const stepState: StepState = {
            runId: state.runId,
            stepId: v.id(),
            result: null,
            error: null,
          };

          try {
            stepState.result = await v.run();
          } catch (error) {
            stepState.error = String(error);
            await storage.putStep(stepState);
            throw error;
          }

          await storage.putStep(stepState);
          steps.set(v.id(), stepState);
          continue;
        }

        throw v;
      }
    }
  }
}
