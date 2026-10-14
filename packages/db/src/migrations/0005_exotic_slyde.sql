CREATE TABLE `profile` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`account_id` text NOT NULL,
	`name` text NOT NULL,
	`pin` text,
	`position` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `streaming_account`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `profile_account_position_idx` ON `profile` (`account_id`,`position`);--> statement-breakpoint
CREATE TABLE `streaming_account` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`service_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`email` text NOT NULL,
	`email_key` text NOT NULL,
	`password_encrypted` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`service_id`) REFERENCES `service`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`provider_id`) REFERENCES `provider`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `streamingAccount_business_service_emailKey_uidx` ON `streaming_account` (`business_id`,`service_id`,`email_key`);--> statement-breakpoint
CREATE INDEX `streamingAccount_providerId_idx` ON `streaming_account` (`provider_id`);