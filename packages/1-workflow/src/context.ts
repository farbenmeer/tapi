import { AsyncLocalStorage } from "node:async_hooks";
import type { Adapter, StepState } from "./adapter.js";

export interface RunContext {
  runId: string;
  storage: Adapter;
  abortSignal: AbortSignal;
  stepState: Map<string, StepState>;
  callIndex: number;
}

export const context = new AsyncLocalStorage<RunContext>();
