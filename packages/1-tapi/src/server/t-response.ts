interface TResponseInit extends ResponseInit {
  tags?: string[];
}

export class TResponse<T = any> extends Response {
  public data?: T;

  constructor(body: BodyInit | null = null, init: TResponseInit = {}) {
    const { tags, ...rawInit } = init;
    super(body, rawInit);
    if (tags) {
      this.headers.append("X-TAPI-Tags", tags?.join(" "));
    }
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
