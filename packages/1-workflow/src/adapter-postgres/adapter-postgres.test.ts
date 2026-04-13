import { PGlite } from "@electric-sql/pglite";
import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { startEngine } from "../engine";
import { step } from "../step";
import { workflow } from "../workflow";
import { PostgresAdapter } from "./adapter-postgres";

const SCHEMA = readFileSync(
  path.resolve(process.cwd(), "sql/postgres.sql"),
  "utf-8",
);

describe("PostgresAdapter", () => {
  let pg: PGlite;

  beforeEach(async () => {
    pg = new PGlite();
    await pg.exec(SCHEMA);
  });

  afterEach(async () => {
    await pg.close();
  });

  test("Basic adapter methods", async () => {
    const adapter = new PostgresAdapter(pg);

    await adapter.createWorkflow({
      workflowId: "test",
      input: {},
    });

    expect(await adapter.getNextWorkflow(300)).toEqual({
      workflowId: "test",
      runId: expect.any(String),
      error: null,
      input: {},
      leaseExpiredAt: expect.any(Date),
      startedAt: expect.any(Date),
      finishedAt: null,
    });
  });

  test("listWorkflows returns paginated results", async () => {
    const adapter = new PostgresAdapter(pg);

    for (let i = 0; i < 5; i++) {
      await adapter.createWorkflow({ workflowId: `wf-${i}`, input: { i } });
    }

    const page1 = await adapter.listWorkflows({ pageSize: 2 });
    expect(page1.workflows).toHaveLength(2);
    expect(page1.nextCursor).not.toBeNull();

    const page2 = await adapter.listWorkflows({
      pageSize: 2,
      cursor: page1.nextCursor!,
    });
    expect(page2.workflows).toHaveLength(2);
    expect(page2.nextCursor).not.toBeNull();

    const page3 = await adapter.listWorkflows({
      pageSize: 2,
      cursor: page2.nextCursor!,
    });
    expect(page3.workflows).toHaveLength(1);
    expect(page3.nextCursor).toBeNull();

    const allIds = [
      ...page1.workflows,
      ...page2.workflows,
      ...page3.workflows,
    ].map((w) => w.workflowId);
    expect(new Set(allIds).size).toBe(5);
  });

  test("listWorkflows returns empty page when no workflows exist", async () => {
    const adapter = new PostgresAdapter(pg);

    const result = await adapter.listWorkflows();
    expect(result.workflows).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });

  test("basic workflow run", async () => {
    const cb = vi.fn();

    const helloStep = step(async (input: string) => {
      return `Hello, ${input}!`;
    });

    const returnStep = step(async (input: string) => {
      cb(input);
    });

    const engine = startEngine({
      storage: new PostgresAdapter(pg),
      workflows: {
        test: workflow(function testWorkflow(who: string) {
          const message = helloStep(who);
          returnStep(message);
        }),
      },
    });

    await engine.test("world");

    await vi.waitFor(() => expect(cb).toHaveBeenCalledWith("Hello, world!"));
  });
});
