import type { MaybePromise } from "bun";
import type { Path as BasePath } from "./path";
import type { BaseRoute } from "./route";
import type { Handler as BaseHandler } from "./handler";

type Segment<Path> = Path extends `/${infer Segment}/${string}`
  ? Segment
  : Path extends `/${infer Segment}`
  ? Segment
  : never;

type Rest<
  Path,
  Segment extends string
> = Path extends `/${Segment}/${infer Rest}` ? `/${Rest}` : never;

export type Client<Routes extends Record<BasePath, MaybePromise<BaseRoute>>> = {
  [segment in Segment<keyof Routes> as segment extends `[${string}]`
    ? string | number
    : segment]: (Extract<keyof Routes, `/${segment}`> extends never
    ? {}
    : ClientRoute<Routes[`/${segment}`]>) &
    (Exclude<keyof Routes, `/${segment}`> extends never
      ? {}
      : Client<{
          [rest in Rest<keyof Routes, segment>]: Routes[`/${segment}${rest}`];
        }>);
};

export type ReactQueryClient<
  Routes extends Record<BasePath, MaybePromise<BaseRoute>>
> = {
  [segment in Segment<keyof Routes> as segment extends `[${string}]`
    ? string | number
    : segment]: (Extract<keyof Routes, `/${segment}`> extends never
    ? {}
    : ReactQueryClientRoute<Routes[`/${segment}`]>) &
    (Exclude<keyof Routes, `/${segment}`> extends never
      ? {}
      : ReactQueryClient<{
          [rest in Rest<keyof Routes, segment>]: Routes[`/${segment}${rest}`];
        }>);
};

type ClientRoute<Route extends MaybePromise<BaseRoute>> = {
  get: RouteWithoutBody<Awaited<Route>["GET"]>;
  post: RouteWithBody<Awaited<Route>["POST"]>;
  revalidate: () => void;
};

type ReactQueryClientRoute<Route extends MaybePromise<BaseRoute>> = {
  get: ReactQueryRouteWithoutBody<Awaited<Route>["GET"]>;
  post: RouteWithBody<Awaited<Route>["POST"]>;
};

export type RouteWithoutBody<
  Handler extends BaseHandler<any, any, any, never> | undefined
> = Handler extends undefined
  ? never
  : keyof QueryType<Handler> extends never
  ? (query?: {}, req?: RequestInit) => ResponseType<Handler>
  : (query: QueryType<Handler>, req?: RequestInit) => ResponseType<Handler>;

export type RouteWithBody<
  Handler extends BaseHandler<any, any, any, unknown> | undefined
> = Handler extends undefined
  ? never
  :
      | ((
          query: QueryType<Handler>,
          body: BodyType<Handler> | FormData,
          req?: RequestInit
        ) => ResponseType<Handler>)
      | ((body: FormData) => ResponseType<Handler>);

type QueryType<Handler extends { schema: { __q?: any } } | undefined> =
  NonNullable<NonNullable<Handler>["schema"]["__q"]>;

type BodyType<Handler extends { schema: { __b?: any } } | undefined> =
  NonNullable<NonNullable<Handler>["schema"]["__b"]>;

type ResponseType<Handler extends { schema: { __r?: any } } | undefined> =
  Promise<NonNullable<NonNullable<Handler>["schema"]["__r"]>>;

type ReactQuery<Handler extends { schema: { __r?: any } } | undefined> = {
  queryKey: [string];
  queryFn: () => ResponseType<Handler>;
};

export type ReactQueryRouteWithoutBody<
  Handler extends BaseHandler<any, any, any, never> | undefined
> = Handler extends undefined
  ? never
  : keyof QueryType<Handler> extends never
  ? (query?: {}, req?: RequestInit) => ReactQuery<Handler>
  : (query: QueryType<Handler>, req?: RequestInit) => ReactQuery<Handler>;
