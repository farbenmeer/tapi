import { createRequestHandler } from "@toapi/server";
import { describe, expect, test } from "vitest";
import { api } from "./api.mock.js";
import { createFetchClient } from "./create-fetch-client.js";

describe("local client", () => {
  test("handles most basic request", async () => {
    const handler = createRequestHandler(api);
    const client = createFetchClient<typeof api.routes>("http://localhost", {
      fetch: (url, init) => handler(new Request(url, init)),
    });

    await expect(client.books.get()).resolves.toBeTruthy();
  });
});
