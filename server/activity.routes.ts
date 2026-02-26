import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getActivityLogs,
  getActivityStats,
  exportActivitiesAsCSV,
} from "./activity.service";

/**
 * Activity Logging Routes
 * مسارات تسجيل النشاطات
 */

export const activityRouter = router({
  /**
   * Get activity logs for a firm
   * الحصول على سجلات النشاطات للمكتب
   */
  getLogs: protectedProcedure
    .input(
      z.object({
        firmId: z.number(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
        actionType: z.string().optional(),
        userId: z.number().optional(),
        entityType: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // TODO: Verify user has access to this firm
        const logs = await getActivityLogs(input.firmId, {
          limit: input.limit,
          offset: input.offset,
          actionType: input.actionType,
          userId: input.userId,
          entityType: input.entityType,
        });

        return {
          success: true,
          data: logs,
          count: logs.length,
        };
      } catch (error) {
        console.error("Error fetching activity logs:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "حدث خطأ أثناء جلب السجلات",
        });
      }
    }),

  /**
   * Get activity statistics
   * الحصول على إحصائيات النشاطات
   */
  getStats: protectedProcedure
    .input(z.object({ firmId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        // TODO: Verify user has access to this firm
        const stats = await getActivityStats(input.firmId);

        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        console.error("Error fetching activity stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "حدث خطأ أثناء حساب الإحصائيات",
        });
      }
    }),

  /**
   * Export activities as CSV
   * تصدير النشاطات كـ CSV
   */
  exportCSV: protectedProcedure
    .input(
      z.object({
        firmId: z.number(),
        actionType: z.string().optional(),
        userId: z.number().optional(),
        entityType: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // TODO: Verify user has access to this firm
        const csv = await exportActivitiesAsCSV(input.firmId, {
          actionType: input.actionType,
          userId: input.userId,
          entityType: input.entityType,
        });

        return {
          success: true,
          data: csv,
          filename: `activity-logs-${new Date().toISOString().split("T")[0]}.csv`,
        };
      } catch (error) {
        console.error("Error exporting activity logs:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "حدث خطأ أثناء تصدير السجلات",
        });
      }
    }),

  /**
   * Get recent activities (for dashboard)
   * الحصول على النشاطات الأخيرة (للوحة التحكم)
   */
  getRecent: protectedProcedure
    .input(z.object({ firmId: z.number(), limit: z.number().optional().default(10) }))
    .query(async ({ input, ctx }) => {
      try {
        // TODO: Verify user has access to this firm
        const logs = await getActivityLogs(input.firmId, {
          limit: input.limit,
        });

        return {
          success: true,
          data: logs,
        };
      } catch (error) {
        console.error("Error fetching recent activities:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "حدث خطأ أثناء جلب النشاطات الأخيرة",
        });
      }
    }),

  /**
   * Get activities by entity
   * الحصول على النشاطات حسب الكيان
   */
  getByEntity: protectedProcedure
    .input(
      z.object({
        firmId: z.number(),
        entityType: z.string(),
        entityId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // TODO: Verify user has access to this firm
        const logs = await getActivityLogs(input.firmId, {
          entityType: input.entityType,
          limit: 100,
        });

        // Filter by entity ID
        const filtered = logs.filter(
          (log: any) => log.entityId === input.entityId
        );

        return {
          success: true,
          data: filtered,
        };
      } catch (error) {
        console.error("Error fetching entity activities:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "حدث خطأ أثناء جلب نشاطات الكيان",
        });
      }
    }),

  /**
   * Get activities by user
   * الحصول على النشاطات حسب المستخدم
   */
  getByUser: protectedProcedure
    .input(
      z.object({
        firmId: z.number(),
        userId: z.number(),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // TODO: Verify user has access to this firm
        const logs = await getActivityLogs(input.firmId, {
          userId: input.userId,
          limit: input.limit,
        });

        return {
          success: true,
          data: logs,
        };
      } catch (error) {
        console.error("Error fetching user activities:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "حدث خطأ أثناء جلب نشاطات المستخدم",
        });
      }
    }),
});
