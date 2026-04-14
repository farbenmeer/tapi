import type { Revalidating } from "./client-types.js";

export interface ProxyMethods {
  load(url: string, init?: RequestInit): Promise<unknown>;
  revalidate(url: string): void;
  mutate(
    method: string,
    url: string,
    data: FormData | unknown,
    init?: RequestInit,
  ): Promise<unknown> & Revalidating;
}

export function createProxy(
  methods: ProxyMethods,
  baseUrl: string,
  lastProp: string,
) {
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
          return methods.load(url, args[1]);
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
