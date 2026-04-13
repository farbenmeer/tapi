import type { ApiDefinition } from "./define-api.js";
import type { Path } from "../shared/path.js";
import type { BaseRoute } from "../shared/route.js";
import { createFetchClient } from "../client/create-fetch-client.js";
import { createRequestHandler } from "./create-request-handler.js";
import type { MaybePromise } from "../shared/maybe-promise.js";

export function createLocalClient<
  Routes extends Record<Path, MaybePromise<BaseRoute>>,
>(api: ApiDefinition<Routes>, init: RequestInit = {}) {
  const handler = createRequestHandler(api);
  return createFetchClient<Routes>("http://localhost", {
    fetch(url, localInit) {
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
    },
  });
}
