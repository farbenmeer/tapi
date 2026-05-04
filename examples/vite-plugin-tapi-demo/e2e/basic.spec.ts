import { test, expect } from "@playwright/test";

test("page renders with title", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "vite-plugin-tapi demo" }),
  ).toBeVisible();
});

test("greets the default name", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Greet" }).click();
  await expect(page.getByTestId("output")).toHaveText("hello, world");
});

test("greets a custom name", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Name:").fill("claude");
  await page.getByRole("button", { name: "Greet" }).click();
  await expect(page.getByTestId("output")).toHaveText("hello, claude");
});

test("api returns json", async ({ request }) => {
  const res = await request.get("/greet?name=api");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ greeting: "hello, api" });
});

test("server sees .env vars; shell env takes precedence", async ({
  request,
}) => {
  // .env.development sets FOO=fromEnv, BAR=fromEnv.
  // playwright.config.ts overrides FOO=fromShell in the dev webServer env.
  // Expectation: shell wins for FOO, .env supplies BAR.
  const res = await request.get("/whoami");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ foo: "fromShell", bar: "fromEnv" });
});
