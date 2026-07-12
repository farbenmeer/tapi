import { describe, expect, test } from "vitest";
import { TResponse } from "./t-response.js";

describe("TResponse", () => {
  test("correctly sets tags-header", () => {
    const res = TResponse.json({}, { cache: { tags: ["test"] } });
    expect(res.headers.get("X-TAPI-Tags")).toBe("test");
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
