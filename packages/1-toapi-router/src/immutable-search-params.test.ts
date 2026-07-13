import { describe, expect, test } from "vitest";
import { ImmutableSearchParams } from "./immutable-search-params";

describe("ImmutableSearchParams", () => {
  test("set", () => {
    const params = new ImmutableSearchParams();
    const newParams = params.set("key", "value");
    expect(newParams.get("key")).toBe("value");
    expect(params.get("key")).toBe(null);
  });

  test("append", () => {
    const params = new ImmutableSearchParams();
    const newParams = params.append("key", "value1").append("key", "value2");
    expect(newParams.getAll("key")).toEqual(["value1", "value2"]);
    expect(params.getAll("key")).toEqual([]);
  });

  test("delete", () => {
    const params = new ImmutableSearchParams({ key: "value1" });
    const newParams = params.delete("key");
    expect(newParams.get("key")).toBe(null);
    expect(params.get("key")).toBe("value1");
  });

  test("search", () => {
    const params = new ImmutableSearchParams();
    expect(params.search).toBe("");
    const newParams = params.set("key", "value");
    expect(newParams.search).toBe("?key=value");
  });
});
