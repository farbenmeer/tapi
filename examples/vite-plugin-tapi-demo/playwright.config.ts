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
      use: { baseURL: "http://localhost:3208" },
    },
    {
      name: "prod",
      use: { baseURL: "http://localhost:3209" },
    },
    {
      name: "preview",
      use: { baseURL: "http://localhost:3210" },
    },
  ],
  webServer: [
    {
      command: "pnpm dev",
      env: { PORT: "3208", FOO: "fromShell" },
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
    {
      command: "pnpm build && vite preview",
      env: { PORT: "3210" },
      port: 3210,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
    },
  ],
});
