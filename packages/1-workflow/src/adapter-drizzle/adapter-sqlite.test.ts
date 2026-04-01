import { BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { startEngine } from "../engine";
import { step } from "../step";
import { workflow } from "../workflow";
import { DrizzleSqliteAdapter } from "./adapter-sqlite";
import { workflowState } from "./schema-sqlite";

describe("DrizzleSqliteAdapter", () => {
  let db: BetterSQLite3Database;

  beforeEach(() => {
    db = drizzle(":memory:");
    migrate(db, {
      migrationsFolder: path.resolve(__dirname, "migrations-sqlite"),
    });
  });

  test("Basic adapter methods", async () => {
    const adapter = new DrizzleSqliteAdapter(db);

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
      storage: new DrizzleSqliteAdapter(db),
      workflows: {
        test: workflow(function testWorkflow(who: string) {
          const message = helloStep(who);
          returnStep(message);
        }),
      },
    });

    await engine.test("world");

    console.log(await db.select().from(workflowState));

    await vi.waitFor(() => expect(cb).toHaveBeenCalledWith("Hello, world!"));
  });
});
