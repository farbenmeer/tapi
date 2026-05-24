import crypto from "node:crypto";
import { describe, expect, test, vi } from "vitest";
import { InMemoryAdapter } from "./adapter-inmemory.js";
import { context, type RunContext } from "./context.js";
import { FatalError } from "./fatal-error.js";
import { step } from "./step.js";

interface StepResult<T> {
  ctx: RunContext;
  result: T | undefined;
  error: unknown;
  storage: InMemoryAdapter;
}

async function withContext<T>(
  body: () => Promise<T>,
  storage: InMemoryAdapter = new InMemoryAdapter(),
): Promise<StepResult<T>> {
  const ctx: RunContext = {
    runId: crypto.randomUUID(),
    storage,
    abortSignal: AbortSignal.timeout(5000),
    stepState: new Map(),
    callIndex: 0,
  };

  let result: T | undefined;
  let error: unknown;
  await context.run(ctx, async () => {
    try {
      result = await body();
    } catch (e) {
      error = e;
    }
  });

  return { ctx, result, error, storage };
}

describe("step", () => {
  test("regular step", async () => {
    const fn = vi.fn(() => Promise.resolve("foo"));
    const sut = step<void, string>(fn);

    const { ctx, result, storage } = await withContext(() => sut());

    expect(result).toBe("foo");
    const [stepState] = ctx.stepState.values();
    expect(stepState?.result).toBe("foo");
    expect(await storage.getSteps(ctx.runId)).toEqual(
      new Map([[stepState!.stepId, stepState]]),
    );
  });

  test("resolve on first retry", async () => {
    let calls = 0;
    const fn = vi.fn(() => {
      calls++;
      if (calls === 1) return Promise.reject(new Error("NEIN"));
      return Promise.resolve("foo");
    });
    const sut = step<void, string>({ baseTimeout: 1 }, fn);

    const { ctx, result } = await withContext(() => sut());

    expect(result).toBe("foo");
    const [stepState] = ctx.stepState.values();
    expect(stepState?.attempt).toBe(2);
  });

  test("fails after n retries", async () => {
    const fn = vi.fn(() => Promise.reject("NEIN"));
    const sut = step<void, string>({ baseTimeout: 1 }, fn);

    const { error, ctx, storage } = await withContext(() => sut());

    expect(String(error)).toContain("NEIN");
    const steps = await storage.getSteps(ctx.runId);
    const [savedStep] = steps.values();
    expect(savedStep?.error).toBe("NEIN");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test("fails immediately on fatal error", async () => {
    const fn = vi.fn(() => Promise.reject(new FatalError("NEIN")));
    const sut = step<void, string>({ baseTimeout: 1 }, fn);

    const { error, ctx, storage } = await withContext(() => sut());

    expect(error).toBeInstanceOf(FatalError);
    expect((error as Error).message).toBe("NEIN");
    const steps = await storage.getSteps(ctx.runId);
    const [savedStep] = steps.values();
    expect(savedStep?.error).toBe("FatalError: NEIN");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("throws original error on fatal error", async () => {
    const fn = vi.fn(() =>
      Promise.reject(FatalError.from(new TypeError("NEIN"))),
    );
    const sut = step<void, string>({ baseTimeout: 1 }, fn);

    const { error, ctx, storage } = await withContext(() => sut());

    expect(error).toBeInstanceOf(TypeError);
    const steps = await storage.getSteps(ctx.runId);
    const [savedStep] = steps.values();
    expect(savedStep?.error).toBe("TypeError: NEIN");
  });

  test("step() outside of a workflow throws", async () => {
    const sut = step<void, string>(() => Promise.resolve("foo"));
    await expect(() => sut()).rejects.toThrow(/inside a workflow/);
  });

  test("cached successful result is returned without re-running", async () => {
    const fn = vi.fn(() => Promise.resolve("foo"));
    const sut = step<void, string>(fn);

    const ctx: RunContext = {
      runId: crypto.randomUUID(),
      storage: new InMemoryAdapter(),
      abortSignal: AbortSignal.timeout(5000),
      stepState: new Map(),
      callIndex: 0,
    };

    await context.run(ctx, async () => {
      await sut();
    });
    expect(fn).toHaveBeenCalledTimes(1);

    ctx.callIndex = 0;
    let cached: string | undefined;
    await context.run(ctx, async () => {
      cached = await sut();
    });
    expect(cached).toBe("foo");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("cached error is re-thrown on replay without re-running", async () => {
    const fn = vi.fn(() => Promise.reject(new Error("NEIN")));
    const sut = step<void, string>({ baseTimeout: 1 }, fn);

    const ctx: RunContext = {
      runId: crypto.randomUUID(),
      storage: new InMemoryAdapter(),
      abortSignal: AbortSignal.timeout(5000),
      stepState: new Map(),
      callIndex: 0,
    };

    let firstError: unknown;
    await context.run(ctx, async () => {
      try {
        await sut();
      } catch (e) {
        firstError = e;
      }
    });
    expect((firstError as Error).message).toBe("NEIN");
    expect(fn).toHaveBeenCalledTimes(3);

    ctx.callIndex = 0;
    let replayError: unknown;
    await context.run(ctx, async () => {
      try {
        await sut();
      } catch (e) {
        replayError = e;
      }
    });
    expect((replayError as Error).message).toBe("Error: NEIN");
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
