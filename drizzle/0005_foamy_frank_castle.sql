CREATE TABLE `registrationRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lawFirmId` int NOT NULL,
	`requesterUserId` int NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32),
	`requestedRole` enum('lawyer','accountant','user') NOT NULL DEFAULT 'user',
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`reviewedById` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `registrationRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `lawFirms` ADD `identifier` varchar(80);--> statement-breakpoint
ALTER TABLE `lawFirms` ADD CONSTRAINT `lawFirms_identifier_unique` UNIQUE(`identifier`);