import { COOKIE_NAME } from "@shared/const";
import { sql } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, roleProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getCasesByLawFirm, getCaseById, createCase, updateCase, softDeleteCase,
  getClientsByLawFirm, getClientById, createClient, updateClientInLawFirm, deleteClientInLawFirm,
  getSessionsByCaseId, getUpcomingSessions, createCourtSession,
  getDocumentsByCaseId, createDocument, deleteDocument,
  getUserNotifications, createNotification, markNotificationAsRead,
  getAuditLogsByCaseId, createAuditLog,
  getLawFirmById, getUsersByLawFirm, getUserById, getMatterById, getMattersByLawFirm,
  getDocumentById, getBrandingSettings, upsertBrandingSettings,
  updateUserRoleInLawFirm, getDb,
  getInvitationsByLawFirm, getInvitationByTokenHash, createUserInvitation,
  revokeUserInvitation, assignUserToLawFirm, markInvitationAccepted,
  getLawFirmByIdentifier, getRegistrationRequestsByLawFirm, getRegistrationRequestsByUser,
  createRegistrationRequest, reviewRegistrationRequest, approveRegistrationRequestAtomically, searchLawFirm,
  getLedgerEntriesByLawFirm, appendInvoiceIssuedLedgerEntry,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { authRouter } from "./auth.routes";
import { activityRouter } from "./activity.routes";
import { getDashboardSummary } from "./dashboard.service";
import { storageGet } from "./storage";
import { toSafeDocumentMetadata } from "./document-security";
import { logActivity } from "./activity.service";
import { ENV } from "./_core/env";

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

const adminLawFirmProcedure = lawFirmProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

const caseTeamProcedure = roleProcedure(["admin", "manager", "lawyer"] as const);
const complianceProcedure = roleProcedure(["admin", "manager"] as const);

const financeProcedure = lawFirmProcedure.use(async ({ ctx, next }) => {
  if (!["admin", "manager", "accountant"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Financial access required" });
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

  search: router({
    list: lawFirmProcedure.input(z.object({
      query: z.string().trim().min(2).max(200),
      limit: z.number().int().min(1).max(100).default(30),
      offset: z.number().int().min(0).max(100000).default(0),
    })).query(({ input, ctx }) => searchLawFirm(ctx.lawFirmId, input.query, input)),
  }),

  dashboard: router({
    summary: lawFirmProcedure
      .input(z.object({
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
      }).optional())
      .query(({ input, ctx }) => getDashboardSummary(ctx.lawFirmId, input ?? {})),
  }),

  invitations: router({
    accept: protectedProcedure.input(z.object({ token: z.string().regex(/^[a-f0-9]{64}$/i) })).mutation(async ({ input, ctx }) => {
      if (!ctx.user.email) throw new TRPCError({ code: "BAD_REQUEST", message: "Authenticated email is required" });
      const tokenHash = createHash("sha256").update(input.token).digest("hex");
      const invitation = await getInvitationByTokenHash(tokenHash);
      if (!invitation || invitation.status !== "pending") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation is invalid or no longer active" });
      }
      if (invitation.expiresAt.getTime() <= Date.now()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation has expired" });
      }
      if (ctx.user.lawFirmId) {
        throw new TRPCError({ code: "CONFLICT", message: "User is already assigned to a law firm" });
      }
      if (ctx.user.email.trim().toLowerCase() !== invitation.invitedEmail) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Invitation email does not match the authenticated account" });
      }
      const joined = await assignUserToLawFirm(ctx.user.id, invitation.lawFirmId, invitation.role);
      if (!joined || joined.lawFirmId !== invitation.lawFirmId) {
        throw new TRPCError({ code: "CONFLICT", message: "Invitation could not be accepted" });
      }
      await markInvitationAccepted(invitation.id, ctx.user.id);
      await logActivity({
        firmId: invitation.lawFirmId,
        userId: ctx.user.id,
        actionType: "update",
        entityType: "user_invitation",
        entityId: invitation.id,
        entityName: invitation.invitedEmail,
        changes: { after: { status: "accepted", userId: ctx.user.id, role: invitation.role } },
        ipAddress: ctx.req.headers["x-forwarded-for"] as string || undefined,
      });
      return { success: true, lawFirmId: invitation.lawFirmId, role: invitation.role } as const;
    }),
  }),

  registration: router({
    mine: protectedProcedure.query(async ({ ctx }) => {
      return getRegistrationRequestsByUser(ctx.user.id);
    }),
    requestToJoin: protectedProcedure.input(z.object({
      firmIdentifier: z.string().trim().regex(/^@[a-zA-Z0-9_-]+#$/),
      fullName: z.string().trim().min(2).max(255),
      phone: z.string().trim().max(32).optional(),
      requestedRole: z.enum(["lawyer", "accountant", "user"]).default("user"),
    })).mutation(async ({ input, ctx }) => {
      if (ctx.user.lawFirmId) {
        throw new TRPCError({ code: "CONFLICT", message: "User is already assigned to a law firm" });
      }
      if (!ctx.user.email) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Authenticated email is required" });
      }
      const firm = await getLawFirmByIdentifier(input.firmIdentifier);
      if (!firm) throw new TRPCError({ code: "NOT_FOUND", message: "Law firm identifier was not found" });
      const previous = await getRegistrationRequestsByUser(ctx.user.id);
      const active = previous.find(request => request.lawFirmId === firm.id && request.status === "pending");
      if (active) throw new TRPCError({ code: "CONFLICT", message: "A pending request already exists" });
      const created = await createRegistrationRequest({
        lawFirmId: firm.id,
        requesterUserId: ctx.user.id,
        fullName: input.fullName,
        email: ctx.user.email.trim().toLowerCase(),
        phone: input.phone || null,
        requestedRole: input.requestedRole,
        status: "pending",
      });
      await logActivity({
        firmId: firm.id,
        userId: ctx.user.id,
        actionType: "create",
        entityType: "registration_request",
        entityId: created.id,
        entityName: created.email,
        changes: { after: { status: created.status, requestedRole: created.requestedRole } },
        ipAddress: ctx.req.headers["x-forwarded-for"] as string || undefined,
      });
      return { id: created.id, status: created.status, firmName: firm.name } as const;
    }),
  }),

  admin: router({
    registrationRequests: router({
      list: adminLawFirmProcedure.query(async ({ ctx }) => {
        const requests = await getRegistrationRequestsByLawFirm(ctx.lawFirmId);
        return requests.map(request => ({
          id: request.id,
          fullName: request.fullName,
          email: request.email,
          phone: request.phone,
          requestedRole: request.requestedRole,
          status: request.status,
          rejectionReason: request.rejectionReason,
          createdAt: request.createdAt,
          reviewedAt: request.reviewedAt,
        }));
      }),
      approve: adminLawFirmProcedure.input(z.object({ requestId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
        const requests = await getRegistrationRequestsByLawFirm(ctx.lawFirmId);
        const request = requests.find(item => item.id === input.requestId);
        if (!request || request.status !== "pending") throw new TRPCError({ code: "NOT_FOUND", message: "Pending request not found" });
        const approved = await approveRegistrationRequestAtomically(ctx.lawFirmId, request.id, ctx.user.id);
        if (!approved) throw new TRPCError({ code: "CONFLICT", message: "Requester is no longer eligible or request was already reviewed" });
        const target = approved.user;
        const reviewed = approved.request;
        await logActivity({
          firmId: ctx.lawFirmId,
          userId: ctx.user.id,
          actionType: "update",
          entityType: "registration_request",
          entityId: request.id,
          entityName: request.email,
          changes: { before: { status: request.status }, after: { status: reviewed.status, userId: target.id, role: request.requestedRole } },
          ipAddress: ctx.req.headers["x-forwarded-for"] as string || undefined,
        });
        return { success: true, userId: target.id, status: reviewed.status } as const;
      }),
      reject: adminLawFirmProcedure.input(z.object({
        requestId: z.number().int().positive(),
        rejectionReason: z.string().trim().min(2).max(500),
      })).mutation(async ({ input, ctx }) => {
        const requests = await getRegistrationRequestsByLawFirm(ctx.lawFirmId);
        const request = requests.find(item => item.id === input.requestId);
        if (!request || request.status !== "pending") throw new TRPCError({ code: "NOT_FOUND", message: "Pending request not found" });
        const reviewed = await reviewRegistrationRequest(ctx.lawFirmId, request.id, "rejected", ctx.user.id, input.rejectionReason);
        if (!reviewed) throw new TRPCError({ code: "CONFLICT", message: "Request could not be reviewed" });
        await logActivity({
          firmId: ctx.lawFirmId,
          userId: ctx.user.id,
          actionType: "update",
          entityType: "registration_request",
          entityId: request.id,
          entityName: request.email,
          changes: { before: { status: request.status }, after: { status: reviewed.status, rejectionReason: reviewed.rejectionReason } },
          ipAddress: ctx.req.headers["x-forwarded-for"] as string || undefined,
        });
        return { success: true, status: reviewed.status } as const;
      }),
    }),
    invitations: router({
      list: adminLawFirmProcedure.query(async ({ ctx }) => {
        const invitations = await getInvitationsByLawFirm(ctx.lawFirmId);
        return invitations.map(invitation => ({
          id: invitation.id,
          invitedEmail: invitation.invitedEmail,
          role: invitation.role,
          status: invitation.status === "pending" && invitation.expiresAt.getTime() <= Date.now() ? "expired" as const : invitation.status,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
        }));
      }),
      create: adminLawFirmProcedure.input(z.object({
        invitedEmail: z.string().trim().toLowerCase().email(),
        role: z.enum(["admin", "manager", "lawyer", "accountant", "user"]),
      })).mutation(async ({ input, ctx }) => {
        if (ctx.user.role === "manager" && (input.role === "admin" || input.role === "manager")) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Managers cannot invite administrative roles" });
        }
        const existing = await getInvitationsByLawFirm(ctx.lawFirmId);
        const duplicate = existing.find(invitation => invitation.status === "pending" && invitation.invitedEmail === input.invitedEmail && invitation.expiresAt.getTime() > Date.now());
        if (duplicate) throw new TRPCError({ code: "CONFLICT", message: "An active invitation already exists for this email" });

        const token = randomBytes(32).toString("hex");
        const invitation = await createUserInvitation({
          lawFirmId: ctx.lawFirmId,
          invitedEmail: input.invitedEmail,
          role: input.role,
          tokenHash: createHash("sha256").update(token).digest("hex"),
          invitedById: ctx.user.id,
          status: "pending",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        await logActivity({
          firmId: ctx.lawFirmId,
          userId: ctx.user.id,
          actionType: "create",
          entityType: "user_invitation",
          entityId: invitation.id,
          entityName: invitation.invitedEmail,
          changes: { after: { invitedEmail: invitation.invitedEmail, role: invitation.role, expiresAt: invitation.expiresAt } },
          ipAddress: ctx.req.headers["x-forwarded-for"] as string || undefined,
        });
        return {
          id: invitation.id,
          invitedEmail: invitation.invitedEmail,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
          token,
          invitePath: `/invite/${token}`,
        } as const;
      }),
      revoke: adminLawFirmProcedure.input(z.object({ invitationId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
        const invitations = await getInvitationsByLawFirm(ctx.lawFirmId);
        const invitation = invitations.find(item => item.id === input.invitationId);
        if (!invitation) throw new TRPCError({ code: "NOT_FOUND" });
        if (invitation.status !== "pending") throw new TRPCError({ code: "CONFLICT", message: "Only pending invitations can be revoked" });
        await revokeUserInvitation(ctx.lawFirmId, input.invitationId);
        await logActivity({
          firmId: ctx.lawFirmId,
          userId: ctx.user.id,
          actionType: "delete",
          entityType: "user_invitation",
          entityId: invitation.id,
          entityName: invitation.invitedEmail,
          changes: { before: { status: invitation.status }, after: { status: "revoked" } },
          ipAddress: ctx.req.headers["x-forwarded-for"] as string || undefined,
        });
        return { success: true } as const;
      }),
    }),

    users: router({
      list: adminLawFirmProcedure.query(async ({ ctx }) => {
        const users = await getUsersByLawFirm(ctx.lawFirmId);
        return users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          lawFirmId: user.lawFirmId,
          createdAt: user.createdAt,
          lastSignedIn: user.lastSignedIn,
        }));
      }),
      updateRole: adminLawFirmProcedure.input(z.object({
        userId: z.number().int().positive(),
        role: z.enum(["admin", "manager", "lawyer", "accountant", "user"]),
      })).mutation(async ({ input, ctx }) => {
        const target = await getUserById(input.userId);
        if (!target || target.lawFirmId !== ctx.lawFirmId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        if (target.id === ctx.user.id && input.role !== ctx.user.role) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You cannot change your own role" });
        }
        if (ctx.user.role === "manager" && (input.role === "admin" || input.role === "manager")) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Managers cannot assign administrative roles" });
        }
        if (target.role === "admin" && input.role !== "admin") {
          const users = await getUsersByLawFirm(ctx.lawFirmId);
          if (users.filter(user => user.role === "admin").length <= 1) {
            throw new TRPCError({ code: "CONFLICT", message: "The firm must retain at least one admin" });
          }
        }

        const updated = await updateUserRoleInLawFirm(input.userId, ctx.lawFirmId, input.role);
        if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
        await logActivity({
          firmId: ctx.lawFirmId,
          userId: ctx.user.id,
          actionType: "update",
          entityType: "user_role",
          entityId: updated.id,
          entityName: updated.email || updated.name || String(updated.id),
          changes: {
            before: { role: target.role },
            after: { role: updated.role },
          },
          ipAddress: ctx.req.headers["x-forwarded-for"] as string || undefined,
        });
        return {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
          lawFirmId: updated.lawFirmId,
          createdAt: updated.createdAt,
          lastSignedIn: updated.lastSignedIn,
        };
      }),
    }),
    health: adminLawFirmProcedure.query(async () => {
      const startedAt = Date.now();
      const db = await getDb();
      let database: "ok" | "unavailable" | "error" = "unavailable";
      if (db) {
        try {
          await db.execute(sql`SELECT 1`);
          database = "ok";
        } catch {
          database = "error";
        }
      }
      const storage = ENV.forgeApiUrl && ENV.forgeApiKey ? "configured" : "unconfigured";
      return {
        status: database === "ok" && storage === "configured" ? "healthy" : "degraded",
        database,
        storage,
        environment: process.env.NODE_ENV || "development",
        responseTimeMs: Date.now() - startedAt,
      } as const;
    }),
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

  // ============ MATTERS AND MEMBERS SELECTORS ============
  matters: router({
    list: lawFirmProcedure.query(async ({ ctx }) => {
      const rows = await getMattersByLawFirm(ctx.lawFirmId);
      return rows.filter((matter) => matter.status !== "archived");
    }),
  }),
  members: router({
    list: lawFirmProcedure.query(async ({ ctx }) => {
      const rows = await getUsersByLawFirm(ctx.lawFirmId);
      return rows
        .filter((member) => member.role === "admin" || member.role === "manager" || member.role === "lawyer")
        .map(({ id, name, role }) => ({ id, name, role }));
    }),
  }),

  // ============ CASES ROUTER ============
  cases: router({
    list: caseTeamProcedure.input(z.object({
      status: z.string().optional(),
      search: z.string().trim().max(200).optional(),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).max(100000).default(0),
    }).default({ limit: 50, offset: 0 })).query(async ({ input, ctx }) => {
      return getCasesByLawFirm(ctx.lawFirmId, {
        status: input.status,
        search: input.search,
        limit: input.limit,
        offset: input.offset,
      });
    }),

    get: caseTeamProcedure.input(z.number()).query(async ({ input, ctx }) => {
      const caseData = await getCaseById(input);
      if (!caseData || caseData.lawFirmId !== ctx.lawFirmId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return caseData;
    }),

    create: caseTeamProcedure.input(z.object({
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

      // Notification is a non-critical side effect; durable case creation must not fail when the optional service is unavailable.
      try {
        await notifyOwner({
          title: "قضية جديدة",
          content: `تم إضافة قضية جديدة: ${input.title} (${input.caseNumber})`,
        });
      } catch (error) {
        console.warn("[Notification] Case notification was not delivered", error);
      }

      return newCase;
    }),

    update: caseTeamProcedure.input(z.object({
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

      const updated = await updateCase(input.id, ctx.lawFirmId, {
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

    delete: caseTeamProcedure.input(z.number()).mutation(async ({ input, ctx }) => {
      const caseData = await getCaseById(input);
      if (!caseData || caseData.lawFirmId !== ctx.lawFirmId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const deleted = await softDeleteCase(input, ctx.lawFirmId);
      if (!deleted) throw new TRPCError({ code: "NOT_FOUND" });

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
    list: caseTeamProcedure.input(z.object({
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).max(100000).default(0),
    }).default({ limit: 50, offset: 0 })).query(async ({ input, ctx }) => {
      return getClientsByLawFirm(ctx.lawFirmId, input);
    }),

    get: caseTeamProcedure.input(z.number()).query(async ({ input, ctx }) => {
      const client = await getClientById(input);
      if (!client || client.lawFirmId !== ctx.lawFirmId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return client;
    }),

    create: caseTeamProcedure.input(z.object({
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

    delete: caseTeamProcedure.input(z.number().int().positive()).mutation(async ({ input, ctx }) => {
      const current = await getClientById(input);
      if (!current || current.lawFirmId !== ctx.lawFirmId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const deleted = await deleteClientInLawFirm(input, ctx.lawFirmId);
      if (!deleted) throw new TRPCError({ code: "NOT_FOUND" });
      await logActivity({
        firmId: ctx.lawFirmId,
        userId: ctx.user.id,
        actionType: "delete",
        entityType: "client",
        entityId: input,
        entityName: current.name,
      });
      return { success: true } as const;
    }),
    update: caseTeamProcedure.input(z.object({
      id: z.number().int().positive(),
      name: z.string().min(1).optional(),
      email: z.string().email().nullable().optional(),
      phone: z.string().nullable().optional(),
      address: z.string().nullable().optional(),
      city: z.string().nullable().optional(),
      nationalId: z.string().nullable().optional(),
      clientType: z.enum(["individual", "company"]).optional(),
      kycStatus: z.enum(["pending", "approved", "rejected"]).optional(),
      conflictCheckStatus: z.enum(["pending", "clear", "conflict"]).optional(),
      notes: z.string().nullable().optional(),
    })).mutation(async ({ input, ctx }) => {
      const current = await getClientById(input.id);
      if (!current || current.lawFirmId !== ctx.lawFirmId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const { id, ...changes } = input;
      const updated = await updateClientInLawFirm(id, ctx.lawFirmId, changes);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

    conflictCheck: complianceProcedure.input(z.number().int().positive()).mutation(async ({ input, ctx }) => {
      const current = await getClientById(input);
      if (!current || current.lawFirmId !== ctx.lawFirmId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const updated = await updateClientInLawFirm(input, ctx.lawFirmId, { conflictCheckStatus: "pending" });
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

    kycCheck: complianceProcedure.input(z.number().int().positive()).mutation(async ({ input, ctx }) => {
      const current = await getClientById(input);
      if (!current || current.lawFirmId !== ctx.lawFirmId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const updated = await updateClientInLawFirm(input, ctx.lawFirmId, { kycStatus: "pending" });
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),
  }),

  // ============ IMMUTABLE FINANCIAL LEDGER ============
  ledger: router({
    list: financeProcedure.input(z.object({
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).max(100000).default(0),
    }).default({ limit: 50, offset: 0 })).query(async ({ input, ctx }) => {
      return getLedgerEntriesByLawFirm(ctx.lawFirmId, input);
    }),
    recordInvoiceIssued: financeProcedure.input(z.object({
      invoiceId: z.number().int().positive(),
    })).mutation(async ({ input, ctx }) => {
      return appendInvoiceIssuedLedgerEntry({
        invoiceId: input.invoiceId,
        lawFirmId: ctx.lawFirmId,
        createdById: ctx.user.id,
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
    listByCase: caseTeamProcedure.input(z.number()).query(async ({ input, ctx }) => {
      const caseData = await getCaseById(input);
      if (!caseData || caseData.lawFirmId !== ctx.lawFirmId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const documents = await getDocumentsByCaseId(input, ctx.lawFirmId);
      return documents.map(toSafeDocumentMetadata);
    }),

    delete: caseTeamProcedure.input(z.number().int().positive()).mutation(async ({ input, ctx }) => {
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

    getDownloadUrl: caseTeamProcedure.input(z.number().int().positive()).query(async ({ input, ctx }) => {
      const document = await getDocumentById(input, ctx.lawFirmId);
      if (!document) throw new TRPCError({ code: "NOT_FOUND" });
      if (document.scanStatus !== "clean") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Document is not cleared for download" });
      }
      if (document.retentionUntil && document.retentionUntil.getTime() <= Date.now()) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Document retention period has expired" });
      }
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
