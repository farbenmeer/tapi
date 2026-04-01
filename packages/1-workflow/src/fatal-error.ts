export class FatalError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "FatalError";
  }
  static from(error: Error): FatalError {
    return new FatalError(error.message, { cause: error });
  }
}
