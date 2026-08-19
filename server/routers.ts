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
  getLawFirmById, getUsersByLawFirm, getUserById, getMatterById,
  getDocumentById, getBrandingSettings, upsertBrandingSettings,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { authRouter } from "./auth.routes";
import { activityRouter } from "./activity.routes";
import { getDashboardSummary } from "./dashboard.service";
import { storageGet } from "./storage";
import { toSafeDocumentMetadata } from "./document-security";
import { logActivity } from "./activity.service";

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

const brandingAdminProcedure = lawFirmProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

const brandingInput = z.object({
  platformNameAr: z.string().trim().min(2).max(120),
  platformNameEn: z.string().trim().min(2).max(120),
  logoUrl: z.string().trim().max(500).nullable().optional(),
}).superRefine((value, ctx) => {
  if (!value.logoUrl) return;
  const isSafeLogoUrl = value.logoUrl.startsWith("/manus-storage/") || value.logoUrl.startsWith("https://");
  if (!isSafeLogoUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["logoUrl"], message: "Logo URL must use HTTPS or platform storage" });
  }
});

// ============ ROUTERS ============

export const appRouter = router({
  system: systemRouter,
  
  auth: authRouter,
  activity: activityRouter,

  dashboard: router({
    summary: lawFirmProcedure
      .input(z.object({
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
      }).optional())
      .query(({ input, ctx }) => getDashboardSummary(ctx.lawFirmId, input ?? {})),
  }),

  branding: router({
    get: lawFirmProcedure.query(async ({ ctx }) => {
      const settings = await getBrandingSettings(ctx.lawFirmId);
      if (settings) {
        return {
          lawFirmId: settings.lawFirmId,
          platformNameAr: settings.platformNameAr,
          platformNameEn: settings.platformNameEn,
          logoUrl: settings.logoUrl,
        };
      }

      const firm = await getLawFirmById(ctx.lawFirmId);
      if (!firm) throw new TRPCError({ code: "NOT_FOUND" });
      return {
        lawFirmId: firm.id,
        platformNameAr: firm.name,
        platformNameEn: firm.name,
        logoUrl: null,
      };
    }),
    update: brandingAdminProcedure.input(brandingInput).mutation(async ({ input, ctx }) => {
      const previous = await getBrandingSettings(ctx.lawFirmId);
      const saved = await upsertBrandingSettings(ctx.lawFirmId, {
        platformNameAr: input.platformNameAr,
        platformNameEn: input.platformNameEn,
        logoUrl: input.logoUrl ?? null,
        updatedById: ctx.user.id,
      });
      await logActivity({
        firmId: ctx.lawFirmId,
        userId: ctx.user.id,
        actionType: "update",
        entityType: "branding",
        entityId: ctx.lawFirmId,
        entityName: input.platformNameAr,
        changes: {
          before: previous ? {
            platformNameAr: previous.platformNameAr,
            platformNameEn: previous.platformNameEn,
            logoUrl: previous.logoUrl,
          } : undefined,
          after: {
            platformNameAr: saved.platformNameAr,
            platformNameEn: saved.platformNameEn,
            logoUrl: saved.logoUrl,
          },
        },
        ipAddress: ctx.req.headers["x-forwarded-for"] as string || undefined,
      });
      return {
        lawFirmId: saved.lawFirmId,
        platformNameAr: saved.platformNameAr,
        platformNameEn: saved.platformNameEn,
        logoUrl: saved.logoUrl,
      };
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
      const [client, matter, lawyer] = await Promise.all([
        getClientById(input.clientId),
        getMatterById(input.matterId),
        getUserById(input.lawyerId),
      ]);

      if (
        !client ||
        client.lawFirmId !== ctx.lawFirmId ||
        !matter ||
        matter.lawFirmId !== ctx.lawFirmId ||
        !lawyer ||
        lawyer.lawFirmId !== ctx.lawFirmId
      ) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Related resource not found" });
      }

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

    markAsRead: protectedProcedure.input(z.number()).mutation(async ({ input, ctx }) => {
      await markNotificationAsRead(input, ctx.user.id);
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
      const documents = await getDocumentsByCaseId(input, ctx.lawFirmId);
      return documents.map(toSafeDocumentMetadata);
    }),

    delete: lawFirmProcedure.input(z.number().int().positive()).mutation(async ({ input, ctx }) => {
      const document = await getDocumentById(input, ctx.lawFirmId);
      if (!document) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteDocument(document.id, ctx.lawFirmId);
      await logActivity({
        firmId: ctx.lawFirmId,
        userId: ctx.user.id,
        actionType: "delete",
        entityType: "document",
        entityId: document.id,
        entityName: document.fileName,
      });
      return { success: true } as const;
    }),

    getDownloadUrl: lawFirmProcedure.input(z.number().int().positive()).query(async ({ input, ctx }) => {
      const document = await getDocumentById(input, ctx.lawFirmId);
      if (!document) throw new TRPCError({ code: "NOT_FOUND" });
      const signed = await storageGet(document.s3Key);
      await logActivity({
        firmId: ctx.lawFirmId,
        userId: ctx.user.id,
        actionType: "download",
        entityType: "document",
        entityId: document.id,
        entityName: document.fileName,
      });
      return {
        document: toSafeDocumentMetadata(document),
        url: signed.url,
        expiresInSeconds: 300,
      };
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
