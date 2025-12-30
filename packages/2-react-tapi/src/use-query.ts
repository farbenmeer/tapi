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
  const [data, setData] = React.useState<Promise<T>>(query);

  React.useEffect(() => {
    const unsubscribe = (data as ObservablePromise<T>).subscribe((next) => {
      startTransition(async () => {
        await next;
        setData(next);
      });
    });
    return unsubscribe;
  }, []);

  return React.use(data);
}
