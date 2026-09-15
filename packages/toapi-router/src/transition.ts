import { startTransition, type TransitionFunction } from "react";

export type UseTransitionParameter =
  ((scope: TransitionFunction) => void) | boolean;

export function runTransition(
  p: UseTransitionParameter | undefined,
  scope: TransitionFunction,
) {
  if (p === false) {
    scope();
    return;
  }
  if (typeof p === "function") {
    p(scope);
    return;
  }
  startTransition(scope);
}
