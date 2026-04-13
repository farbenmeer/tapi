import { test, expect } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createContactViaApi, deleteAllContactsViaApi } from "../helpers";

test.beforeEach(async ({ baseURL }) => {
  await deleteAllContactsViaApi(baseURL!);
});

test("page renders in production", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("app-title")).toHaveText("Contact Book");
  await expect(page.getByTestId("empty-state")).toBeVisible();
});

test("full CRUD workflow", async ({ page, baseURL }) => {
  await page.goto("/");

  // Create
  await page.getByTestId("add-contact-link").click();
  await page.getByTestId("create-name").fill("Alice");
  await page.getByTestId("create-email").fill("alice@example.com");
  await page.getByTestId("create-phone").fill("555-0100");
  await page.getByTestId("create-submit").click();
  await expect(page.getByTestId("contact-name")).toHaveText("Alice");

  // Read - go back to list and verify contact shows
  await page.getByTestId("back-link").click();
  const contactList = page.getByTestId("contact-list");
  await expect(contactList).toBeVisible();
  await expect(contactList.getByText("Alice")).toBeVisible();

  // Update
  await contactList.getByText("Alice").click();
  await page.getByTestId("edit-button").click();
  await page.getByTestId("edit-name").fill("Alice Updated");
  await page.getByTestId("save-button").click();
  await expect(page.getByTestId("contact-name")).toHaveText("Alice Updated");

  // Delete
  await page.getByTestId("delete-button").click();
  await expect(page.getByTestId("contact-list")).toBeVisible();
  await expect(page.getByTestId("empty-state")).toBeVisible();
});

test("dev-only code is stripped from production bundle", async ({ page }) => {
  await page.goto("/");
  const marker = await page.evaluate(
    () => (window as unknown as { __BUNNY_DEV_MARKER__?: string }).__BUNNY_DEV_MARKER__,
  );
  expect(marker).toBeUndefined();

  const assetsDir = path.join(process.cwd(), ".bunny/prod/dist/assets");
  const jsFiles = readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
  expect(jsFiles.length).toBeGreaterThan(0);
  for (const file of jsFiles) {
    const contents = readFileSync(path.join(assetsDir, file), "utf8");
    expect(contents).not.toContain("BUNNY_DEV_ONLY_MARKER_9f3a1b7c");
  }
});

test("direct URL access works (SPA routing)", async ({ page, baseURL }) => {
  const contact = await createContactViaApi(baseURL!, {
    name: "Direct Access",
    email: "direct@example.com",
  });

  // Navigate directly to the contact detail URL
  await page.goto(`/contacts/${contact.id}`);
  await expect(page.getByTestId("contact-name")).toHaveText("Direct Access");
});
