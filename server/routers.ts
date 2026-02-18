import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getCasesByLawFirm, getCaseById, createCase, updateCase, softDeleteCase,
  getClientsByLawFirm, getClientById, createClient,
  getSessionsByCaseId, getUpcomingSessions, createCourtSession,
  getDocumentsByCaseId, createDocument, deleteDocument,
  getUserNotifications, createNotification, markNotificationAsRead,
  getAuditLogsByCaseId, createAuditLog,
  getLawFirmById, getUsersByLawFirm, getUserById,
} from "./db";
import { notifyOwner } from "./_core/notification";

// ============ PROCEDURES ============

const lawFirmProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user.lawFirmId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "User not assigned to a law firm" });
  }
  return next({ ctx: { ...ctx, lawFirmId: ctx.user.lawFirmId } });
});

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ============ ROUTERS ============

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ CASES ROUTER ============
  cases: router({
    list: lawFirmProcedure.input(z.object({
      status: z.string().optional(),
      search: z.string().optional(),
    })).query(async ({ input, ctx }) => {
      return getCasesByLawFirm(ctx.lawFirmId, {
        status: input.status,
        search: input.search,
      });
    }),

    get: lawFirmProcedure.input(z.number()).query(async ({ input, ctx }) => {
      const caseData = await getCaseById(input);
      if (!caseData || caseData.lawFirmId !== ctx.lawFirmId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return caseData;
    }),

    create: lawFirmProcedure.input(z.object({
      caseNumber: z.string(),
      clientId: z.number(),
      lawyerId: z.number(),
      title: z.string(),
      description: z.string().optional(),
      caseType: z.enum(["civil", "criminal", "commercial", "family", "administrative", "labor", "other"]),
      courtName: z.string().optional(),
      judge: z.string().optional(),
      oppositeParty: z.string().optional(),
      filingDate: z.date().optional(),
      nextSessionDate: z.date().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      budget: z.string().optional(),
      matterId: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const newCase = await createCase({
        matterId: input.matterId,
        lawFirmId: ctx.lawFirmId,
        caseNumber: input.caseNumber,
        title: input.title,
        description: input.description || null,
        caseType: input.caseType as any,
        courtName: input.courtName || null,
        judge: input.judge || null,
        oppositeParty: input.oppositeParty || null,
        filingDate: input.filingDate || null,
        nextSessionDate: input.nextSessionDate || null,
        priority: (input.priority || "medium") as any,
        budget: input.budget ? input.budget : null,
        notes: null,
        estimatedClosureDate: null,
        expenditure: "0",
        isDeleted: false,
        partyRole: null,
        status: "open",
      });

      // Log the action
      await createAuditLog({
        matterId: null,
        projectId: null,
        userId: ctx.user.id,
        lawFirmId: ctx.lawFirmId,
        caseId: newCase.id,
        action: "CREATE",
        entityType: "case",
        entityId: newCase.id,
        changes: { created: newCase },
        ipAddress: ctx.req.headers["x-forwarded-for"] as string || null,
      });

      // Notify owner
      await notifyOwner({
        title: "قضية جديدة",
        content: `تم إضافة قضية جديدة: ${input.title} (${input.caseNumber})`,
      });

      return newCase;
    }),

    update: lawFirmProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["open", "pending", "closed", "archived", "suspended"]).optional(),
      nextSessionDate: z.date().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const caseData = await getCaseById(input.id);
      if (!caseData || caseData.lawFirmId !== ctx.lawFirmId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const updated = await updateCase(input.id, {
        title: input.title || caseData.title,
        description: input.description || caseData.description,
        status: input.status as any,
        nextSessionDate: input.nextSessionDate || caseData.nextSessionDate,
        priority: input.priority as any,
        notes: input.notes || caseData.notes,
      });

      // Log the action
      await createAuditLog({
        matterId: null,
        projectId: null,
        userId: ctx.user.id,
        lawFirmId: ctx.lawFirmId,
        caseId: input.id,
        action: "UPDATE",
        entityType: "case",
        entityId: input.id,
        changes: { before: caseData, after: updated },
        ipAddress: ctx.req.headers["x-forwarded-for"] as string || null,
      });

      return updated;
    }),

    delete: lawFirmProcedure.input(z.number()).mutation(async ({ input, ctx }) => {
      const caseData = await getCaseById(input);
      if (!caseData || caseData.lawFirmId !== ctx.lawFirmId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await softDeleteCase(input);

      // Log the action
      await createAuditLog({
        matterId: null,
        projectId: null,
        userId: ctx.user.id,
        lawFirmId: ctx.lawFirmId,
        caseId: input,
        action: "DELETE",
        entityType: "case",
        entityId: input,
        changes: { deleted: caseData },
        ipAddress: ctx.req.headers["x-forwarded-for"] as string || null,
      });

      return { success: true };
    }),
  }),

  // ============ CLIENTS ROUTER ============
  clients: router({
    list: lawFirmProcedure.query(async ({ ctx }) => {
      return getClientsByLawFirm(ctx.lawFirmId);
    }),

    get: lawFirmProcedure.input(z.number()).query(async ({ input, ctx }) => {
      const client = await getClientById(input);
      if (!client || client.lawFirmId !== ctx.lawFirmId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return client;
    }),

    create: lawFirmProcedure.input(z.object({
      name: z.string(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      nationalId: z.string().optional(),
      clientType: z.enum(["individual", "company"]).optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      return createClient({
        lawFirmId: ctx.lawFirmId,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        address: input.address || null,
        city: input.city || null,
        nationalId: input.nationalId || null,
        clientType: (input.clientType || "individual") as any,
        kycStatus: "pending",
        conflictCheckStatus: "pending",
        notes: input.notes || null,
      });
    }),
  }),

  // ============ NOTIFICATIONS ROUTER ============
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserNotifications(ctx.user.id);
    }),

    markAsRead: protectedProcedure.input(z.number()).mutation(async ({ input }) => {
      await markNotificationAsRead(input);
      return { success: true };
    }),
  }),

  // ============ DOCUMENTS ROUTER ============
  documents: router({
    listByCase: lawFirmProcedure.input(z.number()).query(async ({ input, ctx }) => {
      const caseData = await getCaseById(input);
      if (!caseData || caseData.lawFirmId !== ctx.lawFirmId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return getDocumentsByCaseId(input);
    }),
  }),

  // ============ AUDIT LOG ROUTER ============
  auditLogs: router({
    listByCase: lawFirmProcedure.input(z.number()).query(async ({ input, ctx }) => {
      const caseData = await getCaseById(input);
      if (!caseData || caseData.lawFirmId !== ctx.lawFirmId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return getAuditLogsByCaseId(input);
    }),
  }),
});

export type AppRouter = typeof appRouter;
