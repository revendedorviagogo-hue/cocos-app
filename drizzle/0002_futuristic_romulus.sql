CREATE TABLE `admin_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`clientUserId` int NOT NULL,
	`sessionToken` varchar(255) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	CONSTRAINT `admin_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_sessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `admin_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(255),
	`role` enum('super_admin','admin','viewer') NOT NULL DEFAULT 'admin',
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastLoginAt` timestamp,
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `api_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`method` varchar(10) NOT NULL,
	`endpoint` varchar(500) NOT NULL,
	`requestHeaders` text,
	`requestBody` text,
	`responseStatus` int,
	`responseBody` text,
	`responseTime` int,
	`ipAddress` varchar(45),
	`userAgent` text,
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordEncrypted` text,
	`mfaSecret` varchar(255),
	`mfaEnabled` int NOT NULL DEFAULT 0,
	`sessionToken` text,
	`lastApiCall` timestamp,
	`apiCallCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_data_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_data_userId_unique` UNIQUE(`userId`)
);
