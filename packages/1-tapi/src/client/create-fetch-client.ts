import { INVALIDATION_POST_EVENT, INVALIDATIONS_ROUTE, TAGS_HEADER } from "../shared/constants.js";
import type { MaybePromise } from "../shared/maybe-promise.js";
import type { Path as BasePath } from "../shared/path.js";
import type { BaseRoute } from "../shared/route.js";
import { Cache } from "./cache.js";
import type { Client, Revalidating } from "./client-types.js";
import { handleResponse } from "./handle-response.js";

const globalFetch = fetch;

async function listenForInvalidations(url: string, cache: Cache) {
  const MAX_ATTEMPTS = 1000;
  for (let retry = 0; retry < MAX_ATTEMPTS; retry++) {
    try {
      const res = await globalFetch(url);
      if (!res.ok || !res.body) break;

      let buffer = "";
      const decoder = new TextDecoder();
      for await (const chunk of res.body) {
        buffer += decoder.decode(chunk);
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const rawTags = line.trim();
          if (!rawTags) continue;
          await cache.revalidateTags(rawTags.split(" "));
        }
      }
    } catch {
      // network error — retry below
    }
    await new Promise((resolve) =>
      setTimeout(resolve, 500 * Math.pow(2, Math.min(retry, 10)))
    );
  }
}

interface Hooks {
  error?: (error: unknown) => void | Promise<void>;
}

interface Options {
  fetch?: (url: string, init: RequestInit) => Promise<Response>;
  minTTL?: number;
  maxOverdueTTL?: number;
  hooks?: Hooks;
  invalidationsUrl?: string | false;
}

export function createFetchClient<
  Routes extends Record<BasePath, MaybePromise<BaseRoute>>
>(apiUrl: string, options: Options = {}) {
  const fetch = options.fetch ?? globalFetch;

  const cache = new Cache({
    minTTL: options.minTTL,
    maxOverdueTTL: options.maxOverdueTTL,
    hooks: options.hooks,
  });

  const invalidationsUrl =
    options.invalidationsUrl === false
      ? null
      : (options.invalidationsUrl ?? INVALIDATIONS_ROUTE);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", async (event) => {
      if (
        typeof event.data === "object" &&
        event.data !== null &&
        "type" in event.data &&
        event.data.type === INVALIDATION_POST_EVENT
      ) {
        try {
          await cache.revalidateTags(event.data.tags);
        } catch (error) {
          console.warn(
            "TApi: Failed to revalidate tags: received invalid post message",
            event.data
          );
        }
      }
    });
    if (invalidationsUrl && !navigator.serviceWorker.controller) {
      listenForInvalidations(invalidationsUrl, cache);
    }
  } else if (invalidationsUrl && typeof window !== "undefined") {
    listenForInvalidations(invalidationsUrl, cache);
  }

  function load(url: string, init: RequestInit = {}) {
    return cache.request(url, () =>
      fetch(url, {
        method: "GET",
        ...init,
      })
    );
  }

  async function revalidate(url: string) {
    await cache.revalidateUrl(url);
  }

  function mutate(
    method: string,
    url: string,
    data?: FormData | unknown,
    init: RequestInit = {}
  ): Promise<any> & Revalidating {
    const headers = new Headers(init.headers);

    if (!(data instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const res = fetch(url, {
      method,
      body:
        typeof data === "undefined"
          ? undefined
          : data instanceof FormData
          ? data
          : JSON.stringify(data),
      ...init,
      headers,
    });

    const revalidationPromise = res.then((res) =>
      cache.revalidateTags(res.headers.get(TAGS_HEADER)?.split(" ") ?? [])
    );

    return Object.assign(
      res
        .then((res) => handleResponse(res))
        .catch(async (error) => {
          await options?.hooks?.error?.(error);
          throw error;
        }),
      {
        revalidated: revalidationPromise,
      }
    );
  }

  return new Proxy(() => {}, {
    get(_target, prop: string) {
      return createProxy(
        {
          revalidate,
          load,
          mutate,
        },
        apiUrl,
        prop
      );
    },
  }) as unknown as Client<Routes>;
}

interface ProxyMethods {
  load(url: string, init?: RequestInit): Promise<unknown>;
  revalidate(url: string): void;
  mutate(
    method: string,
    url: string,
    data: FormData | unknown,
    init?: RequestInit
  ): Promise<unknown> & Revalidating;
}

function createProxy(methods: ProxyMethods, baseUrl: string, lastProp: string) {
  return new Proxy(() => {}, {
    get(_target, prop: string | symbol) {
      if (typeof prop === "symbol") {
        if (prop === Symbol.toPrimitive) {
          return function toPrimitive() {
            return `[TApi Route ${baseUrl}/${lastProp}]`;
          };
        }
        return undefined;
      }
      return createProxy(methods, baseUrl + "/" + lastProp, prop);
    },
    apply(_target, _thisArg, args) {
      switch (lastProp) {
        case "revalidate": {
          const searchParams = new URLSearchParams(args[0]);
          const url =
            searchParams.size > 0 ? baseUrl + "?" + searchParams : baseUrl;
          return methods.revalidate(url);
        }
        case "get": {
          const searchParams = new URLSearchParams(args[0]);
          const url =
            searchParams.size > 0 ? baseUrl + "?" + searchParams : baseUrl;

          const observablePromise = methods.load(url, args[1]);
          return observablePromise;
        }
        case "delete": {
          const searchParams = new URLSearchParams(args[0]);
          const url =
            searchParams.size > 0 ? baseUrl + "?" + searchParams : baseUrl;
          return methods.mutate("DELETE", url, undefined, args[1]);
        }
        case "post":
        case "put":
        case "patch": {
          let url = baseUrl;
          if (args[1]?.query) {
            url += "?" + new URLSearchParams(args[1].query);
          }

          return methods.mutate(lastProp.toUpperCase(), url, args[0], args[1]);
        }

        default:
          throw new Error(`Tapi: Unsupported method: ${lastProp}`);
      }
    },
  });
}
