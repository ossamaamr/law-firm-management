import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { registrationRequests, firmIdentifiers, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  sendRegistrationRequestEmail,
  sendApprovalEmail,
  sendRejectionEmail,
} from "./email.service";

/**
 * Registration and Authentication Routes
 * مسارات التسجيل والمصادقة
 */

// Validation Schemas
const signupSchema = z.object({
  hasExistingIdentifier: z.boolean(),
  firmIdentifier: z.string().optional(),
  fullName: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().email("بريد إلكتروني غير صحيح"),
  phone: z.string().min(10, "رقم الهاتف غير صحيح"),
  birthDate: z.string(),
  firmName: z.string().optional(),
  licenseNumber: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

const loginSchema = z.object({
  firmIdentifier: z.string().regex(/^@[a-zA-Z0-9_-]+#$/, "صيغة المعرف غير صحيحة"),
  userName: z.string().min(2, "اسم المستخدم غير صحيح"),
  password: z.string().min(6, "كلمة المرور قصيرة جداً"),
});

const approveRegistrationSchema = z.object({
  requestId: z.number(),
  firmName: z.string(),
});

const rejectRegistrationSchema = z.object({
  requestId: z.number(),
  rejectionReason: z.string(),
});

const verifyIdentifierSchema = z.object({
  firmIdentifier: z.string().regex(/^@[a-zA-Z0-9_-]+#$/, "صيغة المعرف غير صحيحة"),
});

export const authRouter = router({
  /**
   * Submit registration request
   * تقديم طلب التسجيل
   */
  signup: publicProcedure
    .input(signupSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // If user has existing identifier, verify it
        if (input.hasExistingIdentifier && input.firmIdentifier) {
          const identifier = await db
            .select()
            .from(firmIdentifiers)
            .where(eq(firmIdentifiers.identifier, input.firmIdentifier))
            .limit(1);

          if (identifier.length === 0) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "المعرف غير موجود",
            });
          }

          // TODO: Add user to existing firm
          return {
            success: true,
            message: "تم إضافتك إلى المكتب بنجاح",
            firmId: identifier[0].firmId,
          };
        }

        // Create new registration request
        const result = await db.insert(registrationRequests).values({
          email: input.email,
          fullName: input.fullName,
          phone: input.phone,
          birthDate: new Date(input.birthDate),
          firmName: input.firmName || "",
          licenseNumber: input.licenseNumber,
          city: input.city || "",
          country: input.country || "",
          status: "pending",
          createdAt: new Date(),
        });

        // Send notification email to admin
        await sendRegistrationRequestEmail(
          {
            fullName: input.fullName,
            email: input.email,
            phone: input.phone,
            birthDate: input.birthDate,
            firmName: input.firmName || "غير محدد",
            city: input.city || "غير محدد",
            country: input.country || "غير محدد",
          },
          process.env.OWNER_NAME || "admin@firm.com"
        );

        return {
          success: true,
          message: "تم تقديم طلبك بنجاح. سيتم التواصل معك قريباً",
          requestId: result.insertId,
        };
      } catch (error) {
        console.error("Signup error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "حدث خطأ أثناء التسجيل",
        });
      }
    }),

  /**
   * Login with firm identifier
   * تسجيل الدخول باستخدام معرف المكتب
   */
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // TODO: Verify credentials against database
        // For now, return mock data
        return {
          success: true,
          message: "تم تسجيل الدخول بنجاح",
          user: {
            id: 1,
            name: input.userName,
            email: "user@firm.com",
            firmIdentifier: input.firmIdentifier,
          },
          token: "mock-jwt-token",
        };
      } catch (error) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "بيانات الدخول غير صحيحة",
        });
      }
    }),

  /**
   * Verify if firm identifier exists
   * التحقق من وجود معرف المكتب
   */
  verifyIdentifier: publicProcedure
    .input(verifyIdentifierSchema)
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        const identifier = await db
          .select()
          .from(firmIdentifiers)
          .where(eq(firmIdentifiers.identifier, input.firmIdentifier))
          .limit(1);

        return {
          exists: identifier.length > 0,
          firmId: identifier.length > 0 ? identifier[0].firmId : null,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "حدث خطأ أثناء التحقق",
        });
      }
    }),

  /**
   * Get pending registration requests (Admin only)
   * الحصول على طلبات التسجيل المعلقة (للمسؤول فقط)
   */
  getPendingRequests: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // TODO: Check if user is admin
    try {
      const requests = await db
        .select()
        .from(registrationRequests)
        .where(eq(registrationRequests.status, "pending"));

      return requests;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "حدث خطأ أثناء جلب الطلبات",
      });
    }
  }),

  /**
   * Approve registration request
   * الموافقة على طلب التسجيل
   */
  approveRegistration: protectedProcedure
    .input(approveRegistrationSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // TODO: Check if user is admin
      try {
        // Get registration request
        const request = await db
          .select()
          .from(registrationRequests)
          .where(eq(registrationRequests.id, input.requestId))
          .limit(1);

        if (request.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "الطلب غير موجود",
          });
        }

        const req = request[0];

        // Generate unique identifier
        const identifier = `@${input.firmName.replace(/\s+/g, "_").toLowerCase().substring(0, 15)}#`;

        // TODO: Create firm in database
        // TODO: Create user account
        // TODO: Create firm identifier

        // Update registration request status
        await db
          .update(registrationRequests)
          .set({ status: "approved" })
          .where(eq(registrationRequests.id, input.requestId));

        // Send approval email
        await sendApprovalEmail(
          req.email,
          req.fullName,
          input.firmName,
          identifier
        );

        return {
          success: true,
          message: "تم الموافقة على الطلب وإرسال البريد الإلكتروني",
          identifier,
        };
      } catch (error) {
        console.error("Approval error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "حدث خطأ أثناء الموافقة على الطلب",
        });
      }
    }),

  /**
   * Reject registration request
   * رفض طلب التسجيل
   */
  rejectRegistration: protectedProcedure
    .input(rejectRegistrationSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // TODO: Check if user is admin
      try {
        // Get registration request
        const request = await db
          .select()
          .from(registrationRequests)
          .where(eq(registrationRequests.id, input.requestId))
          .limit(1);

        if (request.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "الطلب غير موجود",
          });
        }

        const req = request[0];

        // Update registration request status
        await db
          .update(registrationRequests)
          .set({ status: "rejected" })
          .where(eq(registrationRequests.id, input.requestId));

        // Send rejection email
        await sendRejectionEmail(
          req.email,
          req.fullName,
          input.rejectionReason
        );

        return {
          success: true,
          message: "تم رفض الطلب وإرسال البريد الإلكتروني",
        };
      } catch (error) {
        console.error("Rejection error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "حدث خطأ أثناء رفض الطلب",
        });
      }
    }),
});
