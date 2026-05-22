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
  // Store the observable alongside the value so stale data from a previous
  // observable is not returned when the observable reference changes.
  const [cached, setCached] = React.useState<
    { observable: ObservablePromise<T>; value: T } | typeof noValue
  >(noValue);

  React.useEffect(() => {
    const unsubscribe = observable.subscribe((next) => {
      startTransition(async () => {
        setCached({ observable, value: await next });
      });
    });
    return unsubscribe;
  }, [observable]);

  const data =
    cached !== noValue && cached.observable === observable
      ? cached.value
      : noValue;
  return data === noValue ? React.use(observable) : data;
}
