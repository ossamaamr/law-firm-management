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

  signup: publicProcedure.input(z.record(z.string(), z.unknown())).mutation(() => unavailable()),
  login: publicProcedure.input(z.record(z.string(), z.unknown())).mutation(() => unavailable()),
  verifyIdentifier: publicProcedure
    .input(z.object({ firmIdentifier: z.string().min(1) }))
    .query(() => unavailable()),
  getPendingRequests: protectedProcedure.query(() => unavailable()),
  approveRegistration: protectedProcedure
    .input(z.record(z.string(), z.unknown()))
    .mutation(() => unavailable()),
  rejectRegistration: protectedProcedure
    .input(z.record(z.string(), z.unknown()))
    .mutation(() => unavailable()),
});
