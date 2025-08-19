import type { HeadersInit } from "bun";

export class TResponse<T = any> extends Response {
  public data?: T;

  static override json<T>(data: T, init?: ResponseInit): TResponse<T> {
    const headers = new Headers(init?.headers as HeadersInit);
    headers.set("Content-Type", "application/json");
    const res = new TResponse(JSON.stringify(data), { ...init, headers });
    res.data = data;
    return res;
  }
}
