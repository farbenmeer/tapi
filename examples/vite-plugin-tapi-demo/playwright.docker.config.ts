import { defineConfig, devices } from "@playwright/test";

// E2E config for the Docker image (Caddy + srvx). The spec builds, runs and
// tears down the container itself, and skips when no Docker runtime is present.
export default defineConfig({
  testDir: "./e2e",
  testMatch: /docker\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:3211",
  },
});
