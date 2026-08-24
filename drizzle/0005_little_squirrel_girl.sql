CREATE TABLE `visit_events` (
	`visitor_hash` text PRIMARY KEY NOT NULL,
	`first_seen_at` text NOT NULL,
	`last_seen_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_visit_events_last_seen` ON `visit_events` (`last_seen_at`);--> statement-breakpoint
ALTER TABLE `listings` ADD `placement_type` text DEFAULT 'paid' NOT NULL;
--> statement-breakpoint
DELETE FROM `click_events`;
--> statement-breakpoint
DELETE FROM `visit_events`;
--> statement-breakpoint
DELETE FROM `request_limits`;
--> statement-breakpoint
DELETE FROM `webhook_events`;
--> statement-breakpoint
DELETE FROM `payments` WHERE `status` != 'confirmed';
--> statement-breakpoint
DELETE FROM `boosts` WHERE `provider` = 'demo';
--> statement-breakpoint
DELETE FROM `listings` WHERE `contact_email` LIKE 'demo@%' OR `status` != 'active';
--> statement-breakpoint
UPDATE `listings` SET `click_count` = 0;
--> statement-breakpoint
INSERT OR IGNORE INTO `listings`
  (`id`, `market_code`, `name`, `handle`, `description`, `destination_url`, `contact_email`, `category`, `requested_boost_minor`, `placement_type`, `status`, `click_count`, `created_at`)
VALUES
  ('partner-nexoflow', 'br', 'NexoFlow', '@nexoflow.app', 'Gestão e publicação profissional de conteúdo no Instagram.', 'https://instagram.com/nexoflow.app', 'parceiros@instabid.br', 'Tools', 0, 'launch_partner', 'active', 0, '2026-08-24T04:30:00.000Z'),
  ('partner-instabid', 'br', 'Instabid', '@instabid.br', 'Perfil oficial da disputa brasileira por atenção.', 'https://instagram.com/instabid.br', 'parceiros@instabid.br', 'Communities', 0, 'launch_partner', 'active', 0, '2026-08-24T04:31:00.000Z');
--> statement-breakpoint
PRAGMA optimize;
