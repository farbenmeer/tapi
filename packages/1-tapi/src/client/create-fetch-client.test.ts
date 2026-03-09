import { beforeEach, describe, expect, vi, test } from "vitest";
import { createFetchClient } from "./create-fetch-client.js";
import type { api } from "../server/define-api.mock.js";
import { requestHandler } from "../server/request-handler.mock.js";

describe("createFetchClient", () => {
  const fetch = vi.fn((url: string, init: RequestInit) => {
    return requestHandler(new Request(url, init));
  });
  let client = createFetchClient<typeof api.routes>("https://example.com/api", {
    fetch,
  });

  beforeEach(() => {
    fetch.mockClear();
    client = createFetchClient<typeof api.routes>("https://example.com/api", {
      fetch,
    });
  });

  test("get books", async () => {
    const response = await client.books.get();
    expect(fetch).toHaveBeenCalledWith("https://example.com/api/books", {
      method: "GET",
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
      },
    );
    expect(response).toEqual({ id: "1", title: "Book 1" });
  });

  test("post book", async () => {
    const response = await client.books.post({
      id: "3",
      title: "Book 3",
    });
    expect(fetch).toHaveBeenCalledWith("https://example.com/api/books", {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        id: "3",
        title: "Book 3",
      }),
    });
    expect(response).toEqual({ id: "3", title: "Book 3" });
  });

  test("subscribe to query", async () => {
    const cb = vi.fn();
    const promise = client.books.get();
    const unsubscribe = promise.subscribe(cb);
    expect(cb).toHaveBeenCalledTimes(0);
    await promise;
    expect(cb).toHaveBeenCalledTimes(0);
    await client.books.revalidate();
    expect(cb).toHaveBeenCalledTimes(1);
    unsubscribe();
    await client.books.revalidate();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  test("tag-based revalidation", async () => {
    const cb = vi.fn();
    const promise = client.movies[1]!.get({ test: "asdf" });
    promise.subscribe(cb);
    const data = await promise;
    expect(data.id).toEqual("1");
    expect(cb).toHaveBeenCalledTimes(0);
    await client.movies.post({ id: "3", title: "Movie 3" }).revalidated;
    expect(cb).toHaveBeenCalledTimes(1);
  });

  test("wildcard route", async () => {
    const response = await client.files["documents/report.pdf"]!.get();
    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/api/files/documents/report.pdf",
      {
        method: "GET",
      },
    );
    expect(response).toEqual({
      path: "documents/report.pdf",
      message: "Accessing file: documents/report.pdf",
    });
  });

  test("as form action", async () => {
    const formData = new FormData();
    formData.set("id", "3");
    formData.set("title", "Movie 3");
    const response = await client.formData.post(formData);
    expect(response).toEqual({ id: "3", title: "Movie 3" });
  });

  test("not found", async () => {
    const promise = client.error["not-found"].get();
    await expect(promise).rejects.toThrow();
    const anotherPromise = client.error["not-found"].get();
    expect(anotherPromise).toBe(promise);
  });

  test("TTL-based revalidation fires after TTL, not immediately", async () => {
    vi.useFakeTimers();
    // A fresh client with no jitter so timing is deterministic
    const ttlClient = createFetchClient<typeof api.routes>(
      "https://example.com/api",
      { fetch, maxOverdueTTL: 0 },
    );
    try {
      const ttlSeconds = 60;

      // Initial fetch — entry.current is not yet set when we subscribe
      const promise = ttlClient.cached.get();
      const unsubscribe = promise.subscribe(vi.fn());
      await promise;
      await Promise.resolve(); // let waitForRevalidation finish setting entry.current

      // Unsubscribe so size drops to 0, then re-subscribe:
      // the subscribe handler sees entry.current.expiresAt and schedules the TTL timeout
      unsubscribe();
      promise.subscribe(vi.fn());

      expect(fetch).toHaveBeenCalledTimes(1);

      // Before TTL expires: no revalidation
      await vi.advanceTimersByTimeAsync((ttlSeconds - 1) * 1000);
      expect(fetch).toHaveBeenCalledTimes(1);

      // After TTL expires: revalidation should fire
      await vi.advanceTimersByTimeAsync(2 * 1000);
      expect(fetch).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  test("Symbol.toPrimitive", async () => {
    expect((client.method as any)[Symbol.toPrimitive]()).toBe(
      "[TApi Route https://example.com/api/method]",
    );
  });

  test("Stream", async () => {
    const response = await client.stream.get();
    // @ts-ignore
    expect(await Array.fromAsync(response)).toEqual([
      { value: 0 },
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { value: 4 },
    ]);
  });
});
