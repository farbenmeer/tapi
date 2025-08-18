import type { Schema } from "./schema";
import type { TRequest } from "./t-request";
import type { TResponse } from "./t-response";

export type HandlerFn<Params, Query, Body> = (
  request: TRequest<Params, Query, Body>,
) => Promise<TResponse>;

export type Handler<
  Params extends Record<string, string>,
  Query extends Record<string, unknown>,
  Body,
> = {
  schema: Schema<Params, Query, Body>;
  handler: HandlerFn<Params, Query, Body>;
};
