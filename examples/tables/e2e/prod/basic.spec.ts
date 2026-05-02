import { test, expect } from "@playwright/test";

test("renders greeting from API", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("div")).toHaveText("Hello, world!");
});

test("API returns JSON", async ({ request }) => {
  const res = await request.get("/api/greet?who=tables");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ message: "Hello, tables!" });
});
