import type { Observable } from "@toapi/common";
import * as React from "react";

type ObservablePromise<T> = Promise<T> & Observable<T>;

interface Options {
  startTransition?: typeof React.startTransition;
}

export function useQuery<T>(
  query: ObservablePromise<T> | (() => ObservablePromise<T>),
  { startTransition = React.startTransition }: Options = {}
) {
  const observable = React.useMemo(
    typeof query === "function" ? query : () => query,
    [query]
  );
  // The value is kept together with the observable it was loaded for.
  // Revalidation pushes a new promise for the *same* query, so the stored
  // value stays valid; a different query invalidates it and we fall back to
  // `use`, which suspends instead of rendering the previous query's data.
  const [state, setState] = React.useState<{
    source: ObservablePromise<T>;
    value: T;
  } | null>(null);

  React.useEffect(() => {
    let active = true;
    const unsubscribe = observable.subscribe((next) => {
      startTransition(async () => {
        const value = await next;
        // A late update from a subscription we have already left behind must
        // not overwrite the current one.
        if (active) setState({ source: observable, value });
      });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [observable]);

  return state !== null && state.source === observable
    ? state.value
    : React.use(observable);
}
