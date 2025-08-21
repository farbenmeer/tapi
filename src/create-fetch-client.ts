import type { MaybePromise } from "bun";
import type { Client } from "./client";
import { handleResponse } from "./handle-response";
import type { Path as BasePath } from "./path";
import type { BaseRoute } from "./route";

const globalFetch = fetch;

interface Options {
  fetch?: (url: string, init: RequestInit) => Promise<Response>;
}

export function createFetchClient<
  Routes extends Record<BasePath, MaybePromise<BaseRoute>>
>(apiUrl: string, options: Options = {}) {
  return new Proxy(() => {}, {
    get(_target, prop: string) {
      return createProxy(apiUrl, options, prop);
    },
  }) as unknown as Client<Routes>;
}

function createProxy(baseUrl: string, options: Options, lastProp: string) {
  const fetch = options.fetch ?? globalFetch;
  return new Proxy(() => {}, {
    get(_target, prop: string) {
      return createProxy(baseUrl + "/" + lastProp, options, prop);
    },
    async apply(_target, _thisArg, args) {
      switch (lastProp) {
        case "get": {
          const headers = new Headers(args[1]?.headers);
          const searchParams = new URLSearchParams(args[0]);
          const res = await fetch(
            searchParams.size > 0 ? baseUrl + "?" + searchParams : baseUrl,
            {
              method: lastProp.toUpperCase(),
              ...(args[1] ?? {}),
              headers,
            }
          );

          return handleResponse(res);
        }
        case "post": {
          if (args[0] instanceof FormData) {
            const res = await fetch(baseUrl, {
              method: lastProp,
              body: args[0],
            });
            return handleResponse(res);
          }

          const headers = new Headers(args[2]?.headers);

          if (!(args[1] instanceof FormData) && !headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
          }

          const searchParams = new URLSearchParams(args[0]);

          const res = await fetch(
            searchParams.size > 0 ? baseUrl + "?" + searchParams : baseUrl,
            {
              method: lastProp.toUpperCase(),
              body:
                args[1] instanceof FormData ? args[1] : JSON.stringify(args[1]),
              ...(args[2] ?? {}),
              headers,
            }
          );
          return handleResponse(res);
        }
        default:
          throw new Error(`Tapi: Unsupported method: ${lastProp}`);
      }
    },
  });
}
