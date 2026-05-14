CREATE TABLE `workflow_state` (
	`workflow_id` text NOT NULL,
	`run_id` text PRIMARY KEY NOT NULL,
	`error` text,
	`input` text,
	`lease_expired_at` integer NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer
);
--> statement-breakpoint
CREATE TABLE `workflow_step_state` (
	`run_id` text NOT NULL,
	`step_id` text NOT NULL,
	`result` text,
	`error` text,
	`attempt` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`run_id`, `step_id`)
);
