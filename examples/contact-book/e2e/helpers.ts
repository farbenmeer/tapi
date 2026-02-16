import type { Page } from "@playwright/test";

export async function createContactViaApi(
  baseURL: string,
  contact: { name: string; email: string; phone?: string }
) {
  const res = await fetch(`${baseURL}/api/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contact),
  });
  if (!res.ok) throw new Error(`Failed to create contact: ${res.status}`);
  return res.json() as Promise<{
    id: string;
    name: string;
    email: string;
    phone: string;
  }>;
}

export async function deleteAllContactsViaApi(baseURL: string) {
  const res = await fetch(`${baseURL}/api/contacts`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete contacts: ${res.status}`);
}

export async function setWindowMarker(page: Page) {
  await page.evaluate(() => {
    (window as any).__TEST_MARKER = true;
  });
}

export async function checkWindowMarker(page: Page): Promise<boolean> {
  return page.evaluate(() => (window as any).__TEST_MARKER === true);
}
