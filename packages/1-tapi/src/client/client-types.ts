import type { Path as BasePath } from "../shared/path.js";
import type { BaseRoute } from "../shared/route.js";
import type { Handler as BaseHandler } from "../server/handler.js";
import type { MaybePromise } from "../shared/maybe-promise.js";

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
  [segment in Segment<keyof Routes> as segment extends `:${string}`
    ? string | number
    : segment extends `*${string}`
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

type ClientRoute<Route extends MaybePromise<BaseRoute>> = {
  get: GetRoute<Awaited<Route>["GET"]>;
  post: RouteWithBody<Awaited<Route>["POST"]>;
  revalidate: () => Promise<void>;
};

export type GetRoute<
  Handler extends BaseHandler<any, any, any, never> | undefined
> = Handler extends undefined
  ? never
  : keyof QueryType<Handler> extends never
  ? (
      query?: {},
      req?: RequestInit
    ) => Promise<ResponseType<Handler>> & Observable<ResponseType<Handler>>
  : (
      query: QueryType<Handler>,
      req?: RequestInit
    ) => Promise<ResponseType<Handler>> & Observable<ResponseType<Handler>>;

export type Observable<T> = {
  subscribe(callback: (value: Promise<T>) => void): () => void;
};

export type RouteWithoutBody<
  Handler extends BaseHandler<any, any, any, never> | undefined
> = Handler extends undefined
  ? never
  : keyof QueryType<Handler> extends never
  ? (query?: {}, req?: RequestInit) => Promise<ResponseType<Handler>>
  : (
      query: QueryType<Handler>,
      req?: RequestInit
    ) => Promise<ResponseType<Handler>>;

export type RouteWithBody<
  Handler extends BaseHandler<any, any, any, unknown> | undefined
> = Handler extends undefined
  ? never
  : (
      body?: BodyType<Handler> | FormData,
      req?: RequestInit & { query?: QueryType<Handler> }
    ) => Promise<ResponseType<Handler>>;

type QueryType<Handler extends { schema: { __q?: any } } | undefined> =
  NonNullable<NonNullable<Handler>["schema"]["__q"]>;

type BodyType<Handler extends { schema: { __b?: any } } | undefined> =
  NonNullable<NonNullable<Handler>["schema"]["__b"]>;

type ResponseType<Handler extends { schema: { __r?: any } } | undefined> =
  NonNullable<NonNullable<Handler>["schema"]["__r"]>;
