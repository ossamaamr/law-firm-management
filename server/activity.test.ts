import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Activity Logging Tests
 * اختبارات تسجيل النشاطات
 */

describe("Activity Logging Routes", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    const user = {
      id: 1,
      openId: "test-user",
      name: "أحمد محمد",
      email: "ahmad@example.com",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    ctx = {
      user,
      req: {
        protocol: "https",
        headers: {},
      } as any,
      res: {
        clearCookie: vi.fn(),
      } as any,
    };
  });

  describe("Get Activity Logs", () => {
    it("should fetch activity logs for a firm", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.activity.getLogs({
        firmId: 1,
        limit: 50,
        offset: 0,
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.count).toBeDefined();
    });

    it("should filter logs by action type", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.activity.getLogs({
        firmId: 1,
        limit: 50,
        offset: 0,
        actionType: "create",
      });

      expect(result.success).toBe(true);
      result.data.forEach((log: any) => {
        expect(log.actionType).toBe("create");
      });
    });

    it("should filter logs by user", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.activity.getLogs({
        firmId: 1,
        limit: 50,
        offset: 0,
        userId: 1,
      });

      expect(result.success).toBe(true);
      result.data.forEach((log: any) => {
        expect(log.userId).toBe(1);
      });
    });

    it("should filter logs by entity type", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.activity.getLogs({
        firmId: 1,
        limit: 50,
        offset: 0,
        entityType: "case",
      });

      expect(result.success).toBe(true);
      result.data.forEach((log: any) => {
        expect(log.entityType).toBe("case");
      });
    });

    it("should support pagination", async () => {
      const caller = appRouter.createCaller(ctx);

      const page1 = await caller.activity.getLogs({
        firmId: 1,
        limit: 10,
        offset: 0,
      });

      const page2 = await caller.activity.getLogs({
        firmId: 1,
        limit: 10,
        offset: 10,
      });

      expect(page1.data.length).toBeLessThanOrEqual(10);
      expect(page2.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe("Get Activity Statistics", () => {
    it("should calculate activity statistics", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.activity.getStats({
        firmId: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.totalActivities).toBeGreaterThanOrEqual(0);
      expect(result.data.todayActivities).toBeGreaterThanOrEqual(0);
      expect(result.data.thisWeekActivities).toBeGreaterThanOrEqual(0);
      expect(result.data.thisMonthActivities).toBeGreaterThanOrEqual(0);
      expect(typeof result.data.byActionType).toBe("object");
      expect(typeof result.data.byEntityType).toBe("object");
      expect(Array.isArray(result.data.topUsers)).toBe(true);
    });
  });

  describe("Export Activities as CSV", () => {
    it("should export activities as CSV", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.activity.exportCSV({
        firmId: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe("string");
      expect(result.filename).toBeDefined();
      expect(result.filename).toContain("activity-logs");
      expect(result.filename).toContain(".csv");
    });

    it("should export CSV with filters", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.activity.exportCSV({
        firmId: 1,
        actionType: "create",
        entityType: "case",
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe("Get Recent Activities", () => {
    it("should fetch recent activities for dashboard", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.activity.getRecent({
        firmId: 1,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(10);
    });

    it("should respect limit parameter", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.activity.getRecent({
        firmId: 1,
        limit: 5,
      });

      expect(result.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe("Get Activities by Entity", () => {
    it("should fetch activities for a specific entity", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.activity.getByEntity({
        firmId: 1,
        entityType: "case",
        entityId: 1,
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      result.data.forEach((log: any) => {
        expect(log.entityType).toBe("case");
        expect(log.entityId).toBe(1);
      });
    });
  });

  describe("Get Activities by User", () => {
    it("should fetch activities for a specific user", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.activity.getByUser({
        firmId: 1,
        userId: 1,
        limit: 50,
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      result.data.forEach((log: any) => {
        expect(log.userId).toBe(1);
      });
    });

    it("should support pagination for user activities", async () => {
      const caller = appRouter.createCaller(ctx);

      const result = await caller.activity.getByUser({
        firmId: 1,
        userId: 1,
        limit: 10,
      });

      expect(result.data.length).toBeLessThanOrEqual(10);
    });
  });
});
