import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const workflowState = sqliteTable("workflow_state", {
  workflowId: text("workflow_id").notNull(),
  runId: text("run_id").primaryKey(),
  error: text(),
  input: text({ mode: "json" }),
  leaseExpiredAt: integer().notNull(),
  startedAt: integer("started_at").notNull(),
  finishedAt: integer("finished_at"),
});

export const stepState = sqliteTable(
  "workflow_step_state",
  {
    runId: text("run_id").notNull(),
    stepId: text("step_id").notNull(),
    result: text({ mode: "json" }),
    error: text(),
  },
  (table) => [primaryKey({ columns: [table.runId, table.stepId] })],
);
