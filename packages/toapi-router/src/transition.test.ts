import { describe, expect, test, vi } from "vitest";
import { runTransition } from "./transition.js";

describe("runTransition", () => {
  test("calls scope synchronously exactly once when useTransition is false", () => {
    const scope = vi.fn();
    runTransition(false, scope);
    expect(scope).toHaveBeenCalledTimes(1);
  });

  test("calls the custom transition function exactly once when useTransition is a function", () => {
    const scope = vi.fn();
    const custom = vi.fn((s: () => void) => s());
    runTransition(custom, scope);
    expect(custom).toHaveBeenCalledTimes(1);
    expect(custom).toHaveBeenCalledWith(scope);
    expect(scope).toHaveBeenCalledTimes(1);
  });

  test("wraps scope in startTransition exactly once when useTransition is true", async () => {
    const scope = vi.fn();
    runTransition(true, scope);
    await Promise.resolve();
    expect(scope).toHaveBeenCalledTimes(1);
  });

  test("wraps scope in startTransition exactly once when useTransition is undefined", async () => {
    const scope = vi.fn();
    runTransition(undefined, scope);
    await Promise.resolve();
    expect(scope).toHaveBeenCalledTimes(1);
  });
});
