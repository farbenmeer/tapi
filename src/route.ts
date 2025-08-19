import type { Handler } from "./handler";

export type Route<
  Params extends Record<string, string>,
  GetQuery extends Record<string, unknown>,
  PostQuery extends Record<string, unknown>,
  PostBody,
> = {
  get?: GetQuery extends never ? never : Handler<Params, GetQuery, never>;
  post?: PostQuery extends never ? never : Handler<Params, PostQuery, PostBody>;
};

export type BaseRoute = {
  get?: Handler<any, any, never>;
  post?: Handler<any, any, unknown>;
};
