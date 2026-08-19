ALTER TABLE `cases` ADD CONSTRAINT `cases_id_lawFirmId_unique` UNIQUE(`id`,`lawFirmId`);--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_id_lawFirmId_unique` UNIQUE(`id`,`lawFirmId`);--> statement-breakpoint
ALTER TABLE `matters` ADD CONSTRAINT `matters_id_lawFirmId_unique` UNIQUE(`id`,`lawFirmId`);--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_id_lawFirmId_unique` UNIQUE(`id`,`lawFirmId`);--> statement-breakpoint
ALTER TABLE `cases` ADD CONSTRAINT `cases_matter_tenant_fk` FOREIGN KEY (`matterId`,`lawFirmId`) REFERENCES `matters`(`id`,`lawFirmId`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `courtSessions` ADD CONSTRAINT `courtSessions_caseId_fk` FOREIGN KEY (`caseId`) REFERENCES `cases`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_lawFirmId_fk` FOREIGN KEY (`lawFirmId`) REFERENCES `lawFirms`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_matterId_fk` FOREIGN KEY (`matterId`) REFERENCES `matters`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_caseId_fk` FOREIGN KEY (`caseId`) REFERENCES `cases`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_projectId_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_uploadedById_fk` FOREIGN KEY (`uploadedById`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `matters` ADD CONSTRAINT `matters_client_tenant_fk` FOREIGN KEY (`clientId`,`lawFirmId`) REFERENCES `clients`(`id`,`lawFirmId`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_lawFirmId_fk` FOREIGN KEY (`lawFirmId`) REFERENCES `lawFirms`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_matterId_fk` FOREIGN KEY (`matterId`) REFERENCES `matters`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_leadLawyerId_fk` FOREIGN KEY (`leadLawyerId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_matter_tenant_fk` FOREIGN KEY (`matterId`,`lawFirmId`) REFERENCES `matters`(`id`,`lawFirmId`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_matterId_fk` FOREIGN KEY (`matterId`) REFERENCES `matters`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_caseId_fk` FOREIGN KEY (`caseId`) REFERENCES `cases`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_projectId_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_lawFirmId_fk` FOREIGN KEY (`lawFirmId`) REFERENCES `lawFirms`(`id`) ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_assignedToId_fk` FOREIGN KEY (`assignedToId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE cascade;