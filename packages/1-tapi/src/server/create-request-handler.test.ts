import { describe, expect, test } from "vitest";
import { compilePathRegex } from "./create-request-handler.js";

describe("compilePathRegex", () => {
  test("match a simple route", () => {
    const pattern = compilePathRegex("/routes");
    expect(pattern.test("/routes")).toBe(true);
    expect(pattern.test("/routes1234")).toBe(false);
    expect(pattern.test("/routes/:id")).toBe(false);
    expect(pattern.test("/asdf")).toBe(false);
  });

  test("match route with dynamic segment", () => {
    const pattern = compilePathRegex("/routes/:id");
    expect(pattern.test("/routes/123")).toBe(true);
    expect(pattern.test("/routes/abc")).toBe(true);
    expect(pattern.test("/routes/")).toBe(false);
    expect(pattern.test("/routes")).toBe(false);
    const match = "/routes/123".match(pattern);
    expect(match?.[0]).toEqual("/routes/123");
    expect(match?.[1]).toEqual("123");
    expect(match?.groups).toEqual({ id: "123" });
  });

  test("match route with wildcard", () => {
    const pattern = compilePathRegex("/files/*");
    expect(pattern.test("/files/a")).toBe(true);
    expect(pattern.test("/files/a/b")).toBe(true);
    expect(pattern.test("/files/a/b/c")).toBe(true);
    expect(pattern.test("/files/")).toBe(false);
    expect(pattern.test("/files")).toBe(false);
    expect(pattern.test("/other")).toBe(false);
  });

  test("match route with named wildcard", () => {
    const pattern = compilePathRegex("/files/*path");
    expect(pattern.test("/files/a")).toBe(true);
    expect(pattern.test("/files/a/b")).toBe(true);
    expect(pattern.test("/files/a/b/c")).toBe(true);
    const match = "/files/a/b/c".match(pattern);
    expect(match?.groups).toEqual({ path: "a/b/c" });
  });

  test("match route with param and wildcard", () => {
    const pattern = compilePathRegex("/api/:version/*rest");
    expect(pattern.test("/api/v1/users/123")).toBe(true);
    expect(pattern.test("/api/v2/posts/456/comments")).toBe(true);
    const match = "/api/v1/users/123".match(pattern);
    expect(match?.groups).toEqual({ version: "v1", rest: "users/123" });
  });
});
