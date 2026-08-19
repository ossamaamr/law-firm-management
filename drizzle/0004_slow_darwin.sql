CREATE TABLE `userInvitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lawFirmId` int NOT NULL,
	`invitedEmail` varchar(320) NOT NULL,
	`role` enum('admin','manager','lawyer','accountant','user') NOT NULL DEFAULT 'user',
	`tokenHash` varchar(128) NOT NULL,
	`invitedById` int NOT NULL,
	`acceptedById` int,
	`status` enum('pending','accepted','revoked') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userInvitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `userInvitations_tokenHash_unique` UNIQUE(`tokenHash`)
);
