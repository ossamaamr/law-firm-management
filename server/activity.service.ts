import { getDb } from "./db";
import { activityLogs } from "../drizzle/schema";
import { TRPCError } from "@trpc/server";

/**
 * Activity Logging Service
 * خدمة تسجيل النشاطات
 * 
 * This service logs all changes made in the firm
 * تسجل هذه الخدمة جميع التغييرات التي تتم في المكتب
 */

export interface ActivityLogInput {
  firmId: number;
  userId: number;
  actionType: "create" | "update" | "delete" | "upload" | "download";
  entityType: string; // "case", "client", "matter", "invoice", "document", etc.
  entityId: number;
  entityName: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  ipAddress?: string;
}

/**
 * Log an activity
 * تسجيل نشاط
 */
export async function logActivity(input: ActivityLogInput): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Activity Log] Database not available");
    return;
  }

  try {
    await db.insert(activityLogs).values({
      firmId: input.firmId,
      userId: input.userId,
      actionType: input.actionType,
      entityType: input.entityType,
      entityId: input.entityId,
      entityName: input.entityName,
      changes: input.changes ? JSON.stringify(input.changes) : null,
      ipAddress: input.ipAddress || "unknown",
      createdAt: new Date(),
    });

    console.log(
      `[Activity Log] Logged: ${input.actionType} ${input.entityType} ${input.entityName}`
    );
  } catch (error) {
    console.error("[Activity Log] Error logging activity:", error);
    // Don't throw - activity logging should not break the main operation
  }
}

/**
 * Get activities for a firm
 * الحصول على نشاطات المكتب
 */
export async function getActivityLogs(
  firmId: number,
  options?: {
    limit?: number;
    offset?: number;
    actionType?: string;
    userId?: number;
    entityType?: string;
  }
): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  try {
    let query = db
      .select()
      .from(activityLogs)
      .where((col) => col.firmId === firmId);

    // Apply filters
    if (options?.actionType) {
      query = query.where((col) => col.actionType === options.actionType);
    }
    if (options?.userId) {
      query = query.where((col) => col.userId === options.userId);
    }
    if (options?.entityType) {
      query = query.where((col) => col.entityType === options.entityType);
    }

    // Order by newest first
    query = query.orderBy((col) => col.createdAt, "desc");

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const results = await query;

    // Parse JSON changes
    return results.map((log: any) => ({
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null,
    }));
  } catch (error) {
    console.error("[Activity Log] Error fetching logs:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "حدث خطأ أثناء جلب السجلات",
    });
  }
}

/**
 * Get activity statistics for a firm
 * الحصول على إحصائيات النشاطات
 */
export async function getActivityStats(firmId: number): Promise<{
  totalActivities: number;
  todayActivities: number;
  thisWeekActivities: number;
  thisMonthActivities: number;
  byActionType: Record<string, number>;
  byEntityType: Record<string, number>;
  topUsers: Array<{ userId: number; count: number }>;
}> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get all activities for this firm
    const allActivities = await db
      .select()
      .from(activityLogs)
      .where((col) => col.firmId === firmId);

    // Calculate statistics
    const todayActivities = allActivities.filter(
      (log: any) => new Date(log.createdAt) >= today
    ).length;

    const thisWeekActivities = allActivities.filter(
      (log: any) => new Date(log.createdAt) >= weekAgo
    ).length;

    const thisMonthActivities = allActivities.filter(
      (log: any) => new Date(log.createdAt) >= monthAgo
    ).length;

    // Count by action type
    const byActionType: Record<string, number> = {};
    allActivities.forEach((log: any) => {
      byActionType[log.actionType] = (byActionType[log.actionType] || 0) + 1;
    });

    // Count by entity type
    const byEntityType: Record<string, number> = {};
    allActivities.forEach((log: any) => {
      byEntityType[log.entityType] = (byEntityType[log.entityType] || 0) + 1;
    });

    // Get top users
    const userCounts: Record<number, number> = {};
    allActivities.forEach((log: any) => {
      userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
    });

    const topUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({
        userId: parseInt(userId),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalActivities: allActivities.length,
      todayActivities,
      thisWeekActivities,
      thisMonthActivities,
      byActionType,
      byEntityType,
      topUsers,
    };
  } catch (error) {
    console.error("[Activity Log] Error calculating stats:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "حدث خطأ أثناء حساب الإحصائيات",
    });
  }
}

/**
 * Export activities as CSV
 * تصدير النشاطات كـ CSV
 */
export async function exportActivitiesAsCSV(
  firmId: number,
  options?: {
    actionType?: string;
    userId?: number;
    entityType?: string;
  }
): Promise<string> {
  const activities = await getActivityLogs(firmId, {
    limit: 10000,
    ...options,
  });

  // Create CSV header
  const headers = [
    "التاريخ",
    "المستخدم",
    "الإجراء",
    "نوع الكيان",
    "اسم الكيان",
    "التفاصيل",
    "عنوان IP",
  ];

  // Create CSV rows
  const rows = activities.map((log: any) => [
    new Date(log.createdAt).toLocaleString("ar-SA"),
    log.userId,
    log.actionType,
    log.entityType,
    log.entityName,
    log.changes ? JSON.stringify(log.changes) : "",
    log.ipAddress,
  ]);

  // Combine headers and rows
  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csv;
}

/**
 * Delete old activity logs (for maintenance)
 * حذف السجلات القديمة (للصيانة)
 */
export async function deleteOldActivityLogs(daysOld: number = 90): Promise<number> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // TODO: Implement delete query
    console.log(`[Activity Log] Would delete logs older than ${cutoffDate}`);
    return 0;
  } catch (error) {
    console.error("[Activity Log] Error deleting old logs:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "حدث خطأ أثناء حذف السجلات القديمة",
    });
  }
}
