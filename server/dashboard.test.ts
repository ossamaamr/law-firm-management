import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

describe("Dashboard authorization contract", () => {
  it("rejects unauthenticated dashboard access", async () => {
    await expect(appRouter.createCaller(context(null)).dashboard.summary())
      .rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects authenticated users without a firm assignment", async () => {
    const user = {
      id: 7,
      openId: "unassigned-user",
      name: "Unassigned",
      email: "unassigned@example.com",
      role: "user" as const,
      lawFirmId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    await expect(appRouter.createCaller(context(user)).dashboard.summary())
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
