import type { MaybePromise } from "bun";
import type { ApiDefinition } from "./define-api";
import type { Path } from "../shared/path";
import type { BaseRoute } from "../shared/route";
import { createFetchClient } from "../client/create-fetch-client";
import { createRequestHandler } from "./create-request-handler";

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
