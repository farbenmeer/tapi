import type { StepState } from "./adapter.js";

export interface Context {
  stepState: Map<string, StepState & { errorObject?: unknown }>;
}

export const context: Context = {
  stepState: new Map(),
};
