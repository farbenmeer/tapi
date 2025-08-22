import { createFetchClient } from "./create-fetch-client";
import { requestHandler } from "./create-request-handler.test";
import type { api } from "./define-api.test";
import { describe, test, mock, expect } from "bun:test";

describe("createFetchClient", () => {
  const fetch = mock((url: string, init: RequestInit) => {
    return requestHandler(new Request(url, init));
  });
  const client = createFetchClient<typeof api.routes>(
    "https://example.com/api",
    { fetch }
  );

  test("get books", async () => {
    const response = await client.books.get();
    expect(fetch).toHaveBeenCalledWith("https://example.com/api/books", {
      method: "GET",
      headers: {},
    });
    expect(response).toEqual([
      { id: "1", title: "Book 1" },
      { id: "2", title: "Book 2" },
    ]);
  });

  test("get book", async () => {
    const response = await client.books[1]!.get({ test: "asdf" });
    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/api/books/1?test=asdf",
      {
        method: "GET",
        headers: {},
      }
    );
    expect(response).toEqual({ id: "1", title: "Book 1" });
  });
});
