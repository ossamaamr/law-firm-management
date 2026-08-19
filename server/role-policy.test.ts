import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { roleProcedure, router } from "./_core/trpc";

const policyRouter = router({
  mutate: roleProcedure(["admin", "manager", "lawyer"] as const).mutation(({ ctx }) => ({
    lawFirmId: ctx.lawFirmId,
    role: ctx.user.role,
  })),
  compliance: roleProcedure(["admin", "manager"] as const).mutation(({ ctx }) => ({
    lawFirmId: ctx.lawFirmId,
    role: ctx.user.role,
  })),
});

function context(role: "admin" | "manager" | "lawyer" | "accountant" | "user", lawFirmId: number | null) {
  return {
    user: {
      id: 1,
      openId: `test-${role}`,
      name: role,
      email: `${role}@test.invalid`,
      role,
      lawFirmId,
      loginMethod: "test",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {},
    res: {},
  } as any;
}

describe("least-privilege role procedures", () => {
  it("allows a lawyer to access team procedures within a firm", async () => {
    await expect(policyRouter.createCaller(context("lawyer", 7)).mutate()).resolves.toEqual({
      lawFirmId: 7,
      role: "lawyer",
    });
  });

  it("rejects an accountant from legal team procedures", async () => {
    await expect(policyRouter.createCaller(context("accountant", 7)).mutate()).rejects.toMatchObject<Partial<TRPCError>>({
      code: "FORBIDDEN",
    });
  });

  it("rejects a lawyer from compliance procedures", async () => {
    await expect(policyRouter.createCaller(context("lawyer", 7)).compliance()).rejects.toMatchObject<Partial<TRPCError>>({
      code: "FORBIDDEN",
    });
  });

  it("rejects a role without tenant assignment before role evaluation", async () => {
    await expect(policyRouter.createCaller(context("admin", null)).mutate()).rejects.toMatchObject<Partial<TRPCError>>({
      code: "FORBIDDEN",
    });
  });
});
