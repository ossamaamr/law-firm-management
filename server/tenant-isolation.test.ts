import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function contextFor(lawFirmId: number): TrpcContext {
  return {
    user: {
      id: lawFirmId,
      openId: `firm-${lawFirmId}-user`,
      name: `Firm ${lawFirmId} User`,
      email: `firm${lawFirmId}@example.com`,
      role: "user" as const,
      lawFirmId,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

describe("Tenant isolation and IDOR boundaries", () => {
  it("rejects Firm A from reading Firm B activity logs before database access", async () => {
    const caller = appRouter.createCaller(contextFor(1));
    await expect(caller.activity.getLogs({ firmId: 2, limit: 10, offset: 0 }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects Firm B from exporting Firm A activity logs", async () => {
    const caller = appRouter.createCaller(contextFor(2));
    await expect(caller.activity.exportCSV({ firmId: 1 }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("does not expose a case from another tenant", async () => {
    const caller = appRouter.createCaller(contextFor(2));
    await expect(caller.cases.get(999999))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("does not expose documents through an unrelated case identifier", async () => {
    const caller = appRouter.createCaller(contextFor(2));
    await expect(caller.documents.listByCase(999999))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
