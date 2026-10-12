PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE IF NOT EXISTS "d1_migrations"(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(1,'0000_outstanding_wrecking_crew.sql','2026-10-12 03:36:11');
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`issuer` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO "account" ("id","issuer","account_id","provider_id","user_id","access_token","refresh_token","id_token","access_token_expires_at","refresh_token_expires_at","scope","password","created_at","updated_at") VALUES('P0mepgZpEL2NeLT9b2bbMfPAzFokJe86','local:credential','3Bubw6Y5RAu6VwVLf8O5PjFD8xFCXbrL','credential','3Bubw6Y5RAu6VwVLf8O5PjFD8xFCXbrL',NULL,NULL,NULL,NULL,NULL,NULL,'0128cf062dc3355d784c24d09652c847:e44a365777ed33875589f5dc30b6e7e7c85928c85b9eea9f6c22e85a69b107608d9db6399a32cc0cbef7b9375540bd3f166b5070575c1380c084592f7fc70da4',1791776651256,1791776651256);
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO "session" ("id","expires_at","token","created_at","updated_at","ip_address","user_agent","user_id") VALUES('zTuN7FxDyESBdhmWc40MRjsG2OUk0Ivd',1792381451411,'dwlZRgPsyJtLg0DYDJjzxKhXsEWoSzvD',1791776651411,1791776651411,'','','3Bubw6Y5RAu6VwVLf8O5PjFD8xFCXbrL');
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text DEFAULT 'USER' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
INSERT INTO "user" ("id","name","email","email_verified","image","role","created_at","updated_at") VALUES('3Bubw6Y5RAu6VwVLf8O5PjFD8xFCXbrL','Thony','thonyiuci@gmail.com',0,NULL,'SUPERADMIN',1791776651096,1791776660995);
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('d1_migrations',1);
CREATE UNIQUE INDEX `account_issuer_accountId_uidx` ON `account` (`issuer`,`account_id`);
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);
