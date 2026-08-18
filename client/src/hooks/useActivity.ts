import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Activity Logging Hook
 * هوك تسجيل النشاطات
 */

export function useActivity() {
  const session = trpc.auth.me.useQuery();
  const firmId = session.data?.lawFirmId ?? 0;
  const recent = useRecentActivities(firmId);
  const statsQuery = trpc.activity.getStats.useQuery({ firmId }, { enabled: firmId > 0 });
  return {
    activities: recent.activities,
    stats: statsQuery.data?.data,
    isLoading: session.isLoading || recent.isLoading || statsQuery.isLoading,
  };
}

export function useActivityLogs(firmId: number) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const logsQuery = trpc.activity.getLogs.useQuery(
    {
      firmId,
      limit: 50,
      offset: 0,
    },
    { enabled: false }
  );

  const getLogs = useCallback(
    async (options?: {
      limit?: number;
      offset?: number;
      actionType?: string;
      userId?: number;
      entityType?: string;
    }) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await utils.activity.getLogs.fetch({ firmId, ...options });
        return result;
      } catch (err: any) {
        setError(err.message || "حدث خطأ أثناء جلب السجلات");
        return { success: false, data: [], count: 0 };
      } finally {
        setIsLoading(false);
      }
    },
    [firmId, utils]
  );

  return {
    getLogs,
    isLoading,
    error,
    logs: logsQuery.data?.data || [],
  };
}

export function useActivityStats(firmId: number) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const statsQuery = trpc.activity.getStats.useQuery(
    { firmId },
    { enabled: firmId > 0 }
  );

  const getStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await utils.activity.getStats.fetch({ firmId });
      return result;
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء حساب الإحصائيات");
      return { success: false, data: null };
    } finally {
      setIsLoading(false);
    }
    }, [firmId, utils]);
  return {
    getStats,
    isLoading,
    error,
    stats: statsQuery.data?.data,
  };
}

export function useActivityExport(firmId: number) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const downloadCsv = useCallback((data: { data: string; filename: string }) => {
    const element = document.createElement("a");
    const file = new Blob([data.data], { type: "text/csv" });
    element.href = URL.createObjectURL(file);
    element.download = data.filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  }, []);

  const exportCSV = useCallback(
    async (options?: {
      actionType?: string;
      userId?: number;
      entityType?: string;
    }) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await utils.activity.exportCSV.fetch({ firmId, ...options });
        downloadCsv(data);
      } catch (err: any) {
        setError(err.message || "حدث خطأ أثناء التصدير");
      } finally {
        setIsLoading(false);
      }
    },
    [firmId, utils, downloadCsv]
  );

  return {
    exportCSV,
    isLoading,
    error,
  };
}

export function useRecentActivities(firmId: number, limit: number = 10) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const recentQuery = trpc.activity.getRecent.useQuery(
    { firmId, limit },
    { enabled: firmId > 0 }
  );

  const getRecent = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await utils.activity.getRecent.fetch({ firmId, limit });
      return result;
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء جلب النشاطات");
      return { success: false, data: [] };
    } finally {
      setIsLoading(false);
    }
  }, [firmId, limit, utils]);

  return {
    getRecent,
    isLoading,
    error,
    activities: recentQuery.data?.data || [],
  };
}

export function useEntityActivities(
  firmId: number,
  entityType: string,
  entityId: number
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const entityQuery = trpc.activity.getByEntity.useQuery(
    { firmId, entityType, entityId },
    { enabled: false }
  );

  const getEntityActivities = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await utils.activity.getByEntity.fetch({ firmId, entityType, entityId });
      return result;
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء جلب النشاطات");
      return { success: false, data: [] };
    } finally {
      setIsLoading(false);
    }
  }, [firmId, entityType, entityId, utils]);

  return {
    getEntityActivities,
    isLoading,
    error,
    activities: entityQuery.data?.data || [],
  };
}

export function useUserActivities(firmId: number, userId: number) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const userQuery = trpc.activity.getByUser.useQuery(
    { firmId, userId, limit: 50 },
    { enabled: false }
  );

  const getUserActivities = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await utils.activity.getByUser.fetch({ firmId, userId, limit: 50 });
      return result;
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء جلب النشاطات");
      return { success: false, data: [] };
    } finally {
      setIsLoading(false);
    }
  }, [firmId, userId, utils]);

  return {
    getUserActivities,
    isLoading,
    error,
    activities: userQuery.data?.data || [],
  };
}
