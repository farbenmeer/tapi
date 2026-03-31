export interface Logger {
  error(error: Error): void;
}

export const consoleLogger: Logger = {
  error(error: Error) {
    console.error("[Workflow]", error);
  },
};
