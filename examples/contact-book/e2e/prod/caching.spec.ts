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

test("GET /api/contacts returns X-TAPI-Tags header", async ({ request }) => {
  const res = await request.get("/api/contacts");
  expect(res.headers()["x-tapi-tags"]).toBe("contacts");
});

test("GET /api/contacts returns X-TAPI-Expires-At header", async ({
  request,
}) => {
  const res = await request.get("/api/contacts");
  const expiresAt = res.headers()["x-tapi-expires-at"];
  expect(expiresAt).toBeDefined();
  expect(Number(expiresAt)).toBeGreaterThan(Date.now());
});

test("cache invalidation: POST invalidates GET cache", async ({
  request,
  baseURL,
}) => {
  // First GET - should return empty
  const res1 = await request.get("/api/contacts");
  const data1 = await res1.json();
  expect(data1).toHaveLength(0);

  // Create a contact
  await createContactViaApi(baseURL!, {
    name: "Cache Test",
    email: "cache@example.com",
  });

  // GET again - should return the new contact (cache invalidated by POST)
  const res2 = await request.get("/api/contacts");
  const data2 = await res2.json();
  expect(data2).toHaveLength(1);
  expect(data2[0].name).toBe("Cache Test");
});

test("client reactivity: create contact via UI updates list", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("empty-state")).toBeVisible();
  await setWindowMarker(page);

  // Create contact via UI
  await page.getByTestId("add-contact-link").click();
  await page.getByTestId("create-name").fill("Reactive");
  await page.getByTestId("create-email").fill("reactive@example.com");
  await page.getByTestId("create-submit").click();

  // Should be on detail page
  await expect(page.getByTestId("contact-detail")).toBeVisible();

  // Go back to list
  await page.getByTestId("back-link").click();
  const contactList = page.getByTestId("contact-list");
  await expect(contactList).toBeVisible();
  await expect(contactList.getByText("Reactive")).toBeVisible();

  // Verify no full reload
  expect(await checkWindowMarker(page)).toBe(true);
});

test("client reactivity: delete from detail updates list", async ({
  page,
  baseURL,
}) => {
  await createContactViaApi(baseURL!, {
    name: "ToDelete",
    email: "delete@example.com",
  });

  await page.goto("/");
  await expect(page.getByText("ToDelete")).toBeVisible();
  await setWindowMarker(page);

  await page.getByText("ToDelete").click();
  await expect(page.getByTestId("contact-detail")).toBeVisible();
  await page.getByTestId("delete-button").click();

  // Should be back on list with empty state
  await expect(page.getByTestId("contact-list")).toBeVisible();
  await expect(page.getByTestId("empty-state")).toBeVisible({ timeout: 10000 });

  // No full reload
  expect(await checkWindowMarker(page)).toBe(true);
});
