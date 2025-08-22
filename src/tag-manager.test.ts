import { describe, expect, test } from "bun:test";
import { TagManager } from "./tag-manager";

describe("TagManager", () => {
  function createResponse(url: string, tags: string[]) {
    class TestResponse extends Response {
      override url = url;
    }
    return new TestResponse(null, {
      headers: {
        "X-TAPI-Tags": tags.join(" "),
      },
    });
  }

  test("clear one of two urls", () => {
    const tm = new TagManager();
    tm.add(createResponse("https://example.com", ["tag1", "tag2"]));
    tm.add(createResponse("https://example.org", ["tag2", "tag3"]));

    expect(tm.remove(createResponse("https://example.com", ["tag1"]))).toEqual([
      "https://example.com",
    ]);
  });

  test("clear both urls", () => {
    const tm = new TagManager();
    tm.add(createResponse("https://example.com", ["tag1", "tag2"]));
    tm.add(createResponse("https://example.org", ["tag2", "tag3"]));

    expect(tm.remove(createResponse("https://example.com", ["tag2"]))).toEqual([
      "https://example.com",
      "https://example.org",
    ]);
  });
});
