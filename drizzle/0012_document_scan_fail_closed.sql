-- Legacy rows previously defaulted to `clean` without a guaranteed scanner result.
-- Requeue them for an approved scan before allowing downloads.
UPDATE `documents` SET `scanStatus` = 'pending' WHERE `scanStatus` = 'clean';--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `scanStatus` enum('clean','pending','quarantined') NOT NULL DEFAULT 'pending';
