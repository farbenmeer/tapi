import type { BaseRoute, MaybePromise, Path } from "@toapi/common";
import type { ApiDefinition } from "./define-api.js";
import { createRequestHandler } from "./create-request-handler.js";

export function createLocalFetch<
  Routes extends Record<Path, MaybePromise<BaseRoute>>,
>(api: ApiDefinition<Routes>, init: RequestInit = {}) {
  const handler = createRequestHandler(api);
  return function localFetch(
    url: URL | RequestInfo,
    localInit: RequestInit = {},
  ) {
    const headers = new Headers(init.headers);
    new Headers(localInit.headers).forEach((value, key) => {
      headers.set(key, value);
    });
    const req = new Request(url, {
      ...init,
      ...localInit,
      headers,
    });
    return handler(req);
  };
}
