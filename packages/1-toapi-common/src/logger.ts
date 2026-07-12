import type { MaybePromise } from "./maybe-promise.js";

export interface Logger {
  error?: (error: unknown) => MaybePromise<void>;
}
