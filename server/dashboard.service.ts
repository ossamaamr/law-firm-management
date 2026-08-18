import { and, eq, gte, lt } from "drizzle-orm";
import { cases, clients, courtSessions, expenses, invoices, matters } from "../drizzle/schema";
import { getDb } from "./db";

export interface DashboardSummaryInput {
  from?: Date;
  to?: Date;
}

export interface DashboardSummary {
  period: { from: string; to: string };
  cases: {
    total: number;
    open: number;
    pending: number;
    closed: number;
  };
  clients: { total: number };
  matters: { total: number };
  invoices: {
    pendingCount: number;
    totalFinalAmount: number;
  };
  expenses: { totalAmount: number };
  upcomingSessions: number;
}

function toAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

export async function getDashboardSummary(
  lawFirmId: number,
  input: DashboardSummaryInput = {},
): Promise<DashboardSummary> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const from = input.from ?? new Date(now.getFullYear(), now.getMonth(), 1);
  const to = input.to ?? new Date(now.getFullYear(), now.getMonth() + 1, 1);
  if (from >= to) throw new Error("Dashboard period must have from before to");

  const [caseRows, clientRows, matterRows, invoiceRows, expenseRows, sessionRows] =
    await Promise.all([
      db.select({ status: cases.status })
        .from(cases)
        .where(and(eq(cases.lawFirmId, lawFirmId), eq(cases.isDeleted, false))),
      db.select({ id: clients.id })
        .from(clients)
        .where(eq(clients.lawFirmId, lawFirmId)),
      db.select({ id: matters.id })
        .from(matters)
        .where(eq(matters.lawFirmId, lawFirmId)),
      db.select({ status: invoices.status, finalAmount: invoices.finalAmount })
        .from(invoices)
        .where(and(
          eq(invoices.lawFirmId, lawFirmId),
          gte(invoices.invoiceDate, from),
          lt(invoices.invoiceDate, to),
        )),
      db.select({ amount: expenses.amount })
        .from(expenses)
        .where(and(
          eq(expenses.lawFirmId, lawFirmId),
          gte(expenses.date, from),
          lt(expenses.date, to),
          eq(expenses.status, "approved"),
        )),
      db.select({ id: courtSessions.id })
        .from(courtSessions)
        .innerJoin(cases, eq(courtSessions.caseId, cases.id))
        .where(and(
          eq(cases.lawFirmId, lawFirmId),
          eq(cases.isDeleted, false),
          gte(courtSessions.sessionDate, from),
          lt(courtSessions.sessionDate, to),
        )),
    ]);

  const caseCount = (status: string) => caseRows.filter((row) => row.status === status).length;
  const pendingInvoiceStatuses = new Set(["draft", "sent", "overdue"]);

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    cases: {
      total: caseRows.length,
      open: caseCount("open"),
      pending: caseCount("pending"),
      closed: caseCount("closed"),
    },
    clients: { total: clientRows.length },
    matters: { total: matterRows.length },
    invoices: {
      pendingCount: invoiceRows.filter((row) => pendingInvoiceStatuses.has(row.status)).length,
      totalFinalAmount: invoiceRows.reduce((sum, row) => sum + toAmount(row.finalAmount), 0),
    },
    expenses: {
      totalAmount: expenseRows.reduce((sum, row) => sum + toAmount(row.amount), 0),
    },
    upcomingSessions: sessionRows.length,
  };
}
