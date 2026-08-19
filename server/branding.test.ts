import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getBrandingSettings: vi.fn(),
  upsertBrandingSettings: vi.fn(),
  getLawFirmById: vi.fn(),
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return {
    ...actual,
    getBrandingSettings: dbMocks.getBrandingSettings,
    upsertBrandingSettings: dbMocks.upsertBrandingSettings,
    getLawFirmById: dbMocks.getLawFirmById,
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

const manager = {
  id: 10,
  openId: "manager-open-id",
  name: "Manager",
  email: "manager@example.com",
  role: "manager" as const,
  lawFirmId: 21,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const lawyer = { ...manager, id: 11, openId: "lawyer-open-id", role: "lawyer" as const };

describe("Branding authorization and tenant contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getBrandingSettings.mockResolvedValue(undefined);
    dbMocks.getLawFirmById.mockResolvedValue({ id: 21, name: "مكتب الاختبار" });
  });

  it("rejects unauthenticated reads", async () => {
    await expect(appRouter.createCaller(context(null)).branding.get()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("uses the authenticated firm's id for fallback reads", async () => {
    const result = await appRouter.createCaller(context(manager)).branding.get();

    expect(result).toEqual({
      lawFirmId: 21,
      platformNameAr: "مكتب الاختبار",
      platformNameEn: "مكتب الاختبار",
      logoUrl: null,
    });
    expect(dbMocks.getBrandingSettings).toHaveBeenCalledWith(21);
    expect(dbMocks.getLawFirmById).toHaveBeenCalledWith(21);
  });

  it("forbids ordinary users from changing branding", async () => {
    await expect(
      appRouter.createCaller(context(lawyer)).branding.update({
        platformNameAr: "اسم غير مصرح",
        platformNameEn: "Unauthorized",
        logoUrl: null,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    expect(dbMocks.upsertBrandingSettings).not.toHaveBeenCalled();
  });

  it("validates logo URLs and updates only the authenticated firm", async () => {
    await expect(
      appRouter.createCaller(context(manager)).branding.update({
        platformNameAr: "هوية المكتب",
        platformNameEn: "Firm Identity",
        logoUrl: "http://unsafe.example/logo.png",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    dbMocks.upsertBrandingSettings.mockResolvedValue({
      lawFirmId: 21,
      platformNameAr: "هوية المكتب",
      platformNameEn: "Firm Identity",
      logoUrl: "/manus-storage/logo.png",
      updatedById: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await appRouter.createCaller(context(manager)).branding.update({
      platformNameAr: "هوية المكتب",
      platformNameEn: "Firm Identity",
      logoUrl: "/manus-storage/logo.png",
    });

    expect(dbMocks.upsertBrandingSettings).toHaveBeenCalledWith(21, {
      platformNameAr: "هوية المكتب",
      platformNameEn: "Firm Identity",
      logoUrl: "/manus-storage/logo.png",
      updatedById: 10,
    });
    expect(result.lawFirmId).toBe(21);
  });
});
