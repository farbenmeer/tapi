import type { Observable } from "@farbenmeer/tapi/client";
import * as React from "react";

type ObservablePromise<T> = Promise<T> & Observable<T>;

interface Options {
  startTransition?: typeof React.startTransition;
}

const noValue = Symbol("ReactTApi:noValue");

export function useQuery<T>(
  query: ObservablePromise<T> | (() => ObservablePromise<T>),
  { startTransition = React.startTransition }: Options = {}
) {
  const observable = React.useMemo(
    typeof query === "function" ? query : () => query,
    [query]
  );
  const [data, setData] = React.useState<T | typeof noValue>(noValue);

  React.useEffect(() => {
    const unsubscribe = observable.subscribe((next) => {
      startTransition(async () => {
        setData(await next);
      });
    });
    return unsubscribe;
  }, [observable]);

  return data === noValue ? React.use(observable) : data;
}
