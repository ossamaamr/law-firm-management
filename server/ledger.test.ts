import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { appendLedgerEntry } from "./db";

function context(role: TrpcContext["user"]["role"]): TrpcContext {
  return {
    user: {
      id: 7,
      openId: "ledger-test-user",
      name: "Ledger Test User",
      email: "ledger@example.com",
      role,
      lawFirmId: 101,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

describe("Immutable ledger security contract", () => {
  it("rejects invalid amounts before database access", async () => {
    await expect(appendLedgerEntry({
      lawFirmId: 101,
      entryType: "payment_received",
      direction: "credit",
      amount: "0",
      idempotencyKey: "payment:invalid-zero",
      createdById: 7,
    })).rejects.toThrow("positive decimal");

    await expect(appendLedgerEntry({
      lawFirmId: 101,
      entryType: "payment_received",
      direction: "credit",
      amount: "10.999",
      idempotencyKey: "payment:invalid-scale",
      createdById: 7,
    })).rejects.toThrow("positive decimal");
  });

  it("rejects invalid currency and idempotency keys before database access", async () => {
    await expect(appendLedgerEntry({
      lawFirmId: 101,
      entryType: "adjustment",
      direction: "debit",
      amount: "10.00",
      currency: "ريال",
      idempotencyKey: "adjustment:valid-key",
      createdById: 7,
    })).rejects.toThrow("3-letter ISO");

    await expect(appendLedgerEntry({
      lawFirmId: 101,
      entryType: "adjustment",
      direction: "debit",
      amount: "10.00",
      idempotencyKey: "bad",
      createdById: 7,
    })).rejects.toThrow("idempotency key");
  });

  it("denies ledger reads to a regular firm user before database access", async () => {
    await expect(appRouter.createCaller(context("user")).ledger.list({ limit: 10, offset: 0 }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("denies invoice-ledger posting to a regular firm user", async () => {
    await expect(appRouter.createCaller(context("user")).ledger.recordInvoiceIssued({ invoiceId: 1 }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
