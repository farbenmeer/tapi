import { describe, expect, test } from "bun:test";
import {
  compilePathRegex,
  createRequestHandler,
} from "./create-request-handler";
import { api } from "./define-api.test";

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
    expect("/routes/123".match(pattern)).toEqual(["/routes/123", "123"]);
    expect("/routes/123".match(pattern)?.groups).toEqual({ id: "123" });
  });
});

export const requestHandler = createRequestHandler(api, { basePath: "/api" });
