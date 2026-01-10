import type { Handler } from "../server/handler";

export type Route<
  Params extends Record<string, string>,
  GetResponse,
  GetQuery extends Record<string, unknown>,
  PostResponse,
  PostQuery extends Record<string, unknown>,
  PostBody,
  DeleteResponse,
  DeleteQuery extends Record<string, unknown>,
  PutResponse,
  PutQuery extends Record<string, unknown>,
  PutBody,
  PatchResponse,
  PatchQuery extends Record<string, unknown>,
  PatchBody
> = {
  GET?: GetQuery extends never
    ? never
    : Handler<GetResponse, Params, GetQuery, undefined>;
  POST?: PostQuery extends never
    ? never
    : Handler<PostResponse, Params, PostQuery, PostBody>;
  DELETE?: DeleteQuery extends never
    ? never
    : Handler<DeleteResponse, Params, DeleteQuery, undefined>;
  PUT?: PutQuery extends never
    ? never
    : Handler<PutResponse, Params, PutQuery, PutBody>;
  PATCH?: PatchQuery extends never
    ? never
    : Handler<PatchResponse, Params, PatchQuery, PatchBody>;
};

export type BaseRoute = {
  GET?: Handler<any, any, any, undefined>;
  POST?: Handler<any, any, any, any>;
  DELETE?: Handler<any, any, any, undefined>;
  PUT?: Handler<any, any, any, any>;
  PATCH?: Handler<any, any, any, any>;
};
