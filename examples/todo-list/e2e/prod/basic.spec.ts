import { test, expect } from "@playwright/test";
import { deleteAllTodosViaApi } from "../helpers";

test.beforeEach(async ({ baseURL }) => {
  await deleteAllTodosViaApi(baseURL!);
});

test("page renders with title", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Bunny TODO List")).toBeVisible();
});

test("adds a todo", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Add a todo").fill("Buy groceries");
  await page.getByRole("button", { name: "Add" }).click();

  await expect(page.getByText("Buy groceries")).toBeVisible();
});

test("toggles a todo checkbox", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Add a todo").fill("Test checkbox");
  await page.getByRole("button", { name: "Add" }).click();

  await expect(page.getByText("Test checkbox")).toBeVisible();
  const checkbox = page.locator('input[type="checkbox"]').first();
  await checkbox.check();
  await expect(checkbox).toBeChecked();
});

test("deletes a todo", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Add a todo").fill("Delete me");
  await page.getByRole("button", { name: "Add" }).click();

  await expect(page.getByText("Delete me")).toBeVisible();
  await page.locator(".delete-form button").first().click();

  await expect(page.getByText("Delete me")).not.toBeVisible();
});
