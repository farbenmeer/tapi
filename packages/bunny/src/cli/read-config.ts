import { existsSync } from "node:fs";
import path from "node:path";
import type { BunnyConfig } from "../config";

export async function readConfig(): Promise<BunnyConfig> {
  if (existsSync(path.resolve(process.cwd(), "bunny.config.ts"))) {
    const configModule = await import(
      path.resolve(process.cwd(), "bunny.config.ts")
    );
    return configModule.default;
  }

  return Promise.resolve({});
}
