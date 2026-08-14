import { describe, expect, expectTypeOf, test } from "vitest";
import { TResponse, type JSONValue } from "./t-response.js";

describe("TResponse", () => {
  test("correctly sets tags-header", () => {
    const res = TResponse.json({}, { cache: { tags: ["test"] } });
    expect(res.headers.get("X-TAPI-Tags")).toBe("test");
  });

  test("ndjson sets correct content-type", () => {
    async function* gen() {}
    const res = TResponse.ndjson(gen());
    expect(res.headers.get("Content-Type")).toBe("application/x-ndjson");
  });

  test("ndjson streams items as newline-delimited JSON", async () => {
    async function* gen() {
      yield { id: 1 };
      yield { id: 2 };
    }
    const res = TResponse.ndjson(gen());
    const text = await res.text();
    expect(text).toBe('{"id":1}\n{"id":2}\n');
  });

  test("json accepts JSON-serializable values", () => {
    // These calls must compile (proving the JSONValue constraint accepts them)
    // and are safe to execute at runtime.
    TResponse.json("hello");
    TResponse.json(42);
    TResponse.json(true);
    TResponse.json(null);
    TResponse.json([1, "two", false, null]);
    TResponse.json({ now: "2024-01-01" });
    TResponse.json({ nested: { a: 1, list: [true, null, "x"] } });
  });

  test("json infers the response type from the JSON data", () => {
    const objectRes = TResponse.json({ now: "2024-01-01" });
    expectTypeOf(objectRes.data).toEqualTypeOf<{ now: string } | undefined>();

    const arrayRes = TResponse.json([1, 2, 3]);
    expectTypeOf(arrayRes.data).toEqualTypeOf<number[] | undefined>();
  });

  test("json rejects non-JSON values at compile time", () => {
    // The assignments below are expected to fail type-checking because the
    // values are not representable as JSON. `@ts-expect-error` consumes the
    // error; if a value ever became JSON-compatible the directive would itself
    // error, keeping the contract honest. None of these call `JSON.stringify`,
    // so they are safe to execute at runtime (bigint/symbol would otherwise
    // throw when serialized).

    // @ts-expect-error Date serializes to a string, breaking the type boundary
    const dateValue: JSONValue = new Date();
    // @ts-expect-error bigint throws when serialized and is not JSON
    const bigintValue: JSONValue = 1n;
    // @ts-expect-error symbol is not JSON-serializable
    const symbolValue: JSONValue = Symbol("x");
    // @ts-expect-error undefined is not representable in JSON
    const undefinedValue: JSONValue = undefined;
    // @ts-expect-error Map is not JSON-serializable
    const mapValue: JSONValue = new Map();
    // @ts-expect-error Set is not JSON-serializable
    const setValue: JSONValue = new Set();
    // @ts-expect-error functions are not JSON-serializable
    const functionValue: JSONValue = () => {};

    // End-to-end: the original issue scenario must be rejected.
    // Safe at runtime: `JSON.stringify({ now: date })` does not throw.
    // @ts-expect-error TResponse.json must not accept Date values
    TResponse.json({ now: new Date() });

    // reference the locals so they are not dropped by tooling
    void [
      dateValue,
      bigintValue,
      symbolValue,
      undefinedValue,
      mapValue,
      setValue,
      functionValue,
    ];
  });
});
