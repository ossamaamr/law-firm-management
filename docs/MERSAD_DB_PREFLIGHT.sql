-- MERSAD production database preflight
-- Run against an isolated MySQL/MariaDB test database before applying migrations 0014-0016.
-- Every result must be 0 before applying relationship, financial, and audit constraints.
-- This file is read-only: it performs no UPDATE, DELETE, INSERT, or ALTER.

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

SELECT 'due_payments_missing_matter' AS check_name, COUNT(*) AS violations
FROM duePayments p
LEFT JOIN matters m ON m.id = p.matterId
WHERE m.id IS NULL;

SELECT 'due_payments_missing_law_firm' AS check_name, COUNT(*) AS violations
FROM duePayments p
LEFT JOIN lawFirms f ON f.id = p.lawFirmId
WHERE f.id IS NULL;

SELECT 'due_payments_matter_cross_tenant' AS check_name, COUNT(*) AS violations
FROM duePayments p
JOIN matters m ON m.id = p.matterId
WHERE p.lawFirmId <> m.lawFirmId;

SELECT 'invoices_missing_matter' AS check_name, COUNT(*) AS violations
FROM invoices i
LEFT JOIN matters m ON m.id = i.matterId
WHERE m.id IS NULL;

SELECT 'invoices_missing_client' AS check_name, COUNT(*) AS violations
FROM invoices i
LEFT JOIN clients c ON c.id = i.clientId
WHERE c.id IS NULL;

SELECT 'invoices_missing_law_firm' AS check_name, COUNT(*) AS violations
FROM invoices i
LEFT JOIN lawFirms f ON f.id = i.lawFirmId
WHERE f.id IS NULL;

SELECT 'invoice_matter_cross_tenant' AS check_name, COUNT(*) AS violations
FROM invoices i
JOIN matters m ON m.id = i.matterId
WHERE i.lawFirmId <> m.lawFirmId;

SELECT 'invoice_client_cross_tenant' AS check_name, COUNT(*) AS violations
FROM invoices i
JOIN clients c ON c.id = i.clientId
WHERE i.lawFirmId <> c.lawFirmId;

SELECT 'ledger_missing_law_firm' AS check_name, COUNT(*) AS violations
FROM ledgerEntries l
LEFT JOIN lawFirms f ON f.id = l.lawFirmId
WHERE f.id IS NULL;

SELECT 'ledger_missing_creator' AS check_name, COUNT(*) AS violations
FROM ledgerEntries l
LEFT JOIN users u ON u.id = l.createdById
WHERE u.id IS NULL;

SELECT 'ledger_creator_cross_tenant' AS check_name, COUNT(*) AS violations
FROM ledgerEntries l
JOIN users u ON u.id = l.createdById
WHERE u.lawFirmId IS NULL OR u.lawFirmId <> l.lawFirmId;

SELECT 'ledger_invoice_cross_tenant' AS check_name, COUNT(*) AS violations
FROM ledgerEntries l
JOIN invoices i ON i.id = l.invoiceId
WHERE l.lawFirmId <> i.lawFirmId;

SELECT 'ledger_matter_cross_tenant' AS check_name, COUNT(*) AS violations
FROM ledgerEntries l
JOIN matters m ON m.id = l.matterId
WHERE l.lawFirmId <> m.lawFirmId;

SELECT 'ledger_due_payment_cross_tenant' AS check_name, COUNT(*) AS violations
FROM ledgerEntries l
JOIN duePayments p ON p.id = l.duePaymentId
WHERE l.lawFirmId <> p.lawFirmId;

SELECT 'audit_logs_missing_user' AS check_name, COUNT(*) AS violations
FROM auditLogs a
LEFT JOIN users u ON u.id = a.userId
WHERE u.id IS NULL;

SELECT 'audit_logs_missing_law_firm' AS check_name, COUNT(*) AS violations
FROM auditLogs a
LEFT JOIN lawFirms f ON f.id = a.lawFirmId
WHERE f.id IS NULL;

SELECT 'audit_logs_user_cross_tenant' AS check_name, COUNT(*) AS violations
FROM auditLogs a
JOIN users u ON u.id = a.userId
WHERE u.lawFirmId IS NULL OR u.lawFirmId <> a.lawFirmId;

SELECT 'activity_logs_missing_user' AS check_name, COUNT(*) AS violations
FROM activityLogs a
LEFT JOIN users u ON u.id = a.userId
WHERE u.id IS NULL;

SELECT 'activity_logs_missing_firm' AS check_name, COUNT(*) AS violations
FROM activityLogs a
LEFT JOIN lawFirms f ON f.id = a.firmId
WHERE f.id IS NULL;

SELECT 'activity_logs_user_cross_tenant' AS check_name, COUNT(*) AS violations
FROM activityLogs a
JOIN users u ON u.id = a.userId
WHERE u.lawFirmId IS NULL OR u.lawFirmId <> a.firmId;

-- These checks require migration 0016 to have been applied.
SELECT 'audit_outbox_missing_user' AS check_name, COUNT(*) AS violations
FROM auditOutbox o
LEFT JOIN users u ON u.id = o.userId
WHERE u.id IS NULL;

SELECT 'audit_outbox_missing_firm' AS check_name, COUNT(*) AS violations
FROM auditOutbox o
LEFT JOIN lawFirms f ON f.id = o.firmId
WHERE f.id IS NULL;

SELECT 'audit_outbox_user_cross_tenant' AS check_name, COUNT(*) AS violations
FROM auditOutbox o
JOIN users u ON u.id = o.userId
WHERE u.lawFirmId IS NULL OR u.lawFirmId <> o.firmId;

-- Apply migrations only after every applicable check above returns 0:
-- SOURCE drizzle/0014_tenant_integrity_fks.sql;
-- SOURCE drizzle/0015_financial_audit_fks.sql;
-- SOURCE drizzle/0016_audit_outbox.sql;

-- After applying, verify all required constraints exist:
SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND CONSTRAINT_NAME IN (
    'clients_lawFirmId_fk', 'matters_lawFirmId_fk',
    'matters_clientId_fk', 'matters_leadLawyerId_fk',
    'cases_lawFirmId_fk', 'cases_matterId_fk',
    'duePayments_matterId_fk', 'duePayments_lawFirmId_fk',
    'invoices_matterId_fk', 'invoices_clientId_fk',
    'invoices_lawFirmId_fk', 'ledgerEntries_lawFirmId_fk',
    'ledgerEntries_invoiceId_fk', 'ledgerEntries_createdById_fk',
    'auditLogs_userId_fk', 'auditLogs_lawFirmId_fk',
    'activityLogs_firmId_fk', 'activityLogs_userId_fk',
    'auditOutbox_firmId_fk', 'auditOutbox_userId_fk'
  )
ORDER BY TABLE_NAME, CONSTRAINT_NAME;
