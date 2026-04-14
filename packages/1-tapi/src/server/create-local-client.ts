import type { ApiDefinition } from "./define-api.js";
import type { Path } from "../shared/path.js";
import type { BaseRoute } from "../shared/route.js";
import type { MaybePromise } from "../shared/maybe-promise.js";
import type { Client } from "../client/client-types.js";
import { createProxy } from "../client/create-proxy.js";
import { handleResponse } from "../client/handle-response.js";
import { createRequestHandler } from "./create-request-handler.js";

export function createLocalClient<
  Routes extends Record<Path, MaybePromise<BaseRoute>>,
>(api: ApiDefinition<Routes>, init: RequestInit = {}): Client<Routes> {
  const handler = createRequestHandler(api);

  function request(url: string, localInit: RequestInit) {
    const headers = new Headers(init.headers);
    new Headers(localInit.headers).forEach((value, key) => {
      headers.set(key, value);
    });
    return handler(
      new Request("http://localhost" + url, {
        ...init,
        ...localInit,
        headers,
      }),
    );
  }

  async function load(url: string, localInit: RequestInit = {}) {
    const res = await request(url, { method: "GET", ...localInit });
    return handleResponse(res);
  }

  function mutate(
    method: string,
    url: string,
    data?: FormData | unknown,
    localInit: RequestInit = {},
  ) {
    const headers = new Headers(localInit.headers);
    if (!(data instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const res = request(url, {
      method,
      body:
        typeof data === "undefined"
          ? undefined
          : data instanceof FormData
          ? data
          : JSON.stringify(data),
      ...localInit,
      headers,
    });
    return Object.assign(res.then((r) => handleResponse(r)), {
      revalidated: Promise.resolve(),
    });
  }

  return new Proxy(() => {}, {
    get(_target, prop: string) {
      return createProxy(
        {
          load,
          mutate,
          revalidate: () => {},
        },
        "",
        prop,
      );
    },
  }) as unknown as Client<Routes>;
}
