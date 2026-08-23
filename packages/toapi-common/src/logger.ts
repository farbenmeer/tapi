import type { MaybePromise } from "./maybe-promise.js";

export interface Logger {
  error?: (error: unknown) => MaybePromise<void>;
  warn?: (message: string) => MaybePromise<void>;
  info?: (message: string) => MaybePromise<void>;
}
