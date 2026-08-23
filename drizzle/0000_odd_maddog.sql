CREATE TABLE `boosts` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`season_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_payment_id` text,
	`amount_minor` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_boosts_season_status` ON `boosts` (`season_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_boosts_listing_season` ON `boosts` (`listing_id`,`season_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_boosts_provider_payment` ON `boosts` (`provider`,`provider_payment_id`);--> statement-breakpoint
CREATE TABLE `listings` (
	`id` text PRIMARY KEY NOT NULL,
	`market_code` text NOT NULL,
	`name` text NOT NULL,
	`handle` text NOT NULL,
	`description` text NOT NULL,
	`destination_url` text NOT NULL,
	`contact_email` text NOT NULL,
	`category` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`click_count` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_listings_market_status` ON `listings` (`market_code`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_listings_market_handle` ON `listings` (`market_code`,`handle`);--> statement-breakpoint
CREATE TABLE `markets` (
	`code` text PRIMARY KEY NOT NULL,
	`locale` text NOT NULL,
	`currency` text NOT NULL,
	`min_boost_minor` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `seasons` (
	`id` text PRIMARY KEY NOT NULL,
	`market_code` text NOT NULL,
	`label` text NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_seasons_market_status` ON `seasons` (`market_code`,`status`);