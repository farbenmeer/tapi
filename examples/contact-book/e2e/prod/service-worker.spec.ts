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

test("static cache exists with entries", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("app-title")).toBeVisible();

  // Wait for SW to activate and cache files
  await expect(async () => {
    const cacheInfo = await page.evaluate(async () => {
      const keys = await caches.keys();
      const staticCache = keys.find((k) => k.startsWith("bunny-static-cache"));
      if (!staticCache) return null;
      const cache = await caches.open(staticCache);
      const entries = await cache.keys();
      return { name: staticCache, count: entries.length };
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
    const res = await fetch("/__bunny/invalidations", {
      signal: controller.signal,
    });
    controller.abort();
    return res.status;
  });
  expect(status).toBe(200);
});
