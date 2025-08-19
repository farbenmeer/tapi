export class TResponse<T = any> extends Response {
  public data?: T;

  static override json<T>(data: T): TResponse<T> {
    const res = new TResponse(JSON.stringify(data));
    res.data = data;
    return res;
  }
}
