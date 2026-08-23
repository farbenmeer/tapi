import { test, expect } from "@playwright/test";
import { deleteAllContactsViaApi } from "../helpers";

test.beforeEach(async ({ baseURL }) => {
  await deleteAllContactsViaApi(baseURL!);
});

test("service worker is registered", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("app-title")).toBeVisible();

  // Poll for service worker registration
  await expect(async () => {
    const registrations = await page.evaluate(async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.length;
    });
    expect(registrations).toBeGreaterThan(0);
  }).toPass({ timeout: 10000 });
});

test("api responses are cached by the service worker", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("app-title")).toBeVisible();

  // Wait for the service worker to take control, then reload so it
  // intercepts the app's API requests.
  await expect(async () => {
    const controlled = await page.evaluate(
      () => navigator.serviceWorker.controller !== null,
    );
    expect(controlled).toBe(true);
  }).toPass({ timeout: 10000 });

  await page.reload();
  await expect(page.getByTestId("app-title")).toBeVisible();

  await expect(async () => {
    const cacheInfo = await page.evaluate(async () => {
      const keys = await caches.keys();
      const tapiCache = keys.find((k) => k.startsWith("tapi-cache"));
      if (!tapiCache) return null;
      const cache = await caches.open(tapiCache);
      const entries = await cache.keys();
      return { name: tapiCache, count: entries.length };
    });
    expect(cacheInfo).not.toBeNull();
    expect(cacheInfo!.count).toBeGreaterThan(0);
  }).toPass({ timeout: 10000 });
});

test("SPA routing via direct URL access", async ({ page, baseURL }) => {
  // Create a contact first so we have a valid ID
  const res = await fetch(`${baseURL}/api/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "SPA Route",
      email: "spa@example.com",
    }),
  });
  const contact = await res.json();

  // Direct navigation to a SPA route
  await page.goto(`/contacts/${contact.id}`);
  await expect(page.getByTestId("contact-name")).toHaveText("SPA Route");
});

test("invalidations endpoint is accessible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("app-title")).toBeVisible();

  const status = await page.evaluate(async () => {
    const controller = new AbortController();
    const res = await fetch("/api/__tapi/invalidations", {
      signal: controller.signal,
    });
    controller.abort();
    return res.status;
  });
  expect(status).toBe(200);
});
