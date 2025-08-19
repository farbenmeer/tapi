import type { ZodType } from "zod/v4";

export type Schema<
  Response,
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
};
