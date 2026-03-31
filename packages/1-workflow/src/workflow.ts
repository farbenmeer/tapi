import type { Adapter, WorkflowState } from "./adapter.js";
import { context } from "./context.js";
import { Step } from "./step.js";

export function workflow<I>(gen: (input: I) => void) {
  return new Workflow(gen);
}

export class Workflow<I> {
  __t: I = undefined as I;
  constructor(private gen: (input: I) => void) {}

  async run(storage: Adapter, state: WorkflowState) {
    const steps = await storage.getSteps(state.runId);

    while (true) {
      try {
        context.stepState = steps;
        this.gen(state.input as I);
        return;
      } catch (v) {
        if (v instanceof Step) {
          const result = await v.run();
          const step = {
            runId: state.runId,
            stepId: v.id(),
            result,
            error: null,
          };
          await storage.putStep(step);
          steps.set(v.id(), step);
          continue;
        }

        throw v;
      }
    }
  }
}
