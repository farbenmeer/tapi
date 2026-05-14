import crypto from "node:crypto";
import { context } from "./context.js";
import type { Adapter, StepState } from "./adapter.js";
import { FatalError } from "./fatal-error.js";

interface StepConfig {
  attempts?: number;
  baseTimeout?: number;
}

export class Step<I = unknown> {
  private attempts: number;
  private baseTimeout: number;

  constructor(
    private fn: (input: I) => Promise<unknown>,
    private input: I,
    { attempts = 3, baseTimeout = 250 }: StepConfig,
  ) {
    this.attempts = attempts;
    this.baseTimeout = baseTimeout;
  }

  async run(storage: Adapter, state: StepState, abortSignal: AbortSignal) {
    while (state.attempt < this.attempts) {
      state.attempt++;
      if (abortSignal.aborted) {
        throw new Error(abortSignal.reason);
      }

      try {
        state.result = await this.fn(this.input);
        state.error = null;
        return;
      } catch (error) {
        if (error instanceof FatalError) {
          state.error = String(error.cause ?? error);
          throw error.cause ?? error;
        }
        state.error = String(error);
        if (state.attempt === this.attempts) {
          throw error;
        }
      } finally {
        await storage.putStep(state);
      }

      const delay = this.baseTimeout * Math.pow(2, state.attempt - 1);

      await storage.lease(state.runId, delay);

      await new Promise((resolve) =>
        setTimeout(resolve, this.baseTimeout * Math.pow(2, state.attempt - 1)),
      );
    }
  }

  id() {
    const hash = crypto.createHash("md5");

    if (this.fn.name) hash.update(this.fn.name);
    if (this.fn.toString()) hash.update(this.fn.toString());
    if (this.input) hash.update(JSON.stringify(this.input));

    return hash.digest("hex");
  }
}

interface StepImpl<I, O> {
  (input: I): Promise<O>;
}

interface RunStep<I, O> {
  (input: I): O;
}

export function step<I, O>(
  config: StepConfig,
  run: StepImpl<I, O>,
): RunStep<I, O>;
export function step<I, O>(run: StepImpl<I, O>): RunStep<I, O>;
export function step<I, O>(
  arg0: StepConfig | StepImpl<I, O>,
  arg1?: StepImpl<I, O>,
) {
  const config = typeof arg0 === "function" ? {} : arg0;
  const run = typeof arg0 === "function" ? arg0 : arg1!;
  return (input: I) => {
    const step = new Step(run, input, config);
    const state = context.stepState.get(step.id());
    if (state?.errorObject) {
      throw state.errorObject;
    }
    if (state && !state.error) {
      return state.result as O;
    }
    throw step;
  };
}
