import { type Observable } from "@toapi/common";
import * as React from "react";

type ObservablePromise<T> = Promise<T> & Observable<T>;

interface Options {
  startTransition?: typeof React.startTransition;
  onStatusChange?(status: "loading" | "idle"): void;
}

export function useQuery<T>(
  // TODO remove the useless function-form in next major release
  query: ObservablePromise<T> | (() => ObservablePromise<T>),
  { startTransition = React.startTransition, onStatusChange }: Options = {},
) {
  const observable = typeof query === "function" ? query() : query;
  const queryKey = observable.queryKey;
  const initialObservable = React.useMemo(() => observable, [queryKey]);

  const [state, setState] = React.useState<{
    promise: Promise<T>;
    queryKey: string;
    value: T;
  } | null>(null);

  React.useEffect(() => {
    let active = true;
    let emitted = 0;
    let applied = 0;
    const unsubscribe = observable.subscribe(async (next) => {
      const seq = ++emitted;
      onStatusChange?.("loading");
      try {
        const value = await next;
        // A late update from a subscription we have already left behind must
        // not overwrite the current one.
        if (!active || seq < applied) return;
        applied = seq;
        startTransition(() => setState({ promise: next, queryKey, value }));
      } finally {
        if (!active || seq < applied) return;
        applied = seq;
        onStatusChange?.("idle");
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [queryKey, startTransition]);

  if (!state) {
    return React.use(observable);
  }

  if (state.queryKey !== initialObservable.queryKey) {
    return React.use(initialObservable);
  }

  if (state.promise === initialObservable) {
    return React.use(initialObservable);
  }

  return state.value;
}
