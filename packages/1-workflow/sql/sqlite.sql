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
