import type { ZodType } from "zod/v4";

export type Schema<
  Params extends Record<string, string>,
  Query extends Record<string, unknown>,
  Body,
> = {
  params?: [keyof Params, ...(keyof Params)[]];
  query?: { [key in keyof Query]: ZodType<Query[key], string | string[]> };
  body?: ZodType<Body>;
};
