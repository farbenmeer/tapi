import { use, useEffect, useMemo, useRef } from "react";

interface Options {
  method?: string;
  headers?: HeadersInit;
}

export function useFetch(url: string, options?: Options) {
  const abortController = useRef(new AbortController());

  const headers = new Headers(options?.headers);

  const stableHeaders = useMemo(() => headers, headersDeps(headers));
  const method = options?.method;

  const res = useMemo(
    () =>
      fetch(url, {
        method: method,
        headers: stableHeaders,
        signal: abortController.current.signal,
      }),
    [url, stableHeaders, method],
  );

  useEffect(() => () => abortController.current.abort(), []);

  return use(res);
}

function headersDeps(headers: Headers) {
  return Array.from(headers)
    .map((header) => header.join("="))
    .sort();
}
