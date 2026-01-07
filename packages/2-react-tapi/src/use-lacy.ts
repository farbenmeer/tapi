import type { Observable } from "@farbenmeer/tapi/client";
import * as React from "react";
import { lacy } from "@farbenmeer/lacy";

type ObservablePromise<T> = Promise<T> & Observable<T>;

interface Options {
  startTransition?: typeof React.startTransition;
  onError?: (error: Error) => void;
  swr?: boolean;
}

export function useLacy<T>(
  query: ObservablePromise<T> | (() => ObservablePromise<T>),
  options: Options = {}
) {
  const optionsRef = React.useRef(options);
  optionsRef.current = options;
  const observable = React.useMemo(
    typeof query === "function" ? query : () => query,
    [query]
  );
  const [data, setData] = React.useState<Promise<T>>(observable);

  React.useEffect(() => {
    const unsubscribe = observable.subscribe((next) => {
      const {
        startTransition = React.startTransition,
        onError,
        swr,
      } = optionsRef.current;
      startTransition(async () => {
        if (swr) {
          try {
            await next;
            setData(next);
          } catch (error) {
            onError?.(error as Error);
          }
        } else {
          setData(next);
          try {
            await next;
          } catch (error) {
            onError?.(error as Error);
          }
        }
      });
    });
    return unsubscribe;
  }, [observable]);

  return React.useMemo(() => lacy(data), [data]);
}
