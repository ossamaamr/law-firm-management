CREATE TABLE `auditOutbox` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventKey` varchar(191) NOT NULL,
	`firmId` int NOT NULL,
	`userId` int NOT NULL,
	`actionType` varchar(32) NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` int NOT NULL,
	`entityName` varchar(255) NOT NULL,
	`payload` json NOT NULL,
	`status` enum('pending','processing','processed','failed') NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`availableAt` timestamp NOT NULL DEFAULT (now()),
	`lockedAt` timestamp,
	`processedAt` timestamp,
	`lastError` varchar(1000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditOutbox_id` PRIMARY KEY(`id`),
	CONSTRAINT `auditOutbox_eventKey_unique` UNIQUE(`eventKey`)
);
--> statement-breakpoint
ALTER TABLE `activityLogs` ADD `eventKey` varchar(191);--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `eventKey` varchar(191);--> statement-breakpoint
ALTER TABLE `activityLogs` ADD CONSTRAINT `activityLogs_eventKey_unique` UNIQUE(`eventKey`);--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_eventKey_unique` UNIQUE(`eventKey`);--> statement-breakpoint
ALTER TABLE `auditOutbox` ADD CONSTRAINT `auditOutbox_firmId_fk` FOREIGN KEY (`firmId`) REFERENCES `lawFirms`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `auditOutbox` ADD CONSTRAINT `auditOutbox_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `auditOutbox_status_availableAt_idx` ON `auditOutbox` (`status`,`availableAt`);--> statement-breakpoint
CREATE INDEX `auditOutbox_firm_createdAt_idx` ON `auditOutbox` (`firmId`,`createdAt`);