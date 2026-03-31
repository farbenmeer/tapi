import { drizzle } from "drizzle-orm/better-sqlite3";
import { describe, test } from "vitest";
import { startEngine } from "../engine";
import { DrizzleSqliteAdapter } from "./adapter-sqlite";
import { stepState, workflowState } from "./schema-sqlite";
import { workflow } from "../workflow";
import { step } from "../step";

describe("DrizzleSqliteAdapter", () => {
  test("basic workflow run", async () => {
    const db = drizzle(":memory:");
    db.run(workflowState.getSQL());
    db.run(stepState.getSQL());

    const helloStep = step(async (input: string) => {
      return `Hello, ${input}!`;
    });

    const logStep = step(async (input: string) => {
      console.log(input);
    });

    const engine = startEngine({
      storage: new DrizzleSqliteAdapter(db),
      workflows: {
        test: workflow(function testWorkflow(who: string) {
          const message = helloStep(who);
          logStep(message);
        }),
      },
    });

    await engine.test("world");
  });
});
