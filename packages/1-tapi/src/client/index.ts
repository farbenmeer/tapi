import type { Observable } from "./client-types";

export { createFetchClient } from "./create-fetch-client";
export type { Observable } from "./client-types";

export type GetRoute<R, Q = never> = Q extends never
  ? (query?: {}, req?: RequestInit) => Promise<R> & Observable<R>
  : (query: Q, req?: RequestInit) => Promise<R> & Observable<R>;

export type PostRoute<R, Q = unknown, B = unknown> = (
  query: Q | FormData,
  body: B | FormData,
  req?: RequestInit
) => Promise<R>;
