import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  documentUploadMetadataSchema,
  MAX_DOCUMENT_BYTES,
  toSafeDocumentMetadata,
  validateDocumentUploadMetadata,
  validateUploadedFileContent,
  getDocumentContentHash,
  scanDocumentBuffer,
} from "./document-security";

function context(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

const firmUser = {
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

describe("Document security contract", () => {
  it("rejects unauthenticated document download requests", async () => {
    await expect(appRouter.createCaller(context(null)).documents.getDownloadUrl(1))
      .rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("does not disclose another firm’s document when the record is absent from the tenant", async () => {
    await expect(appRouter.createCaller(context(firmUser)).documents.getDownloadUrl(999999))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("does not allow cross-tenant deletion by document ID", async () => {
    await expect(appRouter.createCaller(context(firmUser)).documents.delete(999999))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("redacts storage keys and persistent URLs from safe metadata", () => {
    const safe = toSafeDocumentMetadata({
      id: 1,
      caseId: 2,
      matterId: null,
      projectId: null,
      fileName: "contract.pdf",
      fileType: "application/pdf",
      fileSize: 1024,
      documentType: "contract",
      description: null,
      expiryDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(safe).not.toHaveProperty("s3Key");
    expect(safe).not.toHaveProperty("s3Url");
    expect(safe.scanStatus).toBe("pending");
  });

  it("validates file signatures instead of trusting MIME metadata", () => {
    expect(() => validateUploadedFileContent("application/pdf", Buffer.from("%PDF-1.7"))).not.toThrow();
    expect(() => validateUploadedFileContent("image/png", Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).not.toThrow();
    expect(() => validateUploadedFileContent("application/pdf", Buffer.from("not a pdf"))).toThrow();
  });

  it("creates a stable content hash for audit/versioning", () => {
    expect(getDocumentContentHash(Buffer.from("mersad"))).toBe(getDocumentContentHash(Buffer.from("mersad")));
    expect(getDocumentContentHash(Buffer.from("mersad"))).not.toBe(getDocumentContentHash(Buffer.from("MERSAD")));
  });

  it("fails safe to pending when no malware scanner is configured", async () => {
    vi.stubEnv("DOCUMENT_SCANNER_URL", "");
    vi.stubEnv("DOCUMENT_SCANNER_API_KEY", "");
    await expect(scanDocumentBuffer({
      buffer: Buffer.from("%PDF-1.7"),
      fileName: "contract.pdf",
      fileType: "application/pdf",
    })).resolves.toBe("pending");
    vi.unstubAllEnvs();
  });

  it("enforces the server-side size and MIME contract", () => {
    expect(documentUploadMetadataSchema.parse({
      fileName: "contract.pdf",
      fileType: "application/pdf",
      fileSize: MAX_DOCUMENT_BYTES,
    })).toEqual({
      fileName: "contract.pdf",
      fileType: "application/pdf",
      fileSize: MAX_DOCUMENT_BYTES,
    });
    expect(() => documentUploadMetadataSchema.parse({
      fileName: "../secret.txt",
      fileType: "text/plain",
      fileSize: 100,
    })).toThrow();
    expect(() => validateDocumentUploadMetadata({
      fileName: "script.js",
      fileType: "application/javascript",
      fileSize: 100,
    })).toThrow("Unsupported document type");
  });
});
