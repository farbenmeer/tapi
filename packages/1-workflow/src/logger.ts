export interface Logger {
  error(error: Error): void;
  debug(message: string, data?: Record<string, unknown>): void;
}

export const consoleLogger: Logger = {
  error(error: Error) {
    console.error("[Workflow]", error);
  },
  debug(message: string, data?: Record<string, unknown>) {
    console.debug("[Workflow]", message);
    if (data) {
      console.debug(JSON.stringify(data, null, 2));
    }
  },
};
