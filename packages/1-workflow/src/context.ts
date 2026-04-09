import type { StepState } from "./adapter";

export interface Context {
  stepState: Map<string, StepState>;
}

export const context: Context = {
  stepState: new Map(),
};
