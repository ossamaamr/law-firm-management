-- MERSAD P1-008 database preflight
-- Run against an isolated MySQL/MariaDB test database first.
-- Every result must be 0 before applying drizzle/0011_core_relationship_fks.sql.
-- This file is read-only: it performs no UPDATE/DELETE/ALTER.

SELECT 'clients_missing_law_firm' AS check_name, COUNT(*) AS violations
FROM clients c
LEFT JOIN lawFirms f ON f.id = c.lawFirmId
WHERE f.id IS NULL;

SELECT 'matters_missing_law_firm' AS check_name, COUNT(*) AS violations
FROM matters m
LEFT JOIN lawFirms f ON f.id = m.lawFirmId
WHERE f.id IS NULL;

SELECT 'matters_missing_client' AS check_name, COUNT(*) AS violations
FROM matters m
LEFT JOIN clients c ON c.id = m.clientId
WHERE c.id IS NULL;

SELECT 'matters_missing_lead_lawyer' AS check_name, COUNT(*) AS violations
FROM matters m
LEFT JOIN users u ON u.id = m.leadLawyerId
WHERE u.id IS NULL;

SELECT 'cases_missing_law_firm' AS check_name, COUNT(*) AS violations
FROM cases c
LEFT JOIN lawFirms f ON f.id = c.lawFirmId
WHERE f.id IS NULL;

SELECT 'cases_missing_matter' AS check_name, COUNT(*) AS violations
FROM cases c
LEFT JOIN matters m ON m.id = c.matterId
WHERE m.id IS NULL;

SELECT 'matter_client_cross_tenant' AS check_name, COUNT(*) AS violations
FROM matters m
JOIN clients c ON c.id = m.clientId
WHERE c.lawFirmId <> m.lawFirmId;

SELECT 'matter_lawyer_cross_tenant' AS check_name, COUNT(*) AS violations
FROM matters m
JOIN users u ON u.id = m.leadLawyerId
WHERE u.lawFirmId IS NOT NULL AND u.lawFirmId <> m.lawFirmId;

SELECT 'case_matter_cross_tenant' AS check_name, COUNT(*) AS violations
FROM cases c
JOIN matters m ON m.id = c.matterId
WHERE c.lawFirmId <> m.lawFirmId;

-- Apply only after every check above returns 0:
-- SOURCE drizzle/0011_core_relationship_fks.sql;

-- After applying, verify the new constraints:
-- SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
-- FROM information_schema.KEY_COLUMN_USAGE
-- WHERE TABLE_SCHEMA = DATABASE()
--   AND CONSTRAINT_NAME IN (
--     'clients_lawFirmId_fk', 'matters_lawFirmId_fk',
--     'matters_clientId_fk', 'matters_leadLawyerId_fk',
--     'cases_lawFirmId_fk', 'cases_matterId_fk'
--   );
