import type { MaybePromise } from "bun";
import type { ReactQueryClient } from "./client";
import { handleResponse } from "./handle-response";
import type { Path as BasePath } from "./path";
import type { BaseRoute } from "./route";
import { TagManager } from "./tag-manager";

const globalFetch = fetch;

interface Options {
  fetch?: (url: string, init: RequestInit) => Promise<Response>;
  queryClient: {
    invalidateQueries(options: { queryKey: string[] }): void;
  };
}

export function createReactQueryClient<
  Routes extends Record<BasePath, MaybePromise<BaseRoute>>
>(apiUrl: string, options: Options) {
  const tagManager = new TagManager();
  return new Proxy(() => {}, {
    get(_target, prop: string) {
      return createProxy(tagManager, apiUrl, options, prop);
    },
  }) as unknown as ReactQueryClient<Routes>;
}

function createProxy(
  tagManager: TagManager,
  baseUrl: string,
  options: Options,
  lastProp: string
) {
  const fetch = options.fetch ?? globalFetch;
  return new Proxy(() => {}, {
    get(_target, prop: string) {
      return createProxy(tagManager, baseUrl + "/" + lastProp, options, prop);
    },
    async apply(_target, _thisArg, args) {
      switch (lastProp) {
        case "get": {
          const headers = new Headers(args[1]?.headers);
          const searchParams = new URLSearchParams(args[0]);
          const url =
            searchParams.size > 0 ? baseUrl + "?" + searchParams : baseUrl;

          return {
            queryKey: [url],
            queryFn: async () => {
              const res = await fetch(url, {
                method: lastProp.toUpperCase(),
                ...(args[1] ?? {}),
                headers,
              });
              tagManager.add(res);
              return handleResponse(res);
            },
          };
        }
        case "post": {
          if (args[0] instanceof FormData) {
            const res = await fetch(baseUrl, {
              method: lastProp,
              body: args[0],
            });
            const stale = tagManager.remove(res);
            for (const url of stale) {
              options.queryClient.invalidateQueries({ queryKey: [url] });
            }
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
          const stale = tagManager.remove(res);
          for (const url of stale) {
            options.queryClient.invalidateQueries({ queryKey: [url] });
          }
          return handleResponse(res);
        }
        default:
          throw new Error(`Tapi: Unsupported method: ${lastProp}`);
      }
    },
  });
}
