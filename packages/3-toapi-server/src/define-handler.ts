import type { Handler, HandlerFn } from "@toapi/common";
import type { Schema } from "@toapi/common";

export function defineHandler<
  Response,
  AuthData,
  Params extends Record<string, string> = {},
  Query extends Record<string, unknown> = {},
  Body = undefined
>(
  schema: Schema<Response, AuthData, Params, Query, Body>,
  handler: HandlerFn<Response, AuthData, Params, Query, Body>
): Handler<Response, Params, Query, Body> {
  return {
    schema,
    handler,
  };
}
