import { describe, expect, test } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRandom } from "./rng";

describe("useRandom", () => {
  test("returns a number between 0 and 1", () => {
    const { result } = renderHook(() => useRandom());

    expect(result.current).toBeGreaterThanOrEqual(0);
    expect(result.current).toBeLessThanOrEqual(1);
  });

  test("returns the same value on re-render", () => {
    const { result, rerender } = renderHook(() => useRandom());

    const firstValue = result.current;
    rerender();
    const secondValue = result.current;

    expect(firstValue).toBe(secondValue);
  });

  test("returns different values for different component instances", () => {
    const { result: result1 } = renderHook(() => useRandom());
    const { result: result2 } = renderHook(() => useRandom());
    const { result: result3 } = renderHook(() => useRandom());

    // At least two of the three should be different
    const values = [result1.current, result2.current, result3.current];
    const uniqueValues = new Set(values);

    expect(uniqueValues.size).toBeGreaterThan(1);
  });

  test("returns a valid number", () => {
    const { result } = renderHook(() => useRandom());

    expect(typeof result.current).toBe("number");
    expect(Number.isFinite(result.current)).toBe(true);
    expect(Number.isNaN(result.current)).toBe(false);
  });
});
