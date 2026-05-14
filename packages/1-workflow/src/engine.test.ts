import { describe, expect, test, vi } from "vitest";
import { InMemoryAdapter } from "./adapter-inmemory";
import { startEngine } from "./engine";
import { rethrowSuspense } from "./rethrow-suspense";
import { step } from "./step";
import { workflow } from "./workflow";

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
        fullWorkflow: workflow(() => {}),
      },
      logger,
    });

    await engine.fullWorkflow();
  });

  test("failure", async () => {
    const fail = vi.fn(() => {
      throw new Error("NEIN");
    });
    const failingStep = step<void, void>(fail);

    const processError = vi.fn();
    const processErrorStep = step<unknown, void>(processError);

    const engine = startEngine({
      storage: new InMemoryAdapter(),
      logger,
      workflows: {
        failingWorkflow: workflow(() => {
          failingStep();
        }),
        finishingWorkflow: workflow(() => {
          try {
            failingStep();
          } catch (e) {
            rethrowSuspense(e);
            processErrorStep(e);
          }
        }),
      },
    });

    await engine.failingWorkflow();

    await vi.waitFor(async () => {
      const result = await engine.listWorkflows();
      const [failingWorkflow] = result.workflows;

      expect(failingWorkflow.workflowId).toBe("failingWorkflow");
      expect(failingWorkflow.error).toBe("NEIN");
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
});
