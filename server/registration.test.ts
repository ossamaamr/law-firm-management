import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getLawFirmByIdentifier: vi.fn(),
  getRegistrationRequestsByLawFirm: vi.fn(),
  getRegistrationRequestsByUser: vi.fn(),
  createRegistrationRequest: vi.fn(),
  reviewRegistrationRequest: vi.fn(),
  getUserById: vi.fn(),
  assignUserToLawFirm: vi.fn(),
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, ...dbMocks };
});

vi.mock("./activity.service", async () => {
  const actual = await vi.importActual<typeof import("./activity.service")>("./activity.service");
  return { ...actual, logActivity: vi.fn() };
});

import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as any, res: {} as any };
}

const admin = {
  id: 1, openId: "admin-open-id", name: "Admin", email: "admin@example.com", role: "admin" as const,
  lawFirmId: 101, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
};
const unassigned = { ...admin, id: 8, openId: "new-open-id", name: "New User", email: "new@example.com", role: "user" as const, lawFirmId: null };
const firm = { id: 101, name: "Firm A", identifier: "@firm-a#" };
const pending = {
  id: 5, lawFirmId: 101, requesterUserId: 8, fullName: "New User", email: "new@example.com", phone: null,
  requestedRole: "lawyer" as const, status: "pending" as const, rejectionReason: null, reviewedById: null,
  reviewedAt: null, createdAt: new Date(), updatedAt: new Date(),
};

describe("registration request authorization contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getLawFirmByIdentifier.mockResolvedValue(firm);
    dbMocks.getRegistrationRequestsByUser.mockResolvedValue([]);
    dbMocks.getRegistrationRequestsByLawFirm.mockResolvedValue([pending]);
    dbMocks.createRegistrationRequest.mockResolvedValue(pending);
    dbMocks.getUserById.mockResolvedValue(unassigned);
    dbMocks.assignUserToLawFirm.mockResolvedValue({ ...unassigned, lawFirmId: 101, role: "lawyer" });
    dbMocks.reviewRegistrationRequest.mockResolvedValue({ ...pending, status: "approved", reviewedById: 1 });
  });

  it("requires authentication to submit a join request", async () => {
    await expect(appRouter.createCaller(context(null)).registration.requestToJoin({
      firmIdentifier: "@firm-a#", fullName: "New User", requestedRole: "user",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("creates a request using the authenticated email and resolved firm identifier", async () => {
    const result = await appRouter.createCaller(context(unassigned)).registration.requestToJoin({
      firmIdentifier: "@firm-a#", fullName: "New User", requestedRole: "lawyer",
    });
    expect(result).toEqual({ id: 5, status: "pending", firmName: "Firm A" });
    expect(dbMocks.createRegistrationRequest).toHaveBeenCalledWith(expect.objectContaining({
      lawFirmId: 101, requesterUserId: 8, email: "new@example.com", requestedRole: "lawyer",
    }));
  });

  it("does not allow an already assigned user to submit a join request", async () => {
    await expect(appRouter.createCaller(context(admin)).registration.requestToJoin({
      firmIdentifier: "@firm-a#", fullName: "Admin", requestedRole: "user",
    })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(dbMocks.createRegistrationRequest).not.toHaveBeenCalled();
  });

  it("approves only a request whose requester is still unassigned", async () => {
    const result = await appRouter.createCaller(context(admin)).admin.registrationRequests.approve({ requestId: 5 });
    expect(result).toEqual({ success: true, userId: 8, status: "approved" });
    expect(dbMocks.assignUserToLawFirm).toHaveBeenCalledWith(8, 101, "lawyer");
    expect(dbMocks.reviewRegistrationRequest).toHaveBeenCalledWith(101, 5, "approved", 1);
  });

  it("rejects requests outside the authenticated firm's list", async () => {
    dbMocks.getRegistrationRequestsByLawFirm.mockResolvedValue([]);
    await expect(appRouter.createCaller(context(admin)).admin.registrationRequests.reject({
      requestId: 999, rejectionReason: "لا توجد علاقة عمل موثقة",
    })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(dbMocks.reviewRegistrationRequest).not.toHaveBeenCalled();
  });
});
