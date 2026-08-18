import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const unavailable = () => {
  throw new TRPCError({
    code: "PRECONDITION_FAILED",
    message: "استخدم تسجيل الدخول الموحد للمنصة؛ تسجيل الدخول المحلي غير مفعّل.",
  });
};

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => ctx.user),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  signup: publicProcedure.input(z.object({
    hasExistingIdentifier: z.boolean(),
    firmIdentifier: z.string().optional(),
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    birthDate: z.string(),
    firmName: z.string().optional(),
    licenseNumber: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  })).mutation(() => unavailable()),
  login: publicProcedure.input(z.object({
    firmIdentifier: z.string().min(1),
    userName: z.string().min(2),
    password: z.string().min(6),
  })).mutation(() => unavailable()),
  verifyIdentifier: publicProcedure
    .input(z.object({ firmIdentifier: z.string().min(1) }))
    .query(() => unavailable()),
  getPendingRequests: protectedProcedure.query(() => unavailable()),
  approveRegistration: protectedProcedure
    .input(z.object({ requestId: z.number(), firmName: z.string().min(1) }))
    .mutation(() => unavailable()),
  rejectRegistration: protectedProcedure
    .input(z.object({ requestId: z.number(), rejectionReason: z.string().min(1) }))
    .mutation(() => unavailable()),
});
