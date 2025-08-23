import type { ZodType } from "zod/v4";
import type { TRequest } from "./t-request";
import type { MaybePromise } from "bun";

export type Schema<
  Response,
  AuthData,
  Params extends Record<string, string>,
  Query extends Record<string, unknown>,
  Body
> = {
  __r?: Response;
  __q?: Query;
  __b?: Body;
  params?: { [key in keyof Params]: ZodType<Params[key], string> };
  query?: { [key in keyof Query]: ZodType<Query[key], string | string[]> };
  body?: ZodType<Body>;
  response?: ZodType<Response>;
  authorize: (
    req: TRequest<never, Params, Query, never>
  ) => MaybePromise<AuthData>;
};
