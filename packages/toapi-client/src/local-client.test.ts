import { describe, expect, test } from "vitest";
import { createFetchClient } from "./create-fetch-client.js";
import { createLocalFetch } from "@toapi/server";
import { api } from "./api.mock.js";

describe("local client", () => {
  test("handles most basic request", async () => {
    const client = createFetchClient<typeof api.routes>("http://localhost", {
      fetch: createLocalFetch(api),
    });

    await expect(client.books.get()).resolves.toBeTruthy();
  });
});
