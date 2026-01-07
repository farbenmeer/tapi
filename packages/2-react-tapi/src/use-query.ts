import type { Observable } from "@farbenmeer/tapi/client";
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
  const [data, setData] = React.useState<T>();

  React.useEffect(() => {
    const unsubscribe = observable.subscribe((next) => {
      startTransition(async () => {
        setData(await next);
      });
    });
    return unsubscribe;
  }, [observable]);

  return data ?? React.use(observable);
}
