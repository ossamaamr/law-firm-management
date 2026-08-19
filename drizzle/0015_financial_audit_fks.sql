ALTER TABLE `activityLogs` ADD CONSTRAINT `activityLogs_firmId_fk` FOREIGN KEY (`firmId`) REFERENCES `lawFirms`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `activityLogs` ADD CONSTRAINT `activityLogs_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_lawFirmId_fk` FOREIGN KEY (`lawFirmId`) REFERENCES `lawFirms`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_matterId_fk` FOREIGN KEY (`matterId`) REFERENCES `matters`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_caseId_fk` FOREIGN KEY (`caseId`) REFERENCES `cases`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_projectId_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `duePayments` ADD CONSTRAINT `duePayments_matterId_fk` FOREIGN KEY (`matterId`) REFERENCES `matters`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `duePayments` ADD CONSTRAINT `duePayments_lawFirmId_fk` FOREIGN KEY (`lawFirmId`) REFERENCES `lawFirms`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `duePayments` ADD CONSTRAINT `duePayments_approvedById_fk` FOREIGN KEY (`approvedById`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_matterId_fk` FOREIGN KEY (`matterId`) REFERENCES `matters`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_clientId_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_lawFirmId_fk` FOREIGN KEY (`lawFirmId`) REFERENCES `lawFirms`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_duePaymentId_fk` FOREIGN KEY (`duePaymentId`) REFERENCES `duePayments`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ledgerEntries` ADD CONSTRAINT `ledgerEntries_lawFirmId_fk` FOREIGN KEY (`lawFirmId`) REFERENCES `lawFirms`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ledgerEntries` ADD CONSTRAINT `ledgerEntries_matterId_fk` FOREIGN KEY (`matterId`) REFERENCES `matters`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ledgerEntries` ADD CONSTRAINT `ledgerEntries_invoiceId_fk` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ledgerEntries` ADD CONSTRAINT `ledgerEntries_duePaymentId_fk` FOREIGN KEY (`duePaymentId`) REFERENCES `duePayments`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `ledgerEntries` ADD CONSTRAINT `ledgerEntries_createdById_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;