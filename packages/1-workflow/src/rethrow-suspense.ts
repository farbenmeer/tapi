import { Step } from "./step.js";

export function rethrowSuspense(e: unknown) {
  if (e instanceof Step) {
    throw e;
  }
}
