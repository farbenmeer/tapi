import path from "node:path";
import { loadEnvFile } from "node:process";
import { getSystemErrorName } from "node:util";

export function loadEnv(mode: string) {
  loadFile(path.join(process.cwd(), `.env.${mode}`));
  loadFile(path.join(process.cwd(), ".env"));
}

function loadFile(path: string) {
  try {
    loadEnvFile(path);
  } catch (error) {
    if (
      error instanceof Error &&
      "errno" in error &&
      typeof error.errno === "number" &&
      getSystemErrorName(error.errno) === "ENOENT"
    ) {
      // File not found, ignore
      return;
    }
    throw error;
  }
}
