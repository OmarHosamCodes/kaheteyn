CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`username` text,
	`display_username` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`role` text DEFAULT 'admin' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`timestamp` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`actor_id` text,
	`actor_name` text,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`action` text NOT NULL,
	`old_value` text,
	`new_value` text,
	`pseudo_id` text
);
--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `audit_log` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_timestamp_idx` ON `audit_log` (`timestamp`);--> statement-breakpoint
CREATE INDEX `audit_actor_idx` ON `audit_log` (`actor_id`);--> statement-breakpoint
CREATE TABLE `child` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`age` integer,
	`birth_date` text,
	`gender` text,
	`residence` text,
	`health_status` text,
	`school_stage` text,
	`father_name` text,
	`father_death_date` text,
	`father_death_cause` text,
	`mother_name` text,
	`siblings_count` integer,
	`guardian_name` text,
	`guardian_relation` text,
	`phone` text,
	`guardian_account` text,
	`sponsorship_status` text DEFAULT 'unsponsored' NOT NULL,
	`sponsor_id` text,
	`photo` text,
	`birth_certificate` text,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `child_sponsor_idx` ON `child` (`sponsor_id`);--> statement-breakpoint
CREATE INDEX `child_status_idx` ON `child` (`sponsorship_status`);--> statement-breakpoint
CREATE TABLE `payment` (
	`id` text PRIMARY KEY NOT NULL,
	`child_id` text NOT NULL,
	`sponsor_id` text NOT NULL,
	`month_label` text NOT NULL,
	`month_key` text NOT NULL,
	`amount_usd` integer NOT NULL,
	`date_sent` integer NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`financial_status` text DEFAULT 'sent' NOT NULL,
	`receipt_file` text,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `payment_child_idx` ON `payment` (`child_id`);--> statement-breakpoint
CREATE INDEX `payment_sponsor_idx` ON `payment` (`sponsor_id`);--> statement-breakpoint
CREATE INDEX `payment_month_idx` ON `payment` (`month_key`);--> statement-breakpoint
CREATE TABLE `receipt` (
	`id` text PRIMARY KEY NOT NULL,
	`payment_id` text NOT NULL,
	`document` text,
	`date_received` integer NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `receipt_payment_idx` ON `receipt` (`payment_id`);--> statement-breakpoint
CREATE TABLE `sponsor` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`payment_method` text,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);