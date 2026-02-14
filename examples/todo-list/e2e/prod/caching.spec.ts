import { test, expect } from "@playwright/test";
import { deleteAllTodosViaApi } from "../helpers";

test.beforeEach(async ({ baseURL }) => {
  await deleteAllTodosViaApi(baseURL!);
});

test("GET /api/todos returns X-TAPI-Tags header", async ({ request }) => {
  const res = await request.get("/api/todos");
  expect(res.headers()["x-tapi-tags"]).toBe("todos");
});

test("list updates after adding a todo", async ({ page }) => {
  await page.goto("/");

  // Add a todo
  await page.getByPlaceholder("Add a todo").fill("Cache test");
  await page.getByRole("button", { name: "Add" }).click();

  // Verify it appears in the list
  await expect(page.getByText("Cache test")).toBeVisible();
});

test("list updates after deleting a todo", async ({ page }) => {
  await page.goto("/");

  // Add a todo
  await page.getByPlaceholder("Add a todo").fill("To be deleted");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("To be deleted")).toBeVisible();

  // Delete it
  await page.locator(".delete-form button").first().click();
  await expect(page.getByText("To be deleted")).not.toBeVisible();
});
