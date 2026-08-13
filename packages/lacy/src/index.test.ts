import { describe, test, expect } from "vitest";
import { lacy } from "./index";

describe("lacy", () => {
  test("Makes a property on an object accessible", async () => {
    const lacyPromise = lacy(Promise.resolve({ a: 1 }));

    expect(await lacyPromise.a).toBe(1);
  });

  test("Works for an array element", async () => {
    const lacyPromise = lacy(Promise.resolve([1, 2, 3]));

    expect(await lacyPromise[0]).toBe(1);
    expect(await lacyPromise[1]).toBe(2);
  });

  test("Supports method calls", async () => {
    const lacyPromise = lacy(Promise.resolve([1, 2, 3]));

    expect(await lacyPromise.map((e) => e + 1)).toEqual([2, 3, 4]);
  });

  test("Null resolves to null", async () => {
    const lacyPromise = lacy(Promise.resolve({ test: null }));

    expect(await lacyPromise.test).toBe(null);
  });

  test("undefined resolves to undefined", async () => {
    const lacyPromise = lacy(Promise.resolve({ test: undefined }));

    expect(await lacyPromise.test).toBeUndefined();
  });

  test("returns a raw promise when then is called", () => {
    const lacyPromise = lacy(Promise.resolve(null));

    expect(lacyPromise.then()).toBeInstanceOf(Promise);
  });
});
