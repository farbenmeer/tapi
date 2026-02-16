import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "dev",
      testDir: "./e2e/dev",
      use: {
        baseURL: "http://localhost:3100",
      },
    },
    {
      name: "prod",
      testDir: "./e2e/prod",
      use: {
        baseURL: "http://localhost:3101",
      },
    },
  ],
  webServer: [
    {
      command: "pnpm dev --port 3100",
      port: 3100,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
    },
    {
      command: "pnpm build && pnpm start --port 3101",
      port: 3101,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
    },
  ],
});
