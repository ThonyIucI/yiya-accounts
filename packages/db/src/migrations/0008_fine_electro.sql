CREATE TABLE `rentals` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`price` real NOT NULL,
	`paid_amount` real NOT NULL,
	`paid_on` text,
	`pay_by` text,
	`starts_on` text NOT NULL,
	`expires_on` text NOT NULL,
	`released_on` text,
	`renewed_by_id` text,
	`created_by_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`profile_id`) REFERENCES `profile`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`renewed_by_id`) REFERENCES `rentals`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `rentals_business_expiresOn_idx` ON `rentals` (`business_id`,`expires_on`);--> statement-breakpoint
CREATE INDEX `rentals_customerId_idx` ON `rentals` (`customer_id`);--> statement-breakpoint
CREATE INDEX `rentals_profileId_idx` ON `rentals` (`profile_id`);