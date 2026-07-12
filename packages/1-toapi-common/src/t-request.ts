import type { CookieStore } from "./cookie-store.js";

export type TRequest<AuthData, Params, Query, Body> = Request & {
  params: () => Params;
  query: () => Query;
  data: () => Promise<Body>;
  auth: () => NonNullable<AuthData>;
  cookies: () => CookieStore;
  invalidate: (tags: string[]) => Promise<void>;
};
