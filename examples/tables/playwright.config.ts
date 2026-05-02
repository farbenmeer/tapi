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
      use: { baseURL: "http://localhost:3210" },
    },
    {
      name: "prod",
      testDir: "./e2e/prod",
      use: { baseURL: "http://localhost:3211" },
    },
  ],
  webServer: [
    {
      command: "pnpm dev",
      env: { PORT: "3210" },
      port: 3210,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
    },
    {
      command: "pnpm build && pnpm start",
      env: { PORT: "3211" },
      port: 3211,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
    },
  ],
});
