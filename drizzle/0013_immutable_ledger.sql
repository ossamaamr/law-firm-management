CREATE TABLE `ledgerEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lawFirmId` int NOT NULL,
	`matterId` int,
	`invoiceId` int,
	`duePaymentId` int,
	`entryType` enum('invoice_issued','payment_received','refund','adjustment','expense_approved') NOT NULL,
	`direction` enum('debit','credit') NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'SAR',
	`status` enum('posted','reversed','void') NOT NULL DEFAULT 'posted',
	`idempotencyKey` varchar(128) NOT NULL,
	`externalTransactionId` varchar(255),
	`createdById` int NOT NULL,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ledgerEntries_id` PRIMARY KEY(`id`),
	CONSTRAINT `ledgerEntries_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE INDEX `ledger_lawFirm_createdAt_idx` ON `ledgerEntries` (`lawFirmId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ledger_lawFirm_invoice_idx` ON `ledgerEntries` (`lawFirmId`,`invoiceId`);--> statement-breakpoint
CREATE INDEX `ledger_lawFirm_matter_idx` ON `ledgerEntries` (`lawFirmId`,`matterId`);