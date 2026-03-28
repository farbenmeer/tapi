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

test("invalidations endpoint is accessible in dev mode", async ({ page }) => {
  await page.goto("/");
  const status = await page.evaluate(async () => {
    const controller = new AbortController();
    const res = await fetch("/__tapi/invalidations", {
      signal: controller.signal,
    });
    controller.abort();
    return res.status;
  });
  expect(status).toBe(200);
});

test("no service worker is active in dev mode", async ({ page }) => {
  await page.goto("/");
  const controller = await page.evaluate(
    () => navigator.serviceWorker?.controller ?? null
  );
  expect(controller).toBeNull();
});

test("client reactivity: create contact via API updates UI in dev mode", async ({
  page,
  baseURL,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("empty-state")).toBeVisible();
  await setWindowMarker(page);

  // Create contact externally via API (not through the UI)
  await createContactViaApi(baseURL!, {
    name: "Stream Test",
    email: "stream@example.com",
  });

  // The revalidation stream should push the tag invalidation to the client
  await expect(page.getByText("Stream Test")).toBeVisible({ timeout: 5000 });

  // No full reload occurred
  expect(await checkWindowMarker(page)).toBe(true);
});
