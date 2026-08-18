import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function makeContext(user: TrpcContext["user"] = null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

describe("Authentication Routes", () => {
  it("returns the authenticated platform session without inventing credentials", async () => {
    const user = {
      id: 1,
      openId: "platform-user",
      name: "أحمد محمد",
      email: "ahmad@example.com",
      role: "user" as const,
      lawFirmId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const result = await appRouter.createCaller(makeContext(user)).auth.me();
    expect(result).toEqual(user);
  });

  it("returns null when there is no platform session", async () => {
    await expect(appRouter.createCaller(makeContext()).auth.me()).resolves.toBeNull();
  });

  it("rejects local signup instead of returning a mock success", async () => {
    await expect(appRouter.createCaller(makeContext()).auth.signup({
      hasExistingIdentifier: false,
      fullName: "أحمد محمد",
      email: "ahmad@example.com",
      phone: "+966501234567",
      birthDate: "1990-01-15",
      firmName: "مكتب أحمد للمحاماة",
    })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("rejects local login instead of returning a token", async () => {
    await expect(appRouter.createCaller(makeContext()).auth.login({
      firmIdentifier: "@test_firm#",
      userName: "أحمد محمد",
      password: "SecurePassword123",
    })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("validates local login input before the unavailable-provider guard", async () => {
    await expect(appRouter.createCaller(makeContext()).auth.login({
      firmIdentifier: "invalid_format",
      userName: "أحمد محمد",
      password: "short",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects local identifier verification instead of fabricating firm data", async () => {
    await expect(appRouter.createCaller(makeContext()).auth.verifyIdentifier({
      firmIdentifier: "@test_firm#",
    })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("requires a session before admin registration actions", async () => {
    await expect(appRouter.createCaller(makeContext()).auth.getPendingRequests())
      .rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("does not pretend to approve a registration request", async () => {
    const admin = {
      id: 1,
      openId: "admin-user",
      name: "Admin",
      email: "admin@firm.com",
      role: "admin" as const,
      lawFirmId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    await expect(appRouter.createCaller(makeContext(admin)).auth.approveRegistration({
      requestId: 1,
      firmName: "مكتب جديد",
    })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("does not pretend to reject a registration request", async () => {
    const admin = {
      id: 1,
      openId: "admin-user",
      name: "Admin",
      email: "admin@firm.com",
      role: "admin" as const,
      lawFirmId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    await expect(appRouter.createCaller(makeContext(admin)).auth.rejectRegistration({
      requestId: 1,
      rejectionReason: "بيانات غير صحيحة",
    })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("clears the session cookie on logout", async () => {
    const context = makeContext({
      id: 1,
      openId: "platform-user",
      name: "Test User",
      email: "test@example.com",
      role: "user" as const,
      lawFirmId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });
    const result = await appRouter.createCaller(context).auth.logout();
    expect(result.success).toBe(true);
    expect(context.res.clearCookie).toHaveBeenCalled();
  });
});
