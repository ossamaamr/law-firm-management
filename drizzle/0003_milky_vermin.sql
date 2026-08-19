CREATE TABLE `activityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firmId` int NOT NULL,
	`userId` int NOT NULL,
	`actionType` varchar(32) NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` int NOT NULL,
	`entityName` varchar(255) NOT NULL,
	`changes` json,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brandingSettings` (
	`lawFirmId` int NOT NULL,
	`platformNameAr` varchar(120) NOT NULL,
	`platformNameEn` varchar(120) NOT NULL,
	`logoUrl` varchar(500),
	`updatedById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brandingSettings_lawFirmId` PRIMARY KEY(`lawFirmId`)
);
