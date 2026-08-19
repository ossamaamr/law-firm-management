import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createContext: vi.fn(),
  getCaseById: vi.fn(),
  createDocument: vi.fn(),
  getLatestDocumentVersion: vi.fn(),
  storagePut: vi.fn(),
  logActivity: vi.fn(),
}));
const createContextMock = mocks.createContext;
const getCaseByIdMock = mocks.getCaseById;
const createDocumentMock = mocks.createDocument;
const storagePutMock = mocks.storagePut;
const logActivityMock = mocks.logActivity;

vi.mock("./_core/context", () => ({ createContext: mocks.createContext }));
vi.mock("./db", () => ({
  getCaseById: mocks.getCaseById,
  createDocument: mocks.createDocument,
  getLatestDocumentVersion: mocks.getLatestDocumentVersion,
}));
vi.mock("./storage", () => ({ storagePut: mocks.storagePut }));
vi.mock("./activity.service", () => ({ logActivity: mocks.logActivity }));

import { documentUploadRouter } from "./document-upload.routes";

const user = {
  id: 12,
  openId: "firm-a-user",
  name: "Firm A User",
  email: "a@example.com",
  role: "user" as const,
  lawFirmId: 101,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function makeApp() {
  const app = express();
  app.use("/api/documents", documentUploadRouter);
  return app;
}

describe("multipart document upload integration contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createContextMock.mockResolvedValue({ user });
    getCaseByIdMock.mockResolvedValue({ id: 10, lawFirmId: 101 });
    storagePutMock.mockResolvedValue({
      key: "firms/101/documents/generated-contract.pdf",
      url: "internal-storage-url",
    });
    mocks.getLatestDocumentVersion.mockResolvedValue(undefined);
    createDocumentMock.mockResolvedValue({
      id: 55,
      caseId: 10,
      matterId: null,
      projectId: null,
      lawFirmId: 101,
      uploadedById: 12,
      fileName: "contract.pdf",
      fileType: "application/pdf",
      fileSize: 8,
      s3Key: "firms/101/documents/generated-contract.pdf",
      s3Url: "internal-storage-url",
      documentType: "contract",
      description: null,
      isPublic: false,
      expiryDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("uploads valid content and redacts storage identifiers", async () => {
    const response = await request(makeApp())
      .post("/api/documents/upload")
      .field("caseId", "10")
      .field("documentType", "contract")
      .attach("file", Buffer.from("%PDF-1.7"), {
        filename: "contract.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(201);
    expect(response.body.document).not.toHaveProperty("s3Key");
    expect(response.body.document).not.toHaveProperty("s3Url");
    expect(storagePutMock).toHaveBeenCalledWith(
      expect.stringMatching(/^firms\/101\/documents\//),
      expect.any(Buffer),
      "application/pdf",
    );
    expect(createDocumentMock).toHaveBeenCalledWith(expect.objectContaining({
      lawFirmId: 101,
      uploadedById: 12,
      isPublic: false,
    }));
  });

  it("rejects a case owned by another firm before storage is called", async () => {
    getCaseByIdMock.mockResolvedValue({ id: 10, lawFirmId: 202 });

    const response = await request(makeApp())
      .post("/api/documents/upload")
      .field("caseId", "10")
      .field("documentType", "contract")
      .attach("file", Buffer.from("%PDF-1.7"), {
        filename: "contract.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(404);
    expect(storagePutMock).not.toHaveBeenCalled();
    expect(createDocumentMock).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated uploads", async () => {
    createContextMock.mockResolvedValue({ user: null });
    const response = await request(makeApp())
      .post("/api/documents/upload")
      .attach("file", Buffer.from("%PDF-1.7"), {
        filename: "contract.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(401);
    expect(storagePutMock).not.toHaveBeenCalled();
  });
});
