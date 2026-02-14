import { test, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { deleteAllContactsViaApi, setWindowMarker, checkWindowMarker } from "../helpers";

const appFilePath = path.resolve(import.meta.dirname, "../../src/app/app.tsx");
let originalContent: string;

test.beforeAll(async () => {
  originalContent = await readFile(appFilePath, "utf-8");
});

test.afterEach(async () => {
  await writeFile(appFilePath, originalContent);
});

test.beforeEach(async ({ baseURL }) => {
  await deleteAllContactsViaApi(baseURL!);
});

test("client HMR updates component without full reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("app-title")).toHaveText("Contact Book");

  await setWindowMarker(page);

  // Modify the app title
  const modified = originalContent.replace("Contact Book", "Contact Book HMR");
  await writeFile(appFilePath, modified);

  // Wait for HMR to update the DOM
  await expect(page.getByTestId("app-title")).toHaveText(
    "Contact Book HMR",
    { timeout: 10000 }
  );

  // Verify no full reload happened
  expect(await checkWindowMarker(page)).toBe(true);
});
