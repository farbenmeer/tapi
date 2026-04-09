CREATE TABLE `workflow_step_state` (
	`run_id` text NOT NULL,
	`step_id` text NOT NULL,
	`result` text,
	`error` text,
	PRIMARY KEY(`run_id`, `step_id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_state` (
	`workflow_id` text NOT NULL,
	`run_id` text PRIMARY KEY NOT NULL,
	`error` text,
	`input` text,
	`leaseExpiredAt` integer NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer
);
