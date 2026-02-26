/**
 * Synchronization Routes
 * مسارات المزامنة
 */

import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import { syncService } from './sync.service';
import { TRPCError } from '@trpc/server';

export const syncRouter = router({
  /**
   * Broadcast an update to all firm members
   * بث تحديث لجميع أعضاء المكتب
   */
  broadcast: publicProcedure
    .input(
      z.object({
        firmId: z.number().min(1),
        eventType: z.string().min(1),
        data: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify user has access to this firm
        // التحقق من أن المستخدم لديه صلاحية الوصول لهذا المكتب
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'يجب تسجيل الدخول',
          });
        }

        const event = await syncService.broadcastFirmUpdate(
          input.firmId,
          input.eventType,
          input.data || {},
          ctx.user.id
        );

        return {
          success: true,
          event,
          message: 'تم بث التحديث بنجاح',
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'فشل بث التحديث',
        });
      }
    }),

  /**
   * Get connection statistics for a firm
   * الحصول على إحصائيات الاتصال لمكتب
   */
  getStats: publicProcedure
    .input(
      z.object({
        firmId: z.number().min(1),
      })
    )
    .query(({ input }) => {
      try {
        const stats = syncService.getConnectionStats(input.firmId);
        return {
          success: true,
          data: stats,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'فشل جلب الإحصائيات',
        });
      }
    }),

  /**
   * Broadcast case update
   * بث تحديث القضية
   */
  broadcastCaseUpdate: publicProcedure
    .input(
      z.object({
        firmId: z.number().min(1),
        caseId: z.number().min(1),
        action: z.enum(['create', 'update', 'delete', 'status_change']),
        changes: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'يجب تسجيل الدخول',
          });
        }

        const event = await syncService.broadcastCaseUpdate(
          input.firmId,
          input.caseId,
          input.action,
          ctx.user.id,
          input.changes
        );

        return {
          success: true,
          event,
          message: 'تم بث تحديث القضية بنجاح',
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'فشل بث التحديث',
        });
      }
    }),

  /**
   * Broadcast matter update
   * بث تحديث الملف
   */
  broadcastMatterUpdate: publicProcedure
    .input(
      z.object({
        firmId: z.number().min(1),
        matterId: z.number().min(1),
        action: z.enum(['create', 'update', 'delete', 'status_change']),
        changes: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'يجب تسجيل الدخول',
          });
        }

        const event = await syncService.broadcastMatterUpdate(
          input.firmId,
          input.matterId,
          input.action,
          ctx.user.id,
          input.changes
        );

        return {
          success: true,
          event,
          message: 'تم بث تحديث الملف بنجاح',
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'فشل بث التحديث',
        });
      }
    }),

  /**
   * Broadcast client update
   * بث تحديث العميل
   */
  broadcastClientUpdate: publicProcedure
    .input(
      z.object({
        firmId: z.number().min(1),
        clientId: z.number().min(1),
        action: z.enum(['create', 'update', 'delete']),
        changes: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'يجب تسجيل الدخول',
          });
        }

        const event = await syncService.broadcastClientUpdate(
          input.firmId,
          input.clientId,
          input.action,
          ctx.user.id,
          input.changes
        );

        return {
          success: true,
          event,
          message: 'تم بث تحديث العميل بنجاح',
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'فشل بث التحديث',
        });
      }
    }),

  /**
   * Broadcast invoice update
   * بث تحديث الفاتورة
   */
  broadcastInvoiceUpdate: publicProcedure
    .input(
      z.object({
        firmId: z.number().min(1),
        invoiceId: z.number().min(1),
        action: z.enum(['create', 'update', 'delete', 'paid', 'pending']),
        changes: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'يجب تسجيل الدخول',
          });
        }

        const event = await syncService.broadcastInvoiceUpdate(
          input.firmId,
          input.invoiceId,
          input.action,
          ctx.user.id,
          input.changes
        );

        return {
          success: true,
          event,
          message: 'تم بث تحديث الفاتورة بنجاح',
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'فشل بث التحديث',
        });
      }
    }),

  /**
   * Broadcast document update
   * بث تحديث المستند
   */
  broadcastDocumentUpdate: publicProcedure
    .input(
      z.object({
        firmId: z.number().min(1),
        documentId: z.number().min(1),
        action: z.enum(['create', 'update', 'delete', 'upload']),
        changes: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'يجب تسجيل الدخول',
          });
        }

        const event = await syncService.broadcastDocumentUpdate(
          input.firmId,
          input.documentId,
          input.action,
          ctx.user.id,
          input.changes
        );

        return {
          success: true,
          event,
          message: 'تم بث تحديث المستند بنجاح',
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'فشل بث التحديث',
        });
      }
    }),
});
