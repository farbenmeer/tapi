import type { HeadersInit } from "bun";

interface TResponseInit extends ResponseInit {
  tags?: string[];
}

export class TResponse<T = any> extends Response {
  public data?: T;

  static override json<T>(data: T, init?: TResponseInit): TResponse<T> {
    const headers = new Headers(init?.headers as HeadersInit);
    headers.set("Content-Type", "application/json");
    if (init?.tags) {
      headers.set("X-TAPI-Tags", init.tags.join(" "));
    }
    const res = new TResponse(JSON.stringify(data), { ...init, headers });
    res.data = data;
    return res;
  }
}
