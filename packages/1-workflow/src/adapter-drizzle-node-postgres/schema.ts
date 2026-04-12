import { pgTable, text, jsonb, integer, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const workflowState = pgTable("workflow_state", {
	workflowId: text("workflow_id").notNull(),
	runId: text("run_id").primaryKey().notNull(),
	error: text(),
	input: jsonb(),
	leaseExpiredAt: integer("lease_expired_at").notNull(),
	startedAt: integer("started_at").notNull(),
	finishedAt: integer("finished_at"),
	resumeAt: integer("resume_at").notNull(),
});

export const workflowStepState = pgTable("workflow_step_state", {
	runId: text("run_id").notNull(),
	stepId: text("step_id").notNull(),
	result: jsonb(),
	error: text(),
	attempt: integer().default(0).notNull(),
}, (table) => [
	primaryKey({ columns: [table.runId, table.stepId], name: "workflow_step_state_pkey"}),
]);
