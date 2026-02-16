import { test, expect } from "@playwright/test";
import {
  createContactViaApi,
  deleteAllContactsViaApi,
  setWindowMarker,
  checkWindowMarker,
} from "../helpers";

test.beforeEach(async ({ baseURL }) => {
  await deleteAllContactsViaApi(baseURL!);
});

test("shows app title", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("app-title")).toHaveText("Contact Book");
});

test("shows empty state when no contacts", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("empty-state")).toBeVisible();
});

test("navigates to create form and back", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("add-contact-link").click();
  await expect(page.getByTestId("contact-form")).toBeVisible();
  await page.getByTestId("back-link").click();
  await expect(page.getByTestId("contact-list")).toBeVisible();
});

test("creates a contact", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("add-contact-link").click();
  await page.getByTestId("create-name").fill("Alice Smith");
  await page.getByTestId("create-email").fill("alice@example.com");
  await page.getByTestId("create-phone").fill("555-0100");
  await page.getByTestId("create-submit").click();

  // Should navigate to detail page
  await expect(page.getByTestId("contact-detail")).toBeVisible();
  await expect(page.getByTestId("contact-name")).toHaveText("Alice Smith");
  await expect(page.getByTestId("contact-email")).toHaveText(
    "alice@example.com"
  );
  await expect(page.getByTestId("contact-phone")).toHaveText("555-0100");
});

test("views contact detail via useParams", async ({ page, baseURL }) => {
  const contact = await createContactViaApi(baseURL!, {
    name: "Bob Jones",
    email: "bob@example.com",
    phone: "555-0200",
  });

  await page.goto("/");
  await page.getByTestId(`contact-${contact.id}`).click();
  await expect(page.getByTestId("contact-name")).toHaveText("Bob Jones");
  await expect(page.getByTestId("contact-email")).toHaveText(
    "bob@example.com"
  );
});

test("edits a contact", async ({ page, baseURL }) => {
  const contact = await createContactViaApi(baseURL!, {
    name: "Carol",
    email: "carol@example.com",
  });

  await page.goto(`/contacts/${contact.id}`);
  await page.getByTestId("edit-button").click();
  await expect(page.getByTestId("contact-edit")).toBeVisible();
  await page.getByTestId("edit-name").fill("Carol Updated");
  await page.getByTestId("save-button").click();

  await expect(page.getByTestId("contact-detail")).toBeVisible();
  await expect(page.getByTestId("contact-name")).toHaveText("Carol Updated");
});

test("deletes a contact and navigates back", async ({ page, baseURL }) => {
  const contact = await createContactViaApi(baseURL!, {
    name: "Dave",
    email: "dave@example.com",
  });

  await page.goto(`/contacts/${contact.id}`);
  await page.getByTestId("delete-button").click();

  // Should navigate back to list
  await expect(page.getByTestId("contact-list")).toBeVisible();
  await expect(page.getByTestId("empty-state")).toBeVisible();
});

test("shows 404 for unknown route", async ({ page }) => {
  await page.goto("/some/unknown/path");
  await expect(page.getByTestId("not-found")).toBeVisible();
});

test("client-side navigation does not cause full reload", async ({
  page,
  baseURL,
}) => {
  await createContactViaApi(baseURL!, {
    name: "Eve",
    email: "eve@example.com",
  });

  await page.goto("/");
  await expect(page.getByTestId("contact-list")).toBeVisible();
  await setWindowMarker(page);

  // Navigate to create form
  await page.getByTestId("add-contact-link").click();
  await expect(page.getByTestId("contact-form")).toBeVisible();
  expect(await checkWindowMarker(page)).toBe(true);

  // Navigate back
  await page.getByTestId("back-link").click();
  await expect(page.getByTestId("contact-list")).toBeVisible();
  expect(await checkWindowMarker(page)).toBe(true);
});
