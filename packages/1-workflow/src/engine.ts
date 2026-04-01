import type { Adapter, WorkflowState } from "./adapter.js";
import { consoleLogger, type Logger } from "./logger.js";
import { Workflow } from "./workflow.js";

interface Options<W extends Record<string, unknown>> {
  storage: Adapter;
  workflows: Workflows<W>;
  leaseDuration?: number;
  logger?: Logger;
}

type Workflows<W extends Record<string, unknown>> = {
  [key in keyof W]: Workflow<W[key]>;
};

export function startEngine<W extends Record<string, unknown>>({
  storage,
  workflows,
  leaseDuration = 60_000,
  logger = consoleLogger,
}: Options<W>) {
  return new RawEngine(storage, workflows, leaseDuration, logger) as Engine<W>;
}

interface WorkflowController<I> {
  (input: I): Promise<void>;
  schedule: (interval: number, input: I) => Promise<void>;
}

export type Engine<W extends Record<string, unknown>> = RawEngine & {
  [key in keyof W]: WorkflowController<W[key]>;
};

class RawEngine {
  constructor(
    private storage: Adapter,
    private workflows: Record<string, Workflow<any>>,
    private leaseDuration: number,
    private logger: Logger,
  ) {
    this.run();
    Object.keys(workflows).forEach((workflowId) => {
      Object.defineProperty(this, workflowId, {
        get: () => {
          const engine = this;
          async function run(input: unknown) {
            logger.debug(`Triggered workflow ${workflowId}`, { input });
            await engine.start(workflowId, input);
            setTimeout(() => engine.run());
          }

          return Object.assign(run, {
            schedule: (interval: number, input: unknown) =>
              engine.runScheduled(workflowId, input, interval),
          });
        },
      });
    });
  }

  async run() {
    this.logger.debug("Engine running");
    let next: WorkflowState | null;
    next = await this.storage.getNextWorkflow(this.leaseDuration);

    while (next) {
      this.logger.debug(`Next workflow: ${next.workflowId}`, {
        input: next.input,
      });
      const workflow = this.workflows[next.workflowId];
      if (workflow) {
        const runId = next.runId;
        const abortController = new AbortController();
        const leaseInterval = setInterval(() => {
          try {
            this.storage.renewLease(runId, this.leaseDuration);
          } catch {
            abortController.abort("Failed to renew lease");
          }
        }, this.leaseDuration);
        try {
          await workflow.run(this.storage, next, abortController.signal);
        } catch (cause) {
          const error =
            cause instanceof Error
              ? cause
              : new Error("Unexpected error", { cause });
          this.logger.error(error);
          await this.storage.failWorkflow(next.runId, error.message);
        }
        clearInterval(leaseInterval);
        await this.storage.finishWorkflow(next.runId);
      } else {
        const error = new Error(`Workflow "${next.workflowId}" not found`);
        this.logger.error(error);
        await this.storage.failWorkflow(next.runId, error.message);
      }

      next = await this.storage.getNextWorkflow(this.leaseDuration);
    }
  }

  private async start(workflowId: string, input: unknown) {
    await this.storage.createWorkflow({
      workflowId,
      input,
    });
  }

  private async runScheduled(
    workflowId: string,
    input: unknown,
    interval: number,
  ): Promise<void> {
    const lastRun = await this.storage.getLastestRun(
      workflowId as string,
      input,
    );

    const lastRunStartedAt = lastRun?.startedAt.getTime() ?? 0;
    const nextRunIn = lastRunStartedAt + interval * 1000 - Date.now();

    if (nextRunIn <= 0) {
      await this.start(workflowId as string, input);
      setTimeout(() => this.run());
      setTimeout(
        () => this.runScheduled(workflowId, input, interval),
        interval,
      );
      return;
    }

    setTimeout(() => this.runScheduled(workflowId, input, interval), nextRunIn);
  }
}
