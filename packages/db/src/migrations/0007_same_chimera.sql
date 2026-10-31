CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`country_prefix` text,
	`phone` text,
	`whatsapp_username` text,
	`note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_business_phone_uidx` ON `customers` (`business_id`,`country_prefix`,`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_business_whatsappUsername_uidx` ON `customers` (`business_id`,lower("whatsapp_username"));