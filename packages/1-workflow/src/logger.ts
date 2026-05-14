export interface Logger {
  error(error: Error): void;
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  log(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
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
  info(message: string, data?: Record<string, unknown>) {
    console.info("[Workflow]", message);
    if (data) {
      console.info(JSON.stringify(data, null, 2));
    }
  },
  log(message: string, data?: Record<string, unknown>) {
    console.log("[Workflow]", message);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  },
  warn(message: string, data?: Record<string, unknown>) {
    console.warn("[Workflow]", message);
    if (data) {
      console.warn(JSON.stringify(data, null, 2));
    }
  },
};
