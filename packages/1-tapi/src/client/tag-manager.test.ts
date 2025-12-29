import { describe, expect, test } from "vitest";
import { TagManager } from "./tag-manager";

describe("TagManager", () => {
  test("get one of two urls", () => {
    const tm = new TagManager();
    tm.add("https://example.com", ["tag1", "tag2"]);
    tm.add("https://example.org", ["tag2", "tag3"]);

    expect(tm.get(["tag1"])).toEqual(["https://example.com"]);
  });

  test("get both urls", () => {
    const tm = new TagManager();
    tm.add("https://example.com", ["tag1", "tag2"]);
    tm.add("https://example.org", ["tag2", "tag3"]);

    expect(tm.get(["tag2"])).toEqual([
      "https://example.com",
      "https://example.org",
    ]);
  });

  test("remove url", () => {
    const tm = new TagManager();
    tm.add("https://example.com", ["tag1", "tag2"]);
    tm.add("https://example.org", ["tag2", "tag3"]);

    tm.remove("https://example.com");

    expect(tm.get(["tag2"])).toEqual(["https://example.org"]);
  });
});
