import Database from "better-sqlite3";
import { startEngine, workflow, step } from "@farbenmeer/workflow";
import { SqliteAdapter } from "@farbenmeer/workflow/adapter-sqlite";

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS workflow_state (
    workflow_id TEXT NOT NULL,
    run_id TEXT PRIMARY KEY NOT NULL,
    error TEXT,
    input TEXT,
    lease_expired_at INTEGER NOT NULL,
    started_at INTEGER NOT NULL,
    finished_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS workflow_step_state (
    run_id TEXT NOT NULL,
    step_id TEXT NOT NULL,
    result TEXT,
    error TEXT,
    attempt INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (run_id, step_id)
  );
`;

const db = new Database(":memory:");
db.exec(SCHEMA);
const adapter = new SqliteAdapter(db);

const fetchStep = step(async (url: string) => {
  const res = await fetch(url);
  return res.status;
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
