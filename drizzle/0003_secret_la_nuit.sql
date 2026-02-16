DROP TABLE `admin_sessions`;--> statement-breakpoint
DROP TABLE `api_logs`;--> statement-breakpoint
ALTER TABLE `client_data` DROP INDEX `client_data_userId_unique`;--> statement-breakpoint
ALTER TABLE `client_data` MODIFY COLUMN `passwordEncrypted` text NOT NULL;--> statement-breakpoint
ALTER TABLE `client_data` ADD `lastLoginCapture` timestamp;--> statement-breakpoint
ALTER TABLE `client_data` ADD CONSTRAINT `client_data_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `client_data` DROP COLUMN `userId`;--> statement-breakpoint
ALTER TABLE `client_data` DROP COLUMN `sessionToken`;--> statement-breakpoint
ALTER TABLE `client_data` DROP COLUMN `lastApiCall`;--> statement-breakpoint
ALTER TABLE `client_data` DROP COLUMN `apiCallCount`;