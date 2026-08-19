CREATE TABLE `sessionRevocations` (
	`jti` varchar(128) NOT NULL,
	`revokedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessionRevocations_jti` PRIMARY KEY(`jti`)
);
