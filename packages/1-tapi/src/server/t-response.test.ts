import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { TResponse } from "./t-response.js";
import { EXPIRES_AT_HEADER, TAGS_HEADER } from "../shared/constants.js";

describe("TResponse", () => {
  const ts = new Date("2024-07-22T01:26:11Z");
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(ts);
  });
  afterAll(() => {
    vi.useRealTimers();
  });
  test("correctly sets tags-header", () => {
    const res = TResponse.json({}, { cache: { tags: ["test"] } });
    expect(res.headers.get(TAGS_HEADER)).toBe("test");
  });

  test("correctly sets cache-ttl", () => {
    const res = TResponse.json({}, { cache: { ttl: 1 } });
    expect(res.headers.get(EXPIRES_AT_HEADER)).toBe(
      (ts.getTime() + 1000).toString(),
    );
  });

  test("ndjson sets correct content-type", () => {
    async function* gen() {}
    const res = TResponse.ndjson(gen());
    expect(res.headers.get("Content-Type")).toBe("application/x-ndjson");
  });

  test("ndjson streams items as newline-delimited JSON", async () => {
    async function* gen() {
      yield { id: 1 };
      yield { id: 2 };
    }
    const res = TResponse.ndjson(gen());
    const text = await res.text();
    expect(text).toBe('{"id":1}\n{"id":2}\n');
  });
});
