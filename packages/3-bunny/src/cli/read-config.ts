import { existsSync } from "node:fs";
import path from "node:path";
import type { BunnyConfig } from "../config";

export function readConfig(): Promise<BunnyConfig> {
  if (existsSync(path.resolve(process.cwd(), "bunny.config.ts"))) {
    return import(path.resolve(process.cwd(), "bunny.config.ts"));
  }

  return Promise.resolve({});
}
