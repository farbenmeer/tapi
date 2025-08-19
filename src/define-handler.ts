import type { Handler, HandlerFn } from "./handler";
import type { Schema } from "./schema";

export function defineHandler<
  Response,
  Params extends Record<string, string> = {},
  Query extends Record<string, unknown> = {},
  Body = never,
>(
  schema: Schema<Response, Params, Query, Body>,
  handler: HandlerFn<Response, Params, Query, Body>,
): Handler<Response, Params, Query, Body> {
  return {
    schema,
    handler,
  };
}
