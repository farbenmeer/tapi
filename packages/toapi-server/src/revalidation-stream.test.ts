import { describe, expect, test } from "vitest";
import { PubSub } from "./cache.js";
import { streamRevalidatedTags } from "./revalidation-stream.js";
import { SESSION_COOKIE_NAME } from "@toapi/common";

describe("revalidation stream", () => {
  test("should set session cookie", async () => {
    const cache = new PubSub();
    const response = streamRevalidatedTags({ cache });

    expect(
      response.headers.get("Set-Cookie")?.startsWith(`${SESSION_COOKIE_NAME}=`)
    ).toBeTruthy();
  });

  test("should flush an initial keepalive so headers are sent immediately", async () => {
    const cache = new PubSub();
    const response = streamRevalidatedTags({ cache });

    const result = await response.body?.getReader().read();
    expect(new TextDecoder().decode(result?.value)).toBe("\n");
  });

  test("should send revalidated tags", async () => {
    const cache = new PubSub();
    const response = streamRevalidatedTags({ cache });
    const reader = response.body!.getReader();

    // consume the initial keepalive
    await reader.read();

    await cache.delete(["tag1"]);

    const result = await reader.read();
    expect(new TextDecoder().decode(result?.value)).toBe("tag1\n");
  });
});
