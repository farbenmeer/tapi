import { describe, expect, test } from "bun:test";
import { TResponse } from "./t-response";

describe("TResponse", () => {
  test("correctly sets tags-header", () => {
    const res = TResponse.json({}, { tags: ["test"] });
    expect(res.headers.get("X-TAPI-Tags")).toBe("test");
  });
});
