import type { ApiDefinition } from "./define-api.js";
import type { Path } from "../shared/path.js";
import type { BaseRoute } from "../shared/route.js";
import { createFetchClient } from "../client/create-fetch-client.js";
import { createRequestHandler } from "./create-request-handler.js";
import type { MaybePromise } from "../shared/maybe-promise.js";

export function createLocalClient<
  Routes extends Record<Path, MaybePromise<BaseRoute>>
>(api: ApiDefinition<Routes>) {
  const handler = createRequestHandler(api);
  return createFetchClient<Routes>("http://localhost", {
    fetch(url, init) {
      const req = new Request(url, init);
      return handler(req);
    },
  });
}
