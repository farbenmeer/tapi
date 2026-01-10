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

  static override json<T>(data: T, init?: TResponseInit): TResponse<T> {
    const res = new TResponse(JSON.stringify(data), init);
    res.data = data;
    return res;
  }

  static void(init?: TResponseInit): TResponse<void> {
    const res = new TResponse(null, init);
    res.data = undefined;
    return res;
  }
}
