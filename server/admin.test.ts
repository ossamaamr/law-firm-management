import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getUsersByLawFirm: vi.fn(),
  getUserById: vi.fn(),
  updateUserRoleInLawFirm: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return {
    ...actual,
    getUsersByLawFirm: dbMocks.getUsersByLawFirm,
    getUserById: dbMocks.getUserById,
    updateUserRoleInLawFirm: dbMocks.updateUserRoleInLawFirm,
    getDb: dbMocks.getDb,
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
const lawyer = { ...admin, id: 3, openId: "lawyer-open-id", role: "lawyer" as const };

describe("Admin Control Center authorization contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getUsersByLawFirm.mockResolvedValue([admin, manager, lawyer]);
    dbMocks.getUserById.mockResolvedValue(lawyer);
    dbMocks.updateUserRoleInLawFirm.mockResolvedValue({ ...lawyer, role: "accountant" });
    dbMocks.getDb.mockResolvedValue(null);
  });

  it("rejects ordinary users from listing firm users", async () => {
    await expect(appRouter.createCaller(context(lawyer)).admin.users.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(dbMocks.getUsersByLawFirm).not.toHaveBeenCalled();
  });

  it("lists only the authenticated firm's users", async () => {
    const result = await appRouter.createCaller(context(admin)).admin.users.list();
    expect(result).toHaveLength(3);
    expect(dbMocks.getUsersByLawFirm).toHaveBeenCalledWith(101);
    expect(result[0]).not.toHaveProperty("openId");
  });

  it("prevents managers from assigning administrative roles", async () => {
    dbMocks.getUserById.mockResolvedValue({ ...lawyer, lawFirmId: 101 });
    await expect(
      appRouter.createCaller(context(manager)).admin.users.updateRole({ userId: 3, role: "admin" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(dbMocks.updateUserRoleInLawFirm).not.toHaveBeenCalled();
  });

  it("prevents a user from changing their own role", async () => {
    dbMocks.getUserById.mockResolvedValue(admin);
    await expect(
      appRouter.createCaller(context(admin)).admin.users.updateRole({ userId: 1, role: "manager" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(dbMocks.updateUserRoleInLawFirm).not.toHaveBeenCalled();
  });

  it("does not remove the only admin from a firm", async () => {
    dbMocks.getUserById.mockResolvedValue(admin);
    dbMocks.getUsersByLawFirm.mockResolvedValue([admin, lawyer]);
    await expect(
      appRouter.createCaller(context(manager)).admin.users.updateRole({ userId: 1, role: "lawyer" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(dbMocks.updateUserRoleInLawFirm).not.toHaveBeenCalled();
  });
});
