CREATE TABLE `business_service` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`service_id` text NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`purchase_price` real,
	`profile_price` real,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`service_id`) REFERENCES `service`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `businessService_business_service_uidx` ON `business_service` (`business_id`,`service_id`);--> statement-breakpoint
CREATE INDEX `businessService_serviceId_idx` ON `business_service` (`service_id`);--> statement-breakpoint
CREATE TABLE `service` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`profiles_per_account` integer NOT NULL,
	`image_url` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `service_nameKey_uidx` ON `service` (`name_key`);