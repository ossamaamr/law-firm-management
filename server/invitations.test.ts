import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getInvitationsByLawFirm: vi.fn(),
  getInvitationByTokenHash: vi.fn(),
  createUserInvitation: vi.fn(),
  revokeUserInvitation: vi.fn(),
  assignUserToLawFirm: vi.fn(),
  markInvitationAccepted: vi.fn(),
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return {
    ...actual,
    getInvitationsByLawFirm: dbMocks.getInvitationsByLawFirm,
    getInvitationByTokenHash: dbMocks.getInvitationByTokenHash,
    createUserInvitation: dbMocks.createUserInvitation,
    revokeUserInvitation: dbMocks.revokeUserInvitation,
    assignUserToLawFirm: dbMocks.assignUserToLawFirm,
    markInvitationAccepted: dbMocks.markInvitationAccepted,
  };
});

vi.mock("./activity.service", async () => {
  const actual = await vi.importActual<typeof import("./activity.service")>("./activity.service");
  return { ...actual, logActivity: vi.fn() };
});

import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

const admin = {
  id: 1,
  openId: "admin-open-id",
  name: "Admin",
  email: "admin@example.com",
  role: "admin" as const,
  lawFirmId: 101,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const manager = { ...admin, id: 2, openId: "manager-open-id", role: "manager" as const };
const pendingInvitation = {
  id: 44,
  lawFirmId: 101,
  invitedEmail: "new@example.com",
  role: "lawyer" as const,
  tokenHash: "hash",
  invitedById: 1,
  acceptedById: null,
  status: "pending" as const,
  expiresAt: new Date(Date.now() + 60_000),
  acceptedAt: null,
  revokedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("user invitation authorization contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getInvitationsByLawFirm.mockResolvedValue([]);
    dbMocks.createUserInvitation.mockResolvedValue(pendingInvitation);
    dbMocks.getInvitationByTokenHash.mockResolvedValue(pendingInvitation);
    dbMocks.assignUserToLawFirm.mockResolvedValue({ id: 8, lawFirmId: 101, role: "lawyer" });
  });

  it("prevents managers from inviting administrative roles", async () => {
    await expect(
      appRouter.createCaller(context(manager)).admin.invitations.create({
        invitedEmail: "new@example.com",
        role: "manager",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(dbMocks.createUserInvitation).not.toHaveBeenCalled();
  });

  it("returns a one-time token but never returns its persisted hash", async () => {
    const result = await appRouter.createCaller(context(admin)).admin.invitations.create({
      invitedEmail: "NEW@example.com",
      role: "lawyer",
    });

    expect(result.token).toMatch(/^[a-f0-9]{64}$/);
    expect(result.invitePath).toBe(`/invite/${result.token}`);
    expect(result).not.toHaveProperty("tokenHash");
    expect(dbMocks.createUserInvitation).toHaveBeenCalledWith(expect.objectContaining({
      lawFirmId: 101,
      invitedEmail: "new@example.com",
      role: "lawyer",
      tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
  });

  it("rejects acceptance when the authenticated email does not match", async () => {
    await expect(
      appRouter.createCaller(context({ ...admin, id: 8, email: "wrong@example.com", lawFirmId: null })).invitations.accept({
        token: "a".repeat(64),
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(dbMocks.assignUserToLawFirm).not.toHaveBeenCalled();
  });

  it("accepts a valid invitation for an unassigned matching account", async () => {
    const result = await appRouter.createCaller(context({ ...admin, id: 8, email: "new@example.com", lawFirmId: null })).invitations.accept({
      token: "a".repeat(64),
    });

    expect(result).toEqual({ success: true, lawFirmId: 101, role: "lawyer" });
    expect(dbMocks.assignUserToLawFirm).toHaveBeenCalledWith(8, 101, "lawyer");
    expect(dbMocks.markInvitationAccepted).toHaveBeenCalledWith(44, 8);
  });

  it("rejects expired invitations", async () => {
    dbMocks.getInvitationByTokenHash.mockResolvedValue({
      ...pendingInvitation,
      expiresAt: new Date(Date.now() - 1),
    });
    await expect(
      appRouter.createCaller(context({ ...admin, id: 8, email: "new@example.com", lawFirmId: null })).invitations.accept({
        token: "a".repeat(64),
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMocks.assignUserToLawFirm).not.toHaveBeenCalled();
  });
});
