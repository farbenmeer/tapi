import { test, expect } from "@playwright/test";
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

test("direct URL access works (SPA routing)", async ({ page, baseURL }) => {
  const contact = await createContactViaApi(baseURL!, {
    name: "Direct Access",
    email: "direct@example.com",
  });

  // Navigate directly to the contact detail URL
  await page.goto(`/contacts/${contact.id}`);
  await expect(page.getByTestId("contact-name")).toHaveText("Direct Access");
});
