import { log } from "console";
import type { Adapter } from "./adapter.js";
import { consoleLogger, type Logger } from "./logger.js";
import { Workflow } from "./workflow.js";

export function startEngine<W extends Record<string, Workflow<unknown>>>({
  storage,
  workflows,
  leaseDuration = 60_000,
  logger = consoleLogger,
}: {
  storage: Adapter;
  workflows: W;
  leaseDuration?: number;
  logger?: Logger;
}) {
  return new RawEngine(storage, workflows, leaseDuration, logger) as Engine<W>;
}

export type Engine<W extends Record<string, Workflow<unknown>>> =
  RawEngine<W> & {
    [key in keyof W]: (input: W[key]["__t"]) => Promise<void>;
  };

class RawEngine<W extends Record<string, Workflow<unknown>>> {
  constructor(
    private storage: Adapter,
    private workflows: Record<string, Workflow<unknown>>,
    private leaseDuration: number,
    private logger: Logger,
  ) {
    this.run();
    Object.keys(workflows).forEach((workflowId) => {
      Object.defineProperty(this, workflowId, {
        get: () => {
          return async (input: unknown) => {
            await this.start(workflowId, input);
            setTimeout(() => this.run());
          };
        },
      });
    });
  }

  async run() {
    let next = await this.storage.getNextWorkflow();
    while (next) {
      const workflow = this.workflows[next.workflowId];
      if (workflow) {
        const runId = next.runId;
        const leaseInterval = setInterval(
          () => this.storage.renewLease(runId, this.leaseDuration),
          this.leaseDuration,
        );
        await workflow.run(this.storage, next);
        clearInterval(leaseInterval);
        await this.storage.finishWorkflow(next.runId);
      } else {
        const error = "Workflow not found";
        this.logger.error(new Error(error));
        await this.storage.failWorkflow(next.runId, error);
      }
      next = await this.storage.getNextWorkflow();
    }
  }

  private async start(workflowId: string, input: unknown) {
    await this.storage.createWorkflow({
      workflowId,
      input,
      leaseDuration: this.leaseDuration,
    });
  }

  async schedule<ID extends keyof W>(
    workflowId: ID,
    interval: number,
    input: W[ID]["__t"],
  ): Promise<void> {
    const lastRun = await this.storage.getLastestRun(workflowId as string);

    const lastRunStartedAt = lastRun?.startedAt.getTime() ?? 0;

    if (lastRunStartedAt < Date.now() - interval * 1000) {
      await this.start(workflowId as string, input);
      setTimeout(() => this.schedule(workflowId, interval, input), interval);
      return;
    }

    const nextRunIn =
      interval - Math.round((Date.now() - lastRunStartedAt) / 1000);

    setTimeout(() => this.schedule(workflowId, interval, input), nextRunIn);
  }
}
