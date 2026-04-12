import { sqliteTable, AnySQLiteColumn, text, integer, primaryKey } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const workflowState = sqliteTable("workflow_state", {
	workflowId: text("workflow_id").notNull(),
	runId: text("run_id").primaryKey().notNull(),
	error: text(),
	input: text(),
	leaseExpiredAt: integer().notNull(),
	startedAt: integer("started_at").notNull(),
	finishedAt: integer("finished_at"),
	resumeAt: integer("resume_at").notNull(),
});

export const workflowStepState = sqliteTable("workflow_step_state", {
	runId: text("run_id").notNull(),
	stepId: text("step_id").notNull(),
	result: text(),
	error: text(),
	attempt: integer().default(0).notNull(),
},
(table) => [
	primaryKey({ columns: [table.runId, table.stepId], name: "workflow_step_state_run_id_step_id_pk"})
]);

