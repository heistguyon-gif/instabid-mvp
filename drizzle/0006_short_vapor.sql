ALTER TABLE `listings` ADD `image_url` text;
--> statement-breakpoint
UPDATE `markets` SET `min_boost_minor` = 500 WHERE `code` = 'br';
--> statement-breakpoint
UPDATE `listings` SET `image_url` = '/nexoflow-avatar.ico' WHERE `id` = 'partner-nexoflow';
--> statement-breakpoint
UPDATE `listings` SET `image_url` = '/logo-emblem.png' WHERE `id` = 'partner-instabid';
--> statement-breakpoint
PRAGMA optimize;
