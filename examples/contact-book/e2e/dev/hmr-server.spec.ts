import { test, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { deleteAllContactsViaApi, createContactViaApi } from "../helpers";

const contactsFilePath = path.resolve(
  import.meta.dirname,
  "../../src/api/contacts.ts"
);
let originalContent: string;

test.beforeAll(async () => {
  originalContent = await readFile(contactsFilePath, "utf-8");
});

test.afterEach(async () => {
  await writeFile(contactsFilePath, originalContent);
});

test.beforeEach(async ({ baseURL }) => {
  await deleteAllContactsViaApi(baseURL!);
});

test("server HMR picks up API handler changes", async ({
  request,
  baseURL,
}) => {
  // Modify the GET handler to add a "source" field to each contact
  const modified = originalContent.replace(
    "const contacts = Array.from(contactsMap.values());",
    'const contacts = Array.from(contactsMap.values()).map(c => ({ ...c, source: "modified" }));'
  );
  await writeFile(contactsFilePath, modified);

  // Wait for esbuild to rebuild and server to reload, then create a contact
  // (in-memory state is lost on reload, so we create after the modification)
  await expect(async () => {
    await createContactViaApi(baseURL!, {
      name: "Test User",
      email: "test@example.com",
    });
    const res = await request.get("/api/contacts");
    const data = await res.json();
    expect(data[0]).toHaveProperty("source", "modified");
  }).toPass({ timeout: 10000 });
});
