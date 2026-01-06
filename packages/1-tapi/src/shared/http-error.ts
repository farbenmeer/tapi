export class HttpError<Data = any> extends Error {
  status: number;
  data?: Data;

  constructor(status: number, message: string, data?: Data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}
