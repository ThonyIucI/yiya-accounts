CREATE TABLE `account_purchase` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`account_id` text NOT NULL,
	`price` real NOT NULL,
	`purchased_on` text NOT NULL,
	`expires_on` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `business`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `streaming_account`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `accountPurchase_account_expiresOn_idx` ON `account_purchase` (`account_id`,`expires_on`);--> statement-breakpoint
CREATE INDEX `accountPurchase_businessId_idx` ON `account_purchase` (`business_id`);