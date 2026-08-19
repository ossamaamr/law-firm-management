import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createContext: vi.fn(),
  getBrandingSettings: vi.fn(),
  getLawFirmById: vi.fn(),
  upsertBrandingSettings: vi.fn(),
  storagePut: vi.fn(),
  logActivity: vi.fn(),
}));

vi.mock("./_core/context", () => ({ createContext: mocks.createContext }));
vi.mock("./db", () => ({
  getBrandingSettings: mocks.getBrandingSettings,
  getLawFirmById: mocks.getLawFirmById,
  upsertBrandingSettings: mocks.upsertBrandingSettings,
}));
vi.mock("./storage", () => ({ storagePut: mocks.storagePut }));
vi.mock("./activity.service", () => ({ logActivity: mocks.logActivity }));

import { brandingUploadRouter } from "./branding-upload.routes";

const manager = {
  id: 12,
  openId: "firm-a-manager",
  name: "Firm A Manager",
  email: "manager@example.com",
  role: "manager" as const,
  lawFirmId: 101,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function makeApp() {
  const app = express();
  app.use("/api/branding", brandingUploadRouter);
  return app;
}

const validPngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

describe("branding logo upload integration contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createContext.mockResolvedValue({ user: manager, req: { headers: {} } });
    mocks.getBrandingSettings.mockResolvedValue({
      lawFirmId: 101,
      platformNameAr: "مكتب أ",
      platformNameEn: "Firm A",
      logoUrl: null,
    });
    mocks.getLawFirmById.mockResolvedValue({ id: 101, name: "مكتب أ" });
    mocks.storagePut.mockResolvedValue({
      key: "firms/101/branding/logo-generated.png",
      url: "https://storage.example/logo-generated.png",
    });
    mocks.upsertBrandingSettings.mockResolvedValue({
      lawFirmId: 101,
      platformNameAr: "مكتب أ",
      platformNameEn: "Firm A",
      logoUrl: "https://storage.example/logo-generated.png",
      updatedById: 12,
    });
  });

  it("uploads valid PNG content inside the authenticated firm's storage prefix", async () => {
    const response = await request(makeApp())
      .post("/api/branding/logo")
      .attach("logo", validPngHeader, {
        filename: "logo.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      lawFirmId: 101,
      logoUrl: "https://storage.example/logo-generated.png",
    });
    expect(mocks.storagePut).toHaveBeenCalledWith(
      expect.stringMatching(/^firms\/101\/branding\/logo-/),
      expect.any(Buffer),
      "image/png",
    );
    expect(mocks.upsertBrandingSettings).toHaveBeenCalledWith(101, expect.objectContaining({
      logoUrl: "https://storage.example/logo-generated.png",
      updatedById: 12,
    }));
  });

  it("rejects ordinary users before touching storage", async () => {
    mocks.createContext.mockResolvedValue({ user: { ...manager, role: "lawyer" }, req: { headers: {} } });

    const response = await request(makeApp())
      .post("/api/branding/logo")
      .attach("logo", validPngHeader, {
        filename: "logo.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(403);
    expect(mocks.storagePut).not.toHaveBeenCalled();
    expect(mocks.upsertBrandingSettings).not.toHaveBeenCalled();
  });

  it("rejects a MIME spoof whose bytes are not an image", async () => {
    const response = await request(makeApp())
      .post("/api/branding/logo")
      .attach("logo", Buffer.from("not-an-image"), {
        filename: "logo.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(400);
    expect(mocks.storagePut).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated uploads", async () => {
    mocks.createContext.mockResolvedValue({ user: null, req: { headers: {} } });

    const response = await request(makeApp())
      .post("/api/branding/logo")
      .attach("logo", validPngHeader, {
        filename: "logo.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(401);
    expect(mocks.storagePut).not.toHaveBeenCalled();
  });
});
