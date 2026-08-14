import { describe, it, expect } from "vitest";
import { CookieStore } from "./cookie-store";

function makeRequest(cookie?: string): Request {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  return new Request("http://localhost", { headers });
}

describe("CookieStore", () => {
  describe("constructor", () => {
    it("parses a cookie string from the request", async () => {
      const store = new CookieStore(makeRequest("a=1; b=2"));
      expect(await store.getAll()).toHaveLength(2);
    });

    it("handles an empty cookie header", async () => {
      const store = new CookieStore(makeRequest());
      expect(await store.getAll()).toEqual([]);
    });

    it("decodes URI-encoded values", async () => {
      const store = new CookieStore(makeRequest("name=hello%20world"));
      const cookie = await store.get("name");
      expect(cookie?.value).toBe("hello world");
    });

    it("handles cookies with = in the value", async () => {
      const store = new CookieStore(makeRequest("token=abc=def=ghi"));
      const cookie = await store.get("token");
      expect(cookie?.value).toBe("abc=def=ghi");
    });
  });

  describe("get", () => {
    it("returns a cookie by name string", async () => {
      const store = new CookieStore(makeRequest("a=1; b=2"));
      const cookie = await store.get("b");
      expect(cookie).toMatchObject({ name: "b", value: "2" });
    });

    it("returns a cookie by options object", async () => {
      const store = new CookieStore(makeRequest("a=1"));
      const cookie = await store.get({ name: "a" });
      expect(cookie).toMatchObject({ name: "a", value: "1" });
    });

    it("returns undefined for a missing cookie", async () => {
      const store = new CookieStore(makeRequest("a=1"));
      expect(await store.get("missing")).toBeUndefined();
    });

    it("returns the first cookie when called with no arguments", async () => {
      const store = new CookieStore(makeRequest("first=1; second=2"));
      const cookie = await store.get();
      expect(cookie).toMatchObject({ name: "first", value: "1" });
    });
  });

  describe("getAll", () => {
    it("returns all cookies when called with no arguments", async () => {
      const store = new CookieStore(makeRequest("a=1; b=2; c=3"));
      const cookies = await store.getAll();
      expect(cookies).toHaveLength(3);
    });

    it("returns matching cookies by name string", async () => {
      const store = new CookieStore(makeRequest("a=1; b=2"));
      const cookies = await store.getAll("a");
      expect(cookies).toHaveLength(1);
      expect(cookies[0]).toMatchObject({ name: "a", value: "1" });
    });

    it("returns matching cookies by options object", async () => {
      const store = new CookieStore(makeRequest("a=1; b=2"));
      const cookies = await store.getAll({ name: "b" });
      expect(cookies).toHaveLength(1);
      expect(cookies[0]).toMatchObject({ name: "b", value: "2" });
    });

    it("returns an empty array for no matches", async () => {
      const store = new CookieStore(makeRequest("a=1"));
      expect(await store.getAll("missing")).toEqual([]);
    });

    it("returns a copy, not a reference", async () => {
      const store = new CookieStore(makeRequest("a=1"));
      const first = await store.getAll();
      const second = await store.getAll();
      expect(first).not.toBe(second);
    });
  });

  describe("set", () => {
    it("sets a cookie with name and value", async () => {
      const store = new CookieStore(makeRequest());
      await store.set("a", "1");
      expect(await store.get("a")).toMatchObject({ name: "a", value: "1" });
    });

    it("sets a cookie with an options object", async () => {
      const store = new CookieStore(makeRequest());
      await store.set({ name: "a", value: "1", path: "/test", sameSite: "strict" });
      const cookie = await store.get("a");
      expect(cookie).toMatchObject({ name: "a", value: "1", path: "/test", sameSite: "strict" });
    });

    it("updates an existing cookie", async () => {
      const store = new CookieStore(makeRequest("a=1"));
      await store.set("a", "2");
      const cookie = await store.get("a");
      expect(cookie?.value).toBe("2");
      expect(await store.getAll()).toHaveLength(1);
    });

    it("preserves existing properties when updating", async () => {
      const store = new CookieStore(makeRequest());
      await store.set({ name: "a", value: "1", sameSite: "strict" });
      await store.set({ name: "a", value: "2" });
      const cookie = await store.get("a");
      expect(cookie?.sameSite).toBe("strict");
      expect(cookie?.value).toBe("2");
    });

    it("defaults value to empty string when omitted", async () => {
      const store = new CookieStore(makeRequest());
      await store.set("a");
      expect((await store.get("a"))?.value).toBe("");
    });
  });

  describe("delete", () => {
    it("deletes a cookie by name", async () => {
      const store = new CookieStore(makeRequest("a=1; b=2"));
      await store.delete("a");
      expect(await store.get("a")).toBeUndefined();
      expect(await store.getAll()).toHaveLength(1);
    });

    it("deletes a cookie by options object", async () => {
      const store = new CookieStore(makeRequest("a=1"));
      await store.delete({ name: "a" });
      expect(await store.get("a")).toBeUndefined();
    });

    it("does not throw when deleting a non-existent cookie", async () => {
      const store = new CookieStore(makeRequest());
      await expect(store.delete("missing")).resolves.toBeUndefined();
    });
  });

  describe("write", () => {
    it("does not write headers for unmodified cookies", async () => {
      const store = new CookieStore(makeRequest("a=1; b=2"));
      const headers = new Headers();
      store.write(headers);
      expect(headers.has("set-cookie")).toBe(false);
    });

    it("writes Set-Cookie for changed cookies", async () => {
      const store = new CookieStore(makeRequest());
      await store.set("a", "1");
      const headers = new Headers();
      store.write(headers);
      const setCookies = headers.getSetCookie();
      expect(setCookies).toHaveLength(1);
      expect(setCookies[0]).toContain("a=1");
    });

    it("writes an expiry header for deleted cookies", async () => {
      const store = new CookieStore(makeRequest("a=1"));
      await store.delete("a");
      const headers = new Headers();
      store.write(headers);
      const setCookies = headers.getSetCookie();
      expect(setCookies).toHaveLength(1);
      expect(setCookies[0]).toContain("a=");
      expect(setCookies[0]).toContain("Expires=Thu, 01 Jan 1970");
    });

    it("writes multiple Set-Cookie headers", async () => {
      const store = new CookieStore(makeRequest("old=x"));
      await store.set("a", "1");
      await store.set("b", "2");
      await store.delete("old");
      const headers = new Headers();
      store.write(headers);
      expect(headers.getSetCookie()).toHaveLength(3);
    });

    it("encodes cookie values in Set-Cookie", async () => {
      const store = new CookieStore(makeRequest());
      await store.set("name", "hello world");
      const headers = new Headers();
      store.write(headers);
      expect(headers.getSetCookie()[0]).toContain("name=hello%20world");
    });

    it("includes cookie attributes in Set-Cookie", async () => {
      const store = new CookieStore(makeRequest());
      const expires = Date.now() + 86400000;
      await store.set({
        name: "a",
        value: "1",
        domain: "example.com",
        path: "/test",
        expires,
        sameSite: "strict",
        partitioned: true,
      });
      const headers = new Headers();
      store.write(headers);
      const header = headers.getSetCookie()[0]!;
      expect(header).toContain("Domain=example.com");
      expect(header).toContain("Path=/test");
      expect(header).toContain("Expires=");
      expect(header).toContain("SameSite=Strict");
      expect(header).toContain("Partitioned");
    });

    it("does not write a deleted cookie that was re-set", async () => {
      const store = new CookieStore(makeRequest("a=1"));
      await store.delete("a");
      await store.set("a", "2");
      const headers = new Headers();
      store.write(headers);
      const setCookies = headers.getSetCookie();
      expect(setCookies).toHaveLength(1);
      expect(setCookies[0]).toContain("a=2");
      expect(setCookies[0]).not.toContain("Expires=Thu, 01 Jan 1970");
    });

    it("does not write a set cookie that was then deleted", async () => {
      const store = new CookieStore(makeRequest());
      await store.set("a", "1");
      await store.delete("a");
      const headers = new Headers();
      store.write(headers);
      const setCookies = headers.getSetCookie();
      expect(setCookies).toHaveLength(1);
      expect(setCookies[0]).toContain("Expires=Thu, 01 Jan 1970");
    });
  });
});
