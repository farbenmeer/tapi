import { Step } from "./step";

export function rethrowSuspense(e: unknown) {
  if (e instanceof Step) {
    throw e;
  }
}
