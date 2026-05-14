import path from "node:path";
import { fileURLToPath } from "node:url";
import { startEngine, step, workflow } from "@farbenmeer/workflow";
import { DrizzleBetterSqliteAdapter } from "@farbenmeer/workflow/adapter-drizzle-better-sqlite";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { workflowState, workflowStepState } from "./schema.js";

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../drizzle",
);

const sqliteDb = new Database(":memory:");
const db = drizzle(sqliteDb, { schema: { workflowState, workflowStepState } });
migrate(db, { migrationsFolder });

const adapter = new DrizzleBetterSqliteAdapter(db);

const fetchStep = step(async (_url: string) => {
  return 200;
});

const pingWorkflow = workflow<{ url: string }>((input) => {
  const status = fetchStep(input.url);
  console.log(`Ping result for ${input.url}: HTTP ${status}`);
});

const engine = startEngine({
  storage: adapter,
  workflows: { ping: pingWorkflow },
});

await engine.ping({ url: "https://example.com" });

await new Promise((resolve) => setTimeout(resolve, 500));
process.exit(0);
