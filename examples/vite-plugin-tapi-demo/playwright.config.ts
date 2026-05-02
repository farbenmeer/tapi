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
      use: { baseURL: "http://localhost:3208" },
    },
    {
      name: "prod",
      testDir: "./e2e/prod",
      use: { baseURL: "http://localhost:3209" },
    },
  ],
  webServer: [
    {
      command: "pnpm dev",
      env: { PORT: "3208" },
      port: 3208,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
    },
    {
      command: "pnpm build && pnpm start",
      env: { PORT: "3209" },
      port: 3209,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
    },
  ],
});
