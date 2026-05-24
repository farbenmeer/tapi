import crypto from "node:crypto";
import type { Adapter, StepState } from "./adapter.js";
import { context } from "./context.js";
import { FatalError } from "./fatal-error.js";

interface StepConfig {
  attempts?: number;
  baseTimeout?: number;
}

type StepImpl<I, O> = (input: I) => Promise<O>;
type StepRunner<I, O> = (input: I) => Promise<O>;

function hashStep(fn: (...args: any[]) => unknown, input: unknown): string {
  const hash = crypto.createHash("md5");
  if (fn.name) hash.update(fn.name);
  if (fn.toString()) hash.update(fn.toString());
  if (input !== undefined) hash.update(JSON.stringify(input));
  return hash.digest("hex");
}

async function runWithRetries<I, O>(
  fn: StepImpl<I, O>,
  input: I,
  attempts: number,
  baseTimeout: number,
  state: StepState,
  storage: Adapter,
  abortSignal: AbortSignal,
): Promise<O> {
  while (state.attempt < attempts) {
    state.attempt++;
    if (abortSignal.aborted) {
      throw new Error(abortSignal.reason);
    }

    try {
      const result = await fn(input);
      state.result = result;
      state.error = null;
      await storage.putStep(state);
      return result;
    } catch (error) {
      if (error instanceof FatalError) {
        const cause = error.cause ?? error;
        state.error = String(cause);
        await storage.putStep(state);
        throw cause;
      }
      state.error = String(error);
      await storage.putStep(state);
      if (state.attempt === attempts) {
        throw error;
      }
    }

    const delay = baseTimeout * 2 ** (state.attempt - 1);
    await storage.lease(state.runId, delay);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error("Step retry budget exhausted");
}

export function step<I, O>(
  config: StepConfig,
  run: StepImpl<I, O>,
): StepRunner<I, O>;
export function step<I, O>(run: StepImpl<I, O>): StepRunner<I, O>;
export function step<I, O>(
  arg0: StepConfig | StepImpl<I, O>,
  arg1?: StepImpl<I, O>,
): StepRunner<I, O> {
  const config = typeof arg0 === "function" ? {} : arg0;
  const fn = typeof arg0 === "function" ? arg0 : arg1!;
  const attempts = config.attempts ?? 3;
  const baseTimeout = config.baseTimeout ?? 250;

  return async (input: I): Promise<O> => {
    const ctx = context.getStore();
    if (!ctx) {
      throw new Error("step() must be called from inside a workflow");
    }

    const callIndex = ctx.callIndex++;
    const stepId = `${hashStep(fn, input)}:${callIndex}`;

    const cached = ctx.stepState.get(stepId);
    if (cached) {
      if (cached.error !== null) {
        throw new Error(cached.error);
      }
      return cached.result as O;
    }

    const state: StepState = {
      runId: ctx.runId,
      stepId,
      result: null,
      error: null,
      attempt: 0,
    };
    ctx.stepState.set(stepId, state);

    return await runWithRetries(
      fn,
      input,
      attempts,
      baseTimeout,
      state,
      ctx.storage,
      ctx.abortSignal,
    );
  };
}
