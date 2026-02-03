import { EXPIRES_AT_HEADER, TAGS_HEADER } from "../shared/constants.js";

interface TResponseInit extends ResponseInit {
  cache?: {
    tags?: string[];
    ttl?: number;
  };
}

export class TResponse<T = any> extends Response {
  public data?: T;
  public cache?: {
    tags?: string[];
    ttl?: number;
  };

  constructor(body: BodyInit | null = null, init: TResponseInit = {}) {
    const { cache, ...rawInit } = init;
    if (cache?.tags) {
      setHeader(rawInit, TAGS_HEADER, cache.tags.join(" "));
    }
    if (cache?.ttl) {
      setHeader(
        rawInit,
        EXPIRES_AT_HEADER,
        (Date.now() + cache.ttl * 1000).toFixed(0)
      );
    }
    super(body, rawInit);
    this.cache = cache;
  }

  static override json<T>(data: T, init: TResponseInit = {}): TResponse<T> {
    setHeader(init, "Content-Type", "application/json");
    const res = new TResponse(JSON.stringify(data), init);
    res.data = data;
    return res;
  }

  static void(init: TResponseInit = {}): TResponse<void> {
    setHeader(init, "Content-Length", "0");
    const res = new TResponse(null, init);
    res.data = undefined;
    return res;
  }
}

function setHeader(init: TResponseInit, key: string, value: string) {
  init.headers = new Headers(init.headers);
  if (!init.headers.has(key)) {
    init.headers.set(key, value);
  }
}
