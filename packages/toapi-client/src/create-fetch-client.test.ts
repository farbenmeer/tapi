import { beforeEach, describe, expect, vi, test } from "vitest";
import { createFetchClient } from "./create-fetch-client.js";
import { mockLogger, type api } from "./api.mock.js";
import { requestHandler } from "./request-handler.mock.js";
import { HttpError, TResponse } from "@toapi/common";
import { defineApi, defineHandler, createRequestHandler } from "@toapi/server";

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
    expect(cb).toHaveBeenCalledTimes(1);
    await promise;
    expect(cb).toHaveBeenCalledTimes(1);
    await client.books.revalidate();
    expect(cb).toHaveBeenCalledTimes(2);
    unsubscribe();
    await client.books.revalidate();
    expect(cb).toHaveBeenCalledTimes(2);
  });

  test("tag-based revalidation", async () => {
    const cb = vi.fn();
    const promise = client.movies[1]!.get({ test: "asdf" });
    promise.subscribe(cb);
    expect(cb).toHaveBeenCalledTimes(1);
    const data = await promise;
    expect(data.id).toEqual("1");
    expect(promise).toBe(cb.mock.calls[0][0]);
    await client.movies.post({ id: "3", title: "Movie 3" }).revalidated;
    expect(cb).toHaveBeenCalledTimes(2);
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
    expect(anotherPromise).not.toBe(promise);
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
      const observable = ttlClient.cached.get();
      const unsubscribe = observable.subscribe(vi.fn());
      await observable;
      await Promise.resolve(); // let waitForRevalidation finish setting entry.current

      // Unsubscribe so size drops to 0, then re-subscribe:
      // the subscribe handler sees entry.current.expiresAt and schedules the TTL timeout
      unsubscribe();
      observable.subscribe(vi.fn());

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

  test("optional query parameters", async () => {
    expect(await client.optionalQuery.get()).toEqual({});
    expect(await client.optionalQuery.get({ optional: "foo" })).toEqual({
      optional: "foo",
    });
  });

  test("undefined query parameters are omitted", async () => {
    expect(await client.optionalQuery.get({ optional: undefined })).toEqual({});
    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/api/optionalQuery",
      { method: "GET" },
    );
  });

  test("errors are propagated", async () => {
    const observable = client.error["not-found"].get();

    const cb = vi.fn();
    observable.subscribe(cb);

    await expect(observable).rejects.toThrow(new HttpError(404, "Not Found"));

    await expect(cb.mock.calls[0][0]).rejects.toThrow(
      new HttpError(404, "Not Found"),
    );

    expect(mockLogger.error).toHaveBeenCalled();
  });

  test("subscribe notifies of newer resolved value when revalidation completed before subscribe", async () => {
    // Get the observable and wait for it to resolve so entry.current is set
    const observable = client.books.get();
    await observable;

    // Trigger a revalidation and wait for it to fully complete so entry.current
    // is updated to the new observable and entry.next is cleared
    await client.books.revalidate();

    // Now subscribe to the *original* observable — a new subscriber that missed
    // the revalidation. The callback should fire immediately with the newer value.
    const cb = vi.fn();
    observable.subscribe(cb);

    expect(cb).toHaveBeenCalledTimes(1);
  });

  test("cache eviction on 404", async () => {
    let exists = true;
    const getThing = vi.fn(async () => {
      if (!exists) throw new HttpError(404, "Not Found");
      return TResponse.json({ name: "thing" }, { cache: { tags: ["thing"] } });
    });
    const deleteThing = vi.fn(async () => {
      exists = false;
      return TResponse.json({ deleted: true }, { cache: { tags: ["thing"] } });
    });
    const api = defineApi({
      logger: mockLogger,
    }).route("/thing", {
      GET: defineHandler({ authorize: () => true }, getThing),
      DELETE: defineHandler({ authorize: () => true }, deleteThing),
    });

    const handler = createRequestHandler(api, {
      basePath: "/api",
    });

    const logClientError = vi.fn();

    const client = createFetchClient<typeof api.routes>("http://test/api", {
      fetch: async (url, init) => {
        return handler(new Request(url, init));
      },
      logger: {
        error: logClientError,
      },
    });

    const sub = vi.fn();
    const observable = client.thing.get();
    const thing = await observable;
    const unsubscribe = observable.subscribe(sub);
    expect(sub).toHaveBeenCalled();

    expect(thing).toEqual({ name: "thing" });

    await client.thing.delete();
    unsubscribe();

    expect(sub).toHaveBeenCalledTimes(2);
    expect(mockLogger.error).toHaveBeenCalledWith(
      new HttpError(404, "Not Found"),
    );
    expect(logClientError).not.toHaveBeenCalled();

    await expect(client.thing.get()).rejects.toThrow(HttpError);
  });
});
