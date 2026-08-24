CREATE TABLE `click_events` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`visitor_hash` text NOT NULL,
	`window_key` integer NOT NULL,
	`is_counted` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_click_events_listing_created` ON `click_events` (`listing_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_click_events_listing_visitor_window` ON `click_events` (`listing_id`,`visitor_hash`,`window_key`);--> statement-breakpoint
ALTER TABLE `listings` ADD `requested_boost_minor` integer DEFAULT 0 NOT NULL;