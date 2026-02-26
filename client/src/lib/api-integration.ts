/**
 * API Integration Layer
 * ربط الواجهة الأمامية مع الـ API الخلفي
 */

import { trpc } from './trpc';

/**
 * Authentication API Integration
 * تكامل واجهات المصادقة
 */
export const authAPI = {
  /**
   * Submit a new registration request
   * تقديم طلب تسجيل جديد
   */
  async signup(data: {
    hasExistingIdentifier: boolean;
    firmIdentifier?: string;
    fullName: string;
    email: string;
    phone: string;
    birthDate: string;
    firmName?: string;
    licenseNumber?: string;
    city?: string;
    country?: string;
  }) {
    try {
      const result = await trpc.auth.signup.mutate(data);
      return {
        success: true,
        data: result,
        message: 'تم تقديم طلبك بنجاح',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: error.message || 'حدث خطأ أثناء التسجيل',
      };
    }
  },

  /**
   * Login to the system
   * تسجيل الدخول
   */
  async login(data: {
    firmIdentifier: string;
    userName: string;
    password: string;
  }) {
    try {
      const result = await trpc.auth.login.mutate(data);
      // Store token in localStorage
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('user_firm', result.user.firmIdentifier);
      }
      return {
        success: true,
        data: result,
        message: 'تم تسجيل الدخول بنجاح',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: error.message || 'فشل تسجيل الدخول',
      };
    }
  },

  /**
   * Verify if a firm identifier exists
   * التحقق من وجود معرف المكتب
   */
  async verifyIdentifier(firmIdentifier: string) {
    try {
      const result = await trpc.auth.verifyIdentifier.query({
        firmIdentifier,
      });
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get pending registration requests (Admin only)
   * جلب الطلبات المعلقة (للمسؤول فقط)
   */
  async getPendingRequests(filters?: {
    status?: 'pending' | 'approved' | 'rejected';
    limit?: number;
    offset?: number;
  }) {
    try {
      const result = await trpc.auth.getPendingRequests.query(filters || {});
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Approve a registration request (Admin only)
   * الموافقة على طلب تسجيل (للمسؤول فقط)
   */
  async approveRegistration(data: {
    requestId: number;
    firmName: string;
  }) {
    try {
      const result = await trpc.auth.approveRegistration.mutate(data);
      return {
        success: true,
        data: result,
        message: 'تم الموافقة على الطلب بنجاح',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'فشل الموافقة على الطلب',
      };
    }
  },

  /**
   * Reject a registration request (Admin only)
   * رفض طلب تسجيل (للمسؤول فقط)
   */
  async rejectRegistration(data: {
    requestId: number;
    rejectionReason: string;
  }) {
    try {
      const result = await trpc.auth.rejectRegistration.mutate(data);
      return {
        success: true,
        data: result,
        message: 'تم رفض الطلب بنجاح',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'فشل رفض الطلب',
      };
    }
  },

  /**
   * Logout from the system
   * تسجيل الخروج
   */
  async logout() {
    try {
      await trpc.auth.logout.mutate();
      // Clear stored data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_firm');
      return {
        success: true,
        message: 'تم تسجيل الخروج بنجاح',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

/**
 * Activity Logging API Integration
 * تكامل واجهات تسجيل النشاطات
 */
export const activityAPI = {
  /**
   * Get activity logs with filters
   * جلب سجلات النشاطات مع الفلاتر
   */
  async getLogs(filters: {
    firmId: number;
    limit?: number;
    offset?: number;
    actionType?: string;
    entityType?: string;
    userId?: number;
    dateFrom?: string;
    dateTo?: string;
  }) {
    try {
      const result = await trpc.activity.getLogs.query(filters);
      return {
        success: true,
        data: result.data,
        count: result.count,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get activity statistics
   * جلب إحصائيات النشاطات
   */
  async getStats(firmId: number) {
    try {
      const result = await trpc.activity.getStats.query({ firmId });
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Export activities as CSV
   * تصدير النشاطات كـ CSV
   */
  async exportCSV(filters: {
    firmId: number;
    actionType?: string;
    entityType?: string;
  }) {
    try {
      const result = await trpc.activity.exportCSV.query(filters);
      return {
        success: true,
        data: result.data,
        filename: result.filename,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get recent activities for dashboard
   * جلب النشاطات الأخيرة للوحة التحكم
   */
  async getRecent(firmId: number, limit: number = 10) {
    try {
      const result = await trpc.activity.getRecent.query({ firmId, limit });
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get activities by entity
   * جلب النشاطات حسب الكيان
   */
  async getByEntity(firmId: number, entityType: string, entityId: number) {
    try {
      const result = await trpc.activity.getByEntity.query({
        firmId,
        entityType,
        entityId,
      });
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get activities by user
   * جلب النشاطات حسب المستخدم
   */
  async getByUser(firmId: number, userId: number, limit: number = 50) {
    try {
      const result = await trpc.activity.getByUser.query({
        firmId,
        userId,
        limit,
      });
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

/**
 * Real-time Synchronization
 * المزامنة الفورية
 */
export const syncAPI = {
  /**
   * Subscribe to firm updates
   * الاشتراك في تحديثات المكتب
   */
  subscribeFirmUpdates(firmId: number, callback: (data: any) => void) {
    // This will be implemented with WebSocket or Server-Sent Events
    // سيتم تطبيقه باستخدام WebSocket أو Server-Sent Events
    const eventSource = new EventSource(`/api/sync/firm/${firmId}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };

    eventSource.onerror = () => {
      console.error('Sync connection error');
      eventSource.close();
    };

    return () => eventSource.close();
  },

  /**
   * Subscribe to activity updates
   * الاشتراك في تحديثات النشاطات
   */
  subscribeActivityUpdates(firmId: number, callback: (data: any) => void) {
    const eventSource = new EventSource(`/api/sync/activity/${firmId}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };

    eventSource.onerror = () => {
      console.error('Activity sync error');
      eventSource.close();
    };

    return () => eventSource.close();
  },

  /**
   * Broadcast an update to all firm members
   * بث تحديث لجميع أعضاء المكتب
   */
  async broadcastUpdate(firmId: number, data: any) {
    try {
      const result = await trpc.sync.broadcast.mutate({
        firmId,
        data,
      });
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

/**
 * Utility Functions
 * دوال مساعدة
 */
export const apiUtils = {
  /**
   * Get stored auth token
   * الحصول على رمز المصادقة المخزن
   */
  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  /**
   * Get stored firm identifier
   * الحصول على معرف المكتب المخزن
   */
  getFirmIdentifier(): string | null {
    return localStorage.getItem('user_firm');
  },

  /**
   * Check if user is authenticated
   * التحقق من تسجيل دخول المستخدم
   */
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  },

  /**
   * Clear all stored auth data
   * مسح جميع بيانات المصادقة المخزنة
   */
  clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_firm');
  },

  /**
   * Format date for display
   * تنسيق التاريخ للعرض
   */
  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /**
   * Format activity action for display
   * تنسيق إجراء النشاط للعرض
   */
  formatAction(action: string): string {
    const actions: Record<string, string> = {
      create: 'إضافة',
      update: 'تعديل',
      delete: 'حذف',
      approve: 'موافقة',
      reject: 'رفض',
      export: 'تصدير',
      import: 'استيراد',
    };
    return actions[action] || action;
  },

  /**
   * Format entity type for display
   * تنسيق نوع الكيان للعرض
   */
  formatEntityType(type: string): string {
    const types: Record<string, string> = {
      case: 'قضية',
      matter: 'ملف',
      client: 'عميل',
      invoice: 'فاتورة',
      document: 'مستند',
      user: 'مستخدم',
      firm: 'مكتب',
    };
    return types[type] || type;
  },
};
