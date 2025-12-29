import { describe, expect, test } from "vitest";
import { TResponse } from "./t-response.js";

describe("TResponse", () => {
  test("correctly sets tags-header", () => {
    const res = TResponse.json({}, { tags: ["test"] });
    expect(res.headers.get("X-TAPI-Tags")).toBe("test");
  });
});
