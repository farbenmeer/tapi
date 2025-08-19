import type { Handler, HandlerFn } from "./handler";
import type { Schema } from "./schema";

export function defineHandler<
  Params extends Record<string, string> = {},
  Query extends Record<string, unknown> = {},
  Body = never,
>(
  schema: Schema<Params, Query, Body>,
  handler: HandlerFn<Params, Query, Body>,
): Handler<Params, Query, Body> {
  return {
    schema,
    handler,
  };
}
