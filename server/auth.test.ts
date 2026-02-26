import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Authentication Tests
 * اختبارات المصادقة
 */

describe("Authentication Routes", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as any,
      res: {
        clearCookie: vi.fn(),
      } as any,
    };
  });

  describe("Signup", () => {
    it("should submit a registration request with new firm", async () => {
      const caller = appRouter.createCaller({ ...ctx, user: null });

      const result = await caller.auth.signup({
        hasExistingIdentifier: false,
        fullName: "أحمد محمد",
        email: "ahmad@example.com",
        phone: "+966501234567",
        birthDate: "1990-01-15",
        firmName: "مكتب أحمد للمحاماة",
        licenseNumber: "LIC-2024-001",
        city: "الرياض",
        country: "السعودية",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("تم تقديم طلبك");
      expect(result.requestId).toBeDefined();
    });

    it("should join existing firm with valid identifier", async () => {
      const caller = appRouter.createCaller({ ...ctx, user: null });

      const result = await caller.auth.signup({
        hasExistingIdentifier: true,
        firmIdentifier: "@test_firm#",
        fullName: "فاطمة علي",
        email: "fatima@example.com",
        phone: "+966509876543",
        birthDate: "1995-05-20",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("تم إضافتك");
    });

    it("should reject invalid email", async () => {
      const caller = appRouter.createCaller({ ...ctx, user: null });

      try {
        await caller.auth.signup({
          hasExistingIdentifier: false,
          fullName: "أحمد محمد",
          email: "invalid-email",
          phone: "+966501234567",
          birthDate: "1990-01-15",
          firmName: "مكتب أحمد",
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).toContain("بريد إلكتروني");
      }
    });

    it("should reject short name", async () => {
      const caller = appRouter.createCaller({ ...ctx, user: null });

      try {
        await caller.auth.signup({
          hasExistingIdentifier: false,
          fullName: "أ",
          email: "test@example.com",
          phone: "+966501234567",
          birthDate: "1990-01-15",
          firmName: "مكتب",
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).toContain("الاسم");
      }
    });
  });

  describe("Login", () => {
    it("should login with valid credentials", async () => {
      const caller = appRouter.createCaller({ ...ctx, user: null });

      const result = await caller.auth.login({
        firmIdentifier: "@test_firm#",
        userName: "أحمد محمد",
        password: "SecurePassword123",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("تم تسجيل الدخول");
      expect(result.token).toBeDefined();
      expect(result.user.firmIdentifier).toBe("@test_firm#");
    });

    it("should reject invalid identifier format", async () => {
      const caller = appRouter.createCaller({ ...ctx, user: null });

      try {
        await caller.auth.login({
          firmIdentifier: "invalid_format",
          userName: "أحمد محمد",
          password: "password",
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).toContain("صيغة المعرف");
      }
    });

    it("should reject short password", async () => {
      const caller = appRouter.createCaller({ ...ctx, user: null });

      try {
        await caller.auth.login({
          firmIdentifier: "@test_firm#",
          userName: "أحمد محمد",
          password: "short",
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).toContain("كلمة المرور");
      }
    });
  });

  describe("Verify Identifier", () => {
    it("should verify existing identifier", async () => {
      const caller = appRouter.createCaller({ ...ctx, user: null });

      const result = await caller.auth.verifyIdentifier({
        firmIdentifier: "@test_firm#",
      });

      expect(result).toBeDefined();
      expect(result.exists).toBeDefined();
    });

    it("should reject invalid identifier format", async () => {
      const caller = appRouter.createCaller({ ...ctx, user: null });

      try {
        await caller.auth.verifyIdentifier({
          firmIdentifier: "invalid",
        });
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).toContain("صيغة المعرف");
      }
    });
  });

  describe("Admin Approval", () => {
    it("should approve registration request", async () => {
      const adminUser = {
        id: 1,
        openId: "admin-user",
        name: "Admin",
        email: "admin@firm.com",
        role: "admin" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = {
        user: adminUser,
        req: { protocol: "https", headers: {} } as any,
        res: { clearCookie: vi.fn() } as any,
      };

      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.approveRegistration({
        requestId: 1,
        firmName: "مكتب جديد",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("تم الموافقة");
      expect(result.identifier).toMatch(/^@[a-zA-Z0-9_-]+#$/);
    });

    it("should reject registration request", async () => {
      const adminUser = {
        id: 1,
        openId: "admin-user",
        name: "Admin",
        email: "admin@firm.com",
        role: "admin" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = {
        user: adminUser,
        req: { protocol: "https", headers: {} } as any,
        res: { clearCookie: vi.fn() } as any,
      };

      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.rejectRegistration({
        requestId: 1,
        rejectionReason: "بيانات غير صحيحة",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("تم رفض");
    });
  });

  describe("Logout", () => {
    it("should clear session cookie on logout", async () => {
      const user = {
        id: 1,
        openId: "test-user",
        name: "Test User",
        email: "test@example.com",
        role: "user" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const mockClearCookie = vi.fn();
      const ctx = {
        user,
        req: { protocol: "https", headers: {} } as any,
        res: { clearCookie: mockClearCookie } as any,
      };

      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.logout();

      expect(result.success).toBe(true);
      expect(mockClearCookie).toHaveBeenCalled();
    });
  });
});
