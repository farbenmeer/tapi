import type { Schema } from "./schema";
import type { TRequest } from "./t-request";
import type { TResponse } from "./t-response";

export type HandlerFn<Response, AuthData, Params, Query, Body> = (
  request: TRequest<AuthData, Params, Query, Body>
) => Promise<TResponse<Response>>;

export type Handler<
  Response,
  Params extends Record<string, string>,
  Query extends Record<string, unknown>,
  Body
> = {
  schema: Schema<Response, unknown, Params, Query, Body>;
  handler: HandlerFn<Response, any, Params, Query, Body>;
};
