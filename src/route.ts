import type { Handler } from "./handler";

export type Route<
  Params extends Record<string, string>,
  GetResponse,
  GetQuery extends Record<string, unknown>,
  PostResponse,
  PostQuery extends Record<string, unknown>,
  PostBody
> = {
  GET?: GetQuery extends never
    ? never
    : Handler<GetResponse, Params, GetQuery, never>;
  POST?: PostQuery extends never
    ? never
    : Handler<PostResponse, Params, PostQuery, PostBody>;
};

export type BaseRoute = {
  GET?: Handler<any, any, any, never>;
  POST?: Handler<any, any, any, unknown>;
};
