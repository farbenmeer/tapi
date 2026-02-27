import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 2,
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
        baseURL: "http://localhost:3200",
      },
    },
    {
      name: "prod",
      testDir: "./e2e/prod",
      use: {
        baseURL: "http://localhost:3201",
      },
    },
  ],
  webServer: [
    {
      command: "pnpm dev --port 3200",
      port: 3200,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
    },
    {
      command: "pnpm build && pnpm start --port 3201",
      port: 3201,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
    },
  ],
});
