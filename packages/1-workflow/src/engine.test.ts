import { describe, expect, test, vi } from "vitest";
import { InMemoryAdapter } from "./adapter-inmemory.js";
import { startEngine } from "./engine.js";
import { step } from "./step.js";
import { workflow } from "./workflow.js";

describe("engine", () => {
  const logger = {
    error: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  };

  test("fullWorkflow", async () => {
    const engine = startEngine({
      storage: new InMemoryAdapter(),
      workflows: {
        fullWorkflow: workflow(async () => {}),
      },
      logger,
    });

    await engine.fullWorkflow();
    engine.stop();
  });

  test("failure", async () => {
    const fail = vi.fn(() => Promise.reject(new Error("NEIN")));
    const failingStep = step<void, void>({ baseTimeout: 1 }, fail);

    const processError = vi.fn(() => Promise.resolve());
    const processErrorStep = step<unknown, void>(processError);

    const engine = startEngine({
      storage: new InMemoryAdapter(),
      logger,
      workflows: {
        failingWorkflow: workflow(async () => {
          await failingStep();
        }),
        finishingWorkflow: workflow(async () => {
          try {
            await failingStep();
          } catch (e) {
            await processErrorStep(e);
          }
        }),
      },
    });

    await engine.failingWorkflow();

    await vi.waitFor(async () => {
      const result = await engine.listWorkflows();
      const failingWorkflow = result.workflows.find(
        (w) => w.workflowId === "failingWorkflow",
      );

      expect(failingWorkflow?.error).toBe("NEIN");
      expect(fail).toHaveBeenCalledTimes(3);
      expect(logger.error).toHaveBeenCalledTimes(1);
    });

    await engine.finishingWorkflow();

    await vi.waitFor(async () => {
      const result = await engine.listWorkflows();
      const finishingWorkflow = result.workflows.find(
        (w) => w.workflowId === "finishingWorkflow",
      );

      expect(finishingWorkflow?.workflowId).toBe("finishingWorkflow");
      expect(processError).toHaveBeenCalledWith(new Error("NEIN"));
      expect(finishingWorkflow?.error).toBeNull();
    });

    engine.stop();
  });

  test("parallel steps via Promise.all", async () => {
    const aFn = vi.fn(() => Promise.resolve("a"));
    const bFn = vi.fn(() => Promise.resolve("b"));
    const stepA = step<void, string>(aFn);
    const stepB = step<void, string>(bFn);

    const collected: string[] = [];
    const collect = step<string[], void>(async (values) => {
      collected.push(...values);
    });

    const storage = new InMemoryAdapter();
    const engine = startEngine({
      storage,
      logger,
      workflows: {
        parallel: workflow(async () => {
          const values = await Promise.all([stepA(), stepB()]);
          await collect(values);
        }),
      },
    });

    await engine.parallel();

    await vi.waitFor(async () => {
      const result = await engine.listWorkflows();
      const parallel = result.workflows.find(
        (w) => w.workflowId === "parallel",
      );
      expect(parallel?.finishedAt).not.toBeNull();
      expect(parallel?.error).toBeNull();
    });

    expect(aFn).toHaveBeenCalledTimes(1);
    expect(bFn).toHaveBeenCalledTimes(1);
    expect(collected).toEqual(["a", "b"]);

    engine.stop();
  });

  test("same step called multiple times gets distinct ids", async () => {
    const fn = vi.fn((input: number) => Promise.resolve(input * 2));
    const double = step<number, number>(fn);

    const results: number[] = [];
    const engine = startEngine({
      storage: new InMemoryAdapter(),
      logger,
      workflows: {
        loop: workflow(async () => {
          for (let i = 1; i <= 3; i++) {
            results.push(await double(i));
          }
        }),
      },
    });

    await engine.loop();

    await vi.waitFor(async () => {
      const page = await engine.listWorkflows();
      const w = page.workflows.find((w) => w.workflowId === "loop");
      expect(w?.finishedAt).not.toBeNull();
    });

    expect(fn).toHaveBeenCalledTimes(3);
    expect(results).toEqual([2, 4, 6]);

    engine.stop();
  });
});
