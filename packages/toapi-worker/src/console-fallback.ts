import type { Logger } from "@toapi/common";

export const consoleFallback = (logger?: Logger) =>
  ({
    error: logger?.error ?? ((error) => console.error("Toapi Worker:", error)),
    warn: logger?.warn ?? ((message) => console.warn("Toapi Worker:", message)),
    info: logger?.info ?? ((message) => console.info("Toapi Worker:", message)),
  }) satisfies Logger;
