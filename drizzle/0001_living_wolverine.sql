CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lawFirmId` int NOT NULL,
	`caseId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int,
	`changes` json,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lawFirmId` int NOT NULL,
	`caseNumber` varchar(100) NOT NULL,
	`clientId` int NOT NULL,
	`lawyerId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`caseType` enum('civil','criminal','commercial','family','administrative','labor','other') NOT NULL,
	`status` enum('open','pending','closed','archived','suspended') NOT NULL DEFAULT 'open',
	`courtName` varchar(255),
	`judge` varchar(255),
	`oppositeParty` varchar(255),
	`filingDate` timestamp,
	`nextSessionDate` timestamp,
	`estimatedClosureDate` timestamp,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`budget` decimal(12,2),
	`expenditure` decimal(12,2) DEFAULT '0',
	`notes` text,
	`isDeleted` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cases_id` PRIMARY KEY(`id`),
	CONSTRAINT `cases_caseNumber_unique` UNIQUE(`caseNumber`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lawFirmId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`address` text,
	`city` varchar(100),
	`nationalId` varchar(50),
	`clientType` enum('individual','company') NOT NULL DEFAULT 'individual',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courtSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`sessionDate` timestamp NOT NULL,
	`sessionTime` varchar(10),
	`courtRoom` varchar(100),
	`description` text,
	`outcome` text,
	`nextSessionDate` timestamp,
	`notificationSent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courtSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`uploadedById` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(50),
	`fileSize` int,
	`s3Key` varchar(500) NOT NULL,
	`s3Url` text NOT NULL,
	`documentType` enum('power_of_attorney','contract','evidence','court_order','judgment','petition','response','other') NOT NULL,
	`description` text,
	`isPublic` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lawFirms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`address` text,
	`city` varchar(100),
	`country` varchar(100),
	`licenseNumber` varchar(100),
	`managerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lawFirms_id` PRIMARY KEY(`id`),
	CONSTRAINT `lawFirms_licenseNumber_unique` UNIQUE(`licenseNumber`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseId` int,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('session_reminder','case_update','new_case','document_upload','system') NOT NULL,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','lawyer','manager') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `lawFirmId` int;