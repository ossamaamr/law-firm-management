CREATE INDEX `activityLogs_firm_createdAt_idx` ON `activityLogs` (`firmId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `cases_lawFirm_createdAt_idx` ON `cases` (`lawFirmId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `cases_lawFirm_status_idx` ON `cases` (`lawFirmId`,`status`);--> statement-breakpoint
CREATE INDEX `clients_lawFirm_createdAt_idx` ON `clients` (`lawFirmId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `documents_lawFirm_createdAt_idx` ON `documents` (`lawFirmId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `documents_lawFirm_matter_idx` ON `documents` (`lawFirmId`,`matterId`);--> statement-breakpoint
CREATE INDEX `notifications_user_createdAt_idx` ON `notifications` (`userId`,`createdAt`);