import { describe, expect, test } from "vitest";
import { compilePathRegex } from "./create-request-handler";

describe("compilePathRegex", () => {
  test("match a simple route", () => {
    const pattern = compilePathRegex("/routes");
    expect(pattern.test("/routes")).toBe(true);
    expect(pattern.test("/routes1234")).toBe(false);
    expect(pattern.test("/routes/[id]")).toBe(false);
    expect(pattern.test("/asdf")).toBe(false);
  });

  test("match route with dynamic segment", () => {
    const pattern = compilePathRegex("/routes/[id]");
    expect(pattern.test("/routes/123")).toBe(true);
    expect(pattern.test("/routes/abc")).toBe(true);
    expect(pattern.test("/routes/")).toBe(false);
    expect(pattern.test("/routes")).toBe(false);
    const match = "/routes/123".match(pattern);
    expect(match?.[0]).toEqual("/routes/123");
    expect(match?.[1]).toEqual("123");
    expect(match?.groups).toEqual({ id: "123" });
  });
});
