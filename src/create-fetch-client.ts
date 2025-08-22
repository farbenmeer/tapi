import type { MaybePromise } from "bun";
import type { Client } from "./client";
import { handleResponse } from "./handle-response";
import type { Path as BasePath } from "./path";
import type { BaseRoute } from "./route";
import { TagManager } from "./tag-manager";

const globalFetch = fetch;

interface Options {
  fetch?: (url: string, init: RequestInit) => Promise<Response>;
  cache?: DataCache;
}

export interface DataCache {
  get(url: string): Promise<any> | null;
  add(url: string, res: Promise<Response>, data: Promise<any>): Promise<void>;
  remove(url: string): Promise<void>;
}

export function createFetchClient<
  Routes extends Record<BasePath, MaybePromise<BaseRoute>>
>(apiUrl: string, options: Options = {}) {
  const tagManager = options.cache && new TagManager();
  return new Proxy(() => {}, {
    get(_target, prop: string) {
      return createProxy(tagManager, apiUrl, options, prop);
    },
  }) as unknown as Client<Routes>;
}

function createProxy(
  tagManager: TagManager | undefined,
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
        case "revalidate": {
          const searchParams = new URLSearchParams(args[0]);
          const url =
            searchParams.size > 0 ? baseUrl + "?" + searchParams : baseUrl;
          await options.cache?.remove(url);
          tagManager?.removeUrl(url);
          return;
        }
        case "get": {
          const headers = new Headers(args[1]?.headers);
          const searchParams = new URLSearchParams(args[0]);
          const url =
            searchParams.size > 0 ? baseUrl + "?" + searchParams : baseUrl;

          const cached = options.cache?.get(url);
          if (cached) return cached;

          const responsePromise = fetch(url, {
            method: lastProp.toUpperCase(),
            ...(args[1] ?? {}),
            headers,
          });
          const data = responsePromise.then(handleResponse);

          await options.cache?.add(url, responsePromise, data);

          const res = await responsePromise;
          tagManager?.add(res);

          return data;
        }
        case "post": {
          if (args[0] instanceof FormData) {
            const res = await fetch(baseUrl, {
              method: lastProp,
              body: args[0],
            });
            for (const url of tagManager?.remove(res) ?? []) {
              await options.cache?.remove(url);
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
          for (const url of tagManager?.remove(res) ?? []) {
            await options.cache?.remove(url);
          }
          return handleResponse(res);
        }
        default:
          throw new Error(`Tapi: Unsupported method: ${lastProp}`);
      }
    },
  });
}
