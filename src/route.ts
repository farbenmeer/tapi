import type { Handler } from "./handler";

export type Route<
  Params extends Record<string, string>,
  GetResponse,
  GetQuery extends Record<string, unknown>,
  PostResponse,
  PostQuery extends Record<string, unknown>,
  PostBody,
> = {
  get?: GetQuery extends never
    ? never
    : Handler<GetResponse, Params, GetQuery, never>;
  post?: PostQuery extends never
    ? never
    : Handler<PostResponse, Params, PostQuery, PostBody>;
};

export type BaseRoute = {
  get?: Handler<any, any, any, never>;
  post?: Handler<any, any, any, unknown>;
};
