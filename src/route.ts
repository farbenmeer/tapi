import type { Handler } from "./handler";

export type Route<
  Params extends Record<string, string>,
  GetQuery extends Record<string, unknown>,
  PostQuery extends Record<string, unknown>,
  PostBody,
  PutQuery extends Record<string, unknown>,
  PutBody,
  DeleteQuery extends Record<string, unknown>,
  PathQuery extends Record<string, unknown>,
  PatchBody,
  HeadQuery extends Record<string, unknown>,
> = {
  get?: Handler<Params, GetQuery, never>;
  post?: Handler<Params, PostQuery, PostBody>;
  put?: Handler<Params, PutQuery, PutBody>;
  delete?: Handler<Params, DeleteQuery, never>;
  patch?: Handler<Params, PathQuery, PatchBody>;
  head?: Handler<Params, HeadQuery, never>;
};

export type BaseRoute = {
  get?: Handler<any, any, never>;
  post?: Handler<any, any, unknown>;
  put?: Handler<any, any, unknown>;
  patch?: Handler<any, any, unknown>;
  delete?: Handler<any, any, never>;
  head?: Handler<any, any, never>;
};
