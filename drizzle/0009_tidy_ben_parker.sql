ALTER TABLE `documents` ADD `version` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `previousVersionId` int;--> statement-breakpoint
ALTER TABLE `documents` ADD `contentHash` varchar(64);--> statement-breakpoint
ALTER TABLE `documents` ADD `scanStatus` enum('clean','pending','quarantined') DEFAULT 'clean' NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `retentionUntil` timestamp;--> statement-breakpoint
CREATE INDEX `documents_case_version_idx` ON `documents` (`lawFirmId`,`caseId`,`version`);--> statement-breakpoint
CREATE INDEX `documents_scan_status_idx` ON `documents` (`lawFirmId`,`scanStatus`);