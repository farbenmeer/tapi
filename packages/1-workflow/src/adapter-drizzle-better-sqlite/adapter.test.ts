import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { startEngine } from "../engine.js";
import { step } from "../step.js";
import { workflow } from "../workflow.js";
import { DrizzleBetterSqliteAdapter } from "./adapter.js";
import { readFileSync } from "node:fs";
import path from "node:path";

const SCHEMA = readFileSync(
  path.resolve(process.cwd(), "sql/sqlite.sql"),
  "utf-8",
);

describe("DrizzleBetterSqliteAdapter", () => {
  let drizzleDb: BetterSQLite3Database;

  beforeEach(() => {
    const sqliteDb = new Database(":memory:");
    sqliteDb.exec(SCHEMA);
    drizzleDb = drizzle(sqliteDb);
  });

  test("Basic adapter methods", async () => {
    const adapter = new DrizzleBetterSqliteAdapter(drizzleDb);

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

  test("basic workflow run", async () => {
    const cb = vi.fn();

    const helloStep = step(async (input: string) => {
      return `Hello, ${input}!`;
    });

    const returnStep = step(async (input: string) => {
      cb(input);
    });

    const engine = startEngine({
      storage: new DrizzleBetterSqliteAdapter(drizzleDb),
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
