CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`season_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_payment_id` text,
	`amount_minor` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`pix_copy_paste` text,
	`expires_at` text,
	`created_at` text NOT NULL,
	`confirmed_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_payments_listing_status` ON `payments` (`listing_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_payments_provider_payment` ON `payments` (`provider`,`provider_payment_id`);--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`event_type` text NOT NULL,
	`received_at` text NOT NULL,
	`processed_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_webhook_events_provider_processed` ON `webhook_events` (`provider`,`processed_at`);