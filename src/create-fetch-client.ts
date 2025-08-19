import { handleResponse } from "./handle-response";
import type { Handler as BaseHandler } from "./handler";
import type { Path as BasePath } from "./path";
import type { BaseRoute } from "./route";

export function createFetchClient<Routes extends Record<BasePath, BaseRoute>>(
  baseUrl: string,
) {
  return new Proxy(() => {}, {
    get(_target, prop: string) {
      return createProxy(baseUrl, prop);
    },
  }) as unknown as Client<Routes>;
}

function createProxy(baseUrl: string, lastProp: string) {
  return new Proxy(() => {}, {
    get(_target, prop: string) {
      return createProxy(baseUrl + "/" + lastProp, prop);
    },
    async apply(_target, _thisArg, args) {
      switch (lastProp) {
        case "get": {
          const headers = new Headers(args[1]?.headers);
          const searchParams = new URLSearchParams(args[0]);
          const res = await fetch(baseUrl + "?" + searchParams, {
            method: lastProp,
            ...(args[1] ?? {}),
            headers,
          });

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

          const res = await fetch(baseUrl + new URLSearchParams(args[0]), {
            method: lastProp,
            body:
              args[1] instanceof FormData ? args[1] : JSON.stringify(args[1]),
            ...(args[2] ?? {}),
            headers,
          });
          return handleResponse(res);
        }
        default:
          throw new Error(`Tapi: Unsupported method: ${lastProp}`);
      }
    },
  });
}

type Segment<Path> = Path extends `/${infer Segment}/${string}`
  ? Segment
  : Path extends `/${infer Segment}`
    ? Segment
    : never;

type Rest<
  Path,
  Segment extends string,
> = Path extends `/${Segment}/${infer Rest}` ? `/${Rest}` : never;

type Client<Routes extends Record<BasePath, BaseRoute>> = {
  [segment in Segment<keyof Routes> as segment extends `[${string}]`
    ? string
    : segment]: (Extract<keyof Routes, `/${segment}`> extends never
    ? {}
    : ClientRoute<Routes[`/${segment}`]>) &
    (Exclude<keyof Routes, `/${segment}`> extends never
      ? {}
      : Client<{
          [rest in Rest<keyof Routes, segment>]: Routes[`/${segment}${rest}`];
        }>);
};

type ClientRoute<Route extends BaseRoute> = {
  get: RouteWithoutBody<Route["get"]>;
  post: RouteWithBody<Route["post"]>;
};

type RouteWithoutBody<
  Handler extends BaseHandler<any, any, any, never> | undefined,
> = Handler extends undefined
  ? never
  : keyof QueryType<Handler> extends never
    ? (query?: {}, req?: RequestInit) => ResponseType<Handler>
    : (query: QueryType<Handler>, req?: RequestInit) => ResponseType<Handler>;

type RouteWithBody<
  Handler extends BaseHandler<any, any, any, unknown> | undefined,
> = Handler extends undefined
  ? never
  :
      | ((
          query: QueryType<Handler>,
          body: BodyType<Handler> | FormData,
          req?: RequestInit,
        ) => ResponseType<Handler>)
      | ((body: FormData) => ResponseType<Handler>);

type QueryType<Handler extends { schema: { __q?: any } } | undefined> =
  NonNullable<NonNullable<Handler>["schema"]["__q"]>;

type BodyType<Handler extends { schema: { __b?: any } } | undefined> =
  NonNullable<NonNullable<Handler>["schema"]["__b"]>;

type ResponseType<Handler extends { schema: { __r?: any } } | undefined> =
  Promise<NonNullable<NonNullable<Handler>["schema"]["__r"]>>;
