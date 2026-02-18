CREATE TABLE `duePayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matterId` int NOT NULL,
	`lawFirmId` int NOT NULL,
	`timesheetIds` json,
	`expenseIds` json,
	`totalAmount` decimal(12,2) NOT NULL,
	`status` enum('pending','approved','invoiced','paid') NOT NULL DEFAULT 'pending',
	`approvedById` int,
	`invoicedDate` timestamp,
	`paidDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `duePayments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matterId` int NOT NULL,
	`submittedById` int NOT NULL,
	`lawFirmId` int NOT NULL,
	`description` varchar(255) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`category` enum('travel','filing_fees','expert_fees','court_costs','other') NOT NULL,
	`date` timestamp NOT NULL,
	`status` enum('draft','submitted','approved','rejected') NOT NULL DEFAULT 'draft',
	`approvedById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matterId` int NOT NULL,
	`clientId` int NOT NULL,
	`lawFirmId` int NOT NULL,
	`invoiceNumber` varchar(100) NOT NULL,
	`duePaymentId` int,
	`totalAmount` decimal(12,2) NOT NULL,
	`taxAmount` decimal(12,2) DEFAULT '0',
	`finalAmount` decimal(12,2) NOT NULL,
	`status` enum('draft','sent','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
	`invoiceDate` timestamp NOT NULL DEFAULT (now()),
	`dueDate` timestamp,
	`paidDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `legalServiceRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`lawFirmId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`serviceType` enum('litigation','corporate','advisory','other') NOT NULL,
	`status` enum('pending','approved','rejected','converted') NOT NULL DEFAULT 'pending',
	`requestedDate` timestamp NOT NULL DEFAULT (now()),
	`convertedToMatterId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `legalServiceRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lawFirmId` int NOT NULL,
	`clientId` int NOT NULL,
	`matterNumber` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`matterType` enum('litigation','corporate','advisory','other') NOT NULL,
	`status` enum('open','pending','closed','archived') NOT NULL DEFAULT 'open',
	`leadLawyerId` int NOT NULL,
	`openDate` timestamp NOT NULL DEFAULT (now()),
	`closeDate` timestamp,
	`feeAgreementType` enum('fixed','hourly','contingency','retainer') NOT NULL,
	`feeAmount` decimal(12,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matters_id` PRIMARY KEY(`id`),
	CONSTRAINT `matters_matterNumber_unique` UNIQUE(`matterNumber`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matterId` int NOT NULL,
	`lawFirmId` int NOT NULL,
	`projectNumber` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`projectType` enum('contract','compliance','merger','incorporation','other') NOT NULL,
	`status` enum('planning','in_progress','review','completed','archived') NOT NULL DEFAULT 'planning',
	`leadLawyerId` int NOT NULL,
	`startDate` timestamp,
	`targetCompletionDate` timestamp,
	`actualCompletionDate` timestamp,
	`budget` decimal(12,2),
	`expenditure` decimal(12,2) DEFAULT '0',
	`notes` text,
	`isDeleted` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_projectNumber_unique` UNIQUE(`projectNumber`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matterId` int,
	`caseId` int,
	`projectId` int,
	`lawFirmId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`assignedToId` int NOT NULL,
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`dueDate` timestamp,
	`completedDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timesheets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matterId` int NOT NULL,
	`lawyerId` int NOT NULL,
	`lawFirmId` int NOT NULL,
	`date` timestamp NOT NULL,
	`hours` decimal(5,2) NOT NULL,
	`description` text,
	`hourlyRate` decimal(10,2),
	`status` enum('draft','submitted','approved','rejected') NOT NULL DEFAULT 'draft',
	`approvedById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timesheets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `caseId` int;--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `documentType` enum('power_of_attorney','contract','evidence','court_order','judgment','petition','response','invoice','receipt','other') NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `type` enum('session_reminder','case_update','new_matter','task_assigned','payment_due','document_upload','system') NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','manager','lawyer','accountant','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `matterId` int;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD `projectId` int;--> statement-breakpoint
ALTER TABLE `cases` ADD `matterId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `cases` ADD `partyRole` enum('plaintiff','defendant','appellant','respondent');--> statement-breakpoint
ALTER TABLE `clients` ADD `kycStatus` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `conflictCheckStatus` enum('pending','clear','conflict') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `matterId` int;--> statement-breakpoint
ALTER TABLE `documents` ADD `projectId` int;--> statement-breakpoint
ALTER TABLE `documents` ADD `lawFirmId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `expiryDate` timestamp;--> statement-breakpoint
ALTER TABLE `notifications` ADD `matterId` int;--> statement-breakpoint
ALTER TABLE `notifications` ADD `projectId` int;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `clientId`;--> statement-breakpoint
ALTER TABLE `cases` DROP COLUMN `lawyerId`;