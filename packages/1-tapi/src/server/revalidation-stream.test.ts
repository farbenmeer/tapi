import { describe, expect, test } from "vitest";
import { NoCache } from "./cache";
import { streamRevalidatedTags } from "./revalidation-stream";
import { SESSION_COOKIE_NAME } from "../shared/constants";

describe("revalidation stream", () => {
  test("should set session cookie", async () => {
    const cache = new NoCache();
    const response = streamRevalidatedTags({ cache, buildId: "1337" });

    expect(
      response.headers.get("Set-Cookie")?.startsWith(`${SESSION_COOKIE_NAME}=`)
    ).toBeTruthy();
  });

  test("should send revalidated tags", async () => {
    const cache = new NoCache();
    const response = streamRevalidatedTags({ cache, buildId: "1337" });

    await cache.delete(["tag1"]);

    const result = await response.body?.getReader().read();
    expect(new TextDecoder().decode(result?.value)).toBe("tag1\n");
  });
});
