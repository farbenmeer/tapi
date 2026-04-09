import crypto from "node:crypto";
import { describe, expect, test, vi } from "vitest";
import { StepState } from "./adapter";
import { InMemoryAdapter } from "./adapter-inmemory";
import { FatalError } from "./fatal-error";
import { step } from "./step";

describe("step", () => {
  async function runStep(step: () => void, storage = new InMemoryAdapter()) {
    try {
      step();
    } catch (step: any) {
      const stepState: StepState = {
        runId: crypto.randomUUID(),
        stepId: step.id(),
        result: null,
        error: null,
        attempt: 0,
      };

      await step.run(storage, stepState, AbortSignal.timeout(1000));

      return stepState;
    }

    throw new Error("Unreachable");
  }

  test("regular step", async () => {
    const storage = new InMemoryAdapter();

    const fn = vi.fn(() => Promise.resolve("foo"));
    const sut = step<void, string>(fn);

    const stepState = await runStep(sut, storage);

    expect(stepState.result).toBe("foo");
    expect(await storage.getSteps(stepState.runId)).toEqual(
      new Map([[stepState.stepId, stepState]]),
    );
  });

  test("resolve on first retry", async () => {
    const fn = vi.fn(() => Promise.resolve("foo"));
    fn.mockThrowOnce(new Error("NEIN"));

    const sut = step<void, string>(fn);

    const stepState = await runStep(sut);

    expect(stepState.result).toBe("foo");
    expect(stepState.attempt).toBe(2);
  });

  test("fails after n retries", async () => {
    const storage = new InMemoryAdapter();

    const fn = vi.fn(() => Promise.reject("NEIN"));

    const sut = step<void, string>({ baseTimeout: 1 }, fn);
    await expect(() => runStep(sut, storage)).rejects.toThrow("NEIN");

    const [stepState] = storage.steps.values();

    expect(stepState.error).toBe("NEIN");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test("fails immediately on fatal error", async () => {
    const storage = new InMemoryAdapter();

    const fn = vi.fn(() => Promise.reject(new FatalError("NEIN")));

    const sut = step<void, string>({ baseTimeout: 1 }, fn);
    await expect(() => runStep(sut, storage)).rejects.toThrow("NEIN");

    const [stepState] = storage.steps.values();

    expect(stepState.error).toBe("FatalError: NEIN");
  });

  test("throws original error on fatal error", async () => {
    const storage = new InMemoryAdapter();

    const fn = vi.fn(() =>
      Promise.reject(FatalError.from(new TypeError("NEIN"))),
    );

    const sut = step<void, string>({ baseTimeout: 1 }, fn);
    await expect(() => runStep(sut, storage)).rejects.toThrow(TypeError);

    const [stepState] = storage.steps.values();

    expect(stepState.error).toBe("TypeError: NEIN");
  });
});
