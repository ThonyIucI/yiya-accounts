ALTER TABLE `rentals` ADD `account_id` text REFERENCES streaming_account(id);--> statement-breakpoint
CREATE INDEX `rentals_accountId_idx` ON `rentals` (`account_id`);