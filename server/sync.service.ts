/**
 * Real-time Synchronization Service
 * خدمة المزامنة الفورية
 */

import { EventEmitter } from 'events';
import { getDb } from './db';

/**
 * Global event emitter for real-time updates
 * مُصدِّر الأحداث العام للتحديثات الفورية
 */
const syncEmitter = new EventEmitter();

/**
 * Track active connections per firm
 * تتبع الاتصالات النشطة لكل مكتب
 */
const activeConnections = new Map<number, Set<any>>();

/**
 * Sync Service
 * خدمة المزامنة
 */
export const syncService = {
  /**
   * Emit an update to all members of a firm
   * بث تحديث لجميع أعضاء المكتب
   */
  async broadcastFirmUpdate(
    firmId: number,
    eventType: string,
    data: any,
    userId?: number
  ) {
    const event = {
      type: eventType,
      firmId,
      userId,
      data,
      timestamp: new Date(),
    };

    // Emit to all connected clients
    syncEmitter.emit(`firm:${firmId}`, event);

    // Log the broadcast
    const db = await getDb();
    if (db) {
      try {
        // This will be logged in activity logs
        console.log(`[SYNC] Broadcast to firm ${firmId}: ${eventType}`);
      } catch (error) {
        console.error('[SYNC] Error logging broadcast:', error);
      }
    }

    return event;
  },

  /**
   * Emit an activity update
   * بث تحديث النشاط
   */
  async broadcastActivityUpdate(
    firmId: number,
    activity: {
      actionType: string;
      entityType: string;
      entityId: number;
      userId: number;
      changes?: Record<string, any>;
    }
  ) {
    const event = {
      type: 'activity:new',
      firmId,
      activity,
      timestamp: new Date(),
    };

    syncEmitter.emit(`activity:${firmId}`, event);

    return event;
  },

  /**
   * Subscribe to firm updates
   * الاشتراك في تحديثات المكتب
   */
  subscribeFirmUpdates(firmId: number, callback: (event: any) => void) {
    const listener = (event: any) => {
      callback(event);
    };

    syncEmitter.on(`firm:${firmId}`, listener);

    // Track connection
    if (!activeConnections.has(firmId)) {
      activeConnections.set(firmId, new Set());
    }
    activeConnections.get(firmId)!.add(listener);

    // Return unsubscribe function
    return () => {
      syncEmitter.removeListener(`firm:${firmId}`, listener);
      activeConnections.get(firmId)?.delete(listener);
    };
  },

  /**
   * Subscribe to activity updates
   * الاشتراك في تحديثات النشاطات
   */
  subscribeActivityUpdates(firmId: number, callback: (event: any) => void) {
    const listener = (event: any) => {
      callback(event);
    };

    syncEmitter.on(`activity:${firmId}`, listener);

    // Track connection
    if (!activeConnections.has(firmId)) {
      activeConnections.set(firmId, new Set());
    }
    activeConnections.get(firmId)!.add(listener);

    // Return unsubscribe function
    return () => {
      syncEmitter.removeListener(`activity:${firmId}`, listener);
      activeConnections.get(firmId)?.delete(listener);
    };
  },

  /**
   * Get connection stats for a firm
   * الحصول على إحصائيات الاتصال لمكتب
   */
  getConnectionStats(firmId: number) {
    return {
      firmId,
      activeConnections: activeConnections.get(firmId)?.size || 0,
      totalListeners: syncEmitter.listenerCount(`firm:${firmId}`),
    };
  },

  /**
   * Broadcast case update
   * بث تحديث القضية
   */
  async broadcastCaseUpdate(
    firmId: number,
    caseId: number,
    action: string,
    userId: number,
    changes?: any
  ) {
    return this.broadcastFirmUpdate(firmId, 'case:update', {
      caseId,
      action,
      changes,
      updatedBy: userId,
    });
  },

  /**
   * Broadcast matter update
   * بث تحديث الملف
   */
  async broadcastMatterUpdate(
    firmId: number,
    matterId: number,
    action: string,
    userId: number,
    changes?: any
  ) {
    return this.broadcastFirmUpdate(firmId, 'matter:update', {
      matterId,
      action,
      changes,
      updatedBy: userId,
    });
  },

  /**
   * Broadcast client update
   * بث تحديث العميل
   */
  async broadcastClientUpdate(
    firmId: number,
    clientId: number,
    action: string,
    userId: number,
    changes?: any
  ) {
    return this.broadcastFirmUpdate(firmId, 'client:update', {
      clientId,
      action,
      changes,
      updatedBy: userId,
    });
  },

  /**
   * Broadcast invoice update
   * بث تحديث الفاتورة
   */
  async broadcastInvoiceUpdate(
    firmId: number,
    invoiceId: number,
    action: string,
    userId: number,
    changes?: any
  ) {
    return this.broadcastFirmUpdate(firmId, 'invoice:update', {
      invoiceId,
      action,
      changes,
      updatedBy: userId,
    });
  },

  /**
   * Broadcast document update
   * بث تحديث المستند
   */
  async broadcastDocumentUpdate(
    firmId: number,
    documentId: number,
    action: string,
    userId: number,
    changes?: any
  ) {
    return this.broadcastFirmUpdate(firmId, 'document:update', {
      documentId,
      action,
      changes,
      updatedBy: userId,
    });
  },

  /**
   * Broadcast user joined firm
   * بث انضمام مستخدم للمكتب
   */
  async broadcastUserJoined(firmId: number, userId: number, userName: string) {
    return this.broadcastFirmUpdate(firmId, 'user:joined', {
      userId,
      userName,
    });
  },

  /**
   * Broadcast user left firm
   * بث مغادرة مستخدم للمكتب
   */
  async broadcastUserLeft(firmId: number, userId: number, userName: string) {
    return this.broadcastFirmUpdate(firmId, 'user:left', {
      userId,
      userName,
    });
  },

  /**
   * Broadcast registration approved
   * بث الموافقة على التسجيل
   */
  async broadcastRegistrationApproved(
    firmId: number,
    firmName: string,
    identifier: string
  ) {
    return this.broadcastFirmUpdate(firmId, 'registration:approved', {
      firmName,
      identifier,
    });
  },

  /**
   * Clean up old event listeners
   * تنظيف مستمعي الأحداث القدامى
   */
  cleanup() {
    syncEmitter.removeAllListeners();
    activeConnections.clear();
  },
};

/**
 * Export sync emitter for advanced usage
 * تصدير مُصدِّر المزامنة للاستخدام المتقدم
 */
export { syncEmitter };
