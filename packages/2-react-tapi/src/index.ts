import type { Observable } from "@farbenmeer/tapi/client";
import * as React from "react";
import { lacy } from "@farbenmeer/lacy";

type ObservablePromise<T> = Promise<T> & Observable<T>;

interface Options {
  startTransition?: typeof React.startTransition;
  onError?: (error: Error) => void;
  swr?: boolean;
}

export function useQuery<T>(
  query: ObservablePromise<T> | (() => ObservablePromise<T>),
  options: Options = {}
) {
  const optionsRef = React.useRef(options);
  optionsRef.current = options;
  const [data, setData] = React.useState<Promise<T>>(query);

  React.useEffect(() => {
    const unsubscribe = (data as ObservablePromise<T>).subscribe((next) => {
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
  }, []);

  return React.useMemo(() => lacy(data), [data]);
}
