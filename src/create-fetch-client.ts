import type { MaybePromise } from "bun";
import type { Client, Observable } from "./client";
import { handleResponse } from "./handle-response";
import type { Path as BasePath } from "./path";
import type { BaseRoute } from "./route";
import { TagManager } from "./tag-manager";
import { SubscriptionManager } from "./subscription-manager";

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
  const tagManager = new TagManager();
  const subscriptionManager = new SubscriptionManager();
  const fetch = options.fetch ?? globalFetch;

  async function load(url: string, init: RequestInit = {}) {
    const responsePromise = fetch(url, {
      method: "GET",
      ...init,
    });
    const dataPromise = responsePromise.then(handleResponse);
    await options.cache?.add(url, responsePromise, dataPromise);
    subscriptionManager.trigger(url, dataPromise);
    const res = await responsePromise;
    tagManager.add(url, res.headers.get("X-TAPI-Tags")?.split(" ") ?? []);
    return dataPromise;
  }

  async function revalidate(url: string) {
    if (subscriptionManager.has(url)) {
      await load(url);
      return;
    }
    await options.cache?.remove(url);
    tagManager?.remove(url);
  }

  async function mutate(
    method: string,
    url: string,
    data?: FormData | unknown,
    init: RequestInit = {}
  ) {
    const headers = new Headers(init.headers);

    if (!(data instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetch(url, {
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

    for (const url of tagManager.get(
      res.headers.get("X-TAPI-Tags")?.split(" ") ?? []
    )) {
      revalidate(url);
    }

    return handleResponse(res);
  }

  return new Proxy(() => {}, {
    get(_target, prop: string) {
      return createProxy(
        {
          revalidate,
          load,
          mutate,
          subscribe: (url, callback) =>
            subscriptionManager.subscribe(url, callback),
        },
        apiUrl,
        prop
      );
    },
  }) as unknown as Client<Routes>;
}

interface ProxyMethods {
  load(url: string, init?: RequestInit): Promise<unknown>;
  revalidate(url: string): Promise<void>;
  mutate(
    method: string,
    url: string,
    data: FormData | unknown,
    init?: RequestInit
  ): Promise<unknown>;
  subscribe(
    url: string,
    callback: (data: Promise<unknown>) => void
  ): () => void;
}

function createProxy(methods: ProxyMethods, baseUrl: string, lastProp: string) {
  return new Proxy(() => {}, {
    get(_target, prop: string) {
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

          const promise = methods.load(url, args[1]);
          return Object.assign(promise, {
            subscribe(callback: (data: Promise<unknown>) => void) {
              return methods.subscribe(url, callback);
            },
          }) satisfies Promise<unknown> & Observable<unknown>;
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
          if (args[0] instanceof FormData) {
            return methods.mutate(lastProp.toUpperCase(), baseUrl, args[0]);
          }

          const searchParams = new URLSearchParams(args[0]);
          const url =
            searchParams.size > 0 ? baseUrl + "?" + searchParams : baseUrl;

          return methods.mutate(lastProp.toUpperCase(), url, args[1], args[2]);
        }
        default:
          throw new Error(`Tapi: Unsupported method: ${lastProp}`);
      }
    },
  });
}
