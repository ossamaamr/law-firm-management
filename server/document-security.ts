import { createHash } from "node:crypto";
import { z } from "zod";

export const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const documentUploadMetadataSchema = z.object({
  fileName: z.string().trim().min(1).max(255).regex(/^[^\\/\\0]+$/, "Invalid file name"),
  fileType: z.string().trim().min(1).max(100),
  fileSize: z.number().int().positive().max(MAX_DOCUMENT_BYTES),
});

export type DocumentScanStatus = "clean" | "pending" | "quarantined";

export function validateDocumentUploadMetadata(input: z.infer<typeof documentUploadMetadataSchema>) {
  const parsed = documentUploadMetadataSchema.parse(input);
  if (!allowedMimeTypes.has(parsed.fileType.toLowerCase())) {
    throw new Error("Unsupported document type");
  }
  return parsed;
}

export function validateUploadedFileContent(fileType: string, buffer: Buffer) {
  const type = fileType.toLowerCase();
  const matches =
    (type === "application/pdf" && buffer.subarray(0, 5).toString("ascii") === "%PDF-") ||
    (type === "image/png" && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (type === "image/jpeg" && buffer.subarray(0, 2).equals(Buffer.from([255, 216]))) ||
    (type === "image/webp" && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") ||
    (type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && buffer.subarray(0, 2).toString("ascii") === "PK") ||
    (type === "text/plain" && !buffer.includes(0));
  if (!matches) throw new Error("File content does not match the declared MIME type");
  return true;
}

export function getDocumentContentHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Scanner boundary. Without an approved scanner, uploads remain pending and
 * download URLs must not be issued. No local heuristic is represented as a
 * malware scan result.
 */
export async function scanDocumentBuffer(input: {
  buffer: Buffer;
  fileName: string;
  fileType: string;
}): Promise<DocumentScanStatus> {
  const scannerUrl = process.env.DOCUMENT_SCANNER_URL?.trim();
  const scannerKey = process.env.DOCUMENT_SCANNER_API_KEY?.trim();
  if (!scannerUrl || !scannerKey) return "pending";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(scannerUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${scannerKey}`,
        "content-type": input.fileType,
        "x-document-name": input.fileName,
      },
      body: new Uint8Array(input.buffer),
      signal: controller.signal,
    });
    if (!response.ok) return "pending";
    const payload = await response.json() as { status?: unknown };
    return payload.status === "clean" || payload.status === "quarantined" ? payload.status : "pending";
  } catch {
    return "pending";
  } finally {
    clearTimeout(timeout);
  }
}

export function toSafeDocumentMetadata(document: {
  id: number;
  caseId: number | null;
  matterId: number | null;
  projectId: number | null;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  documentType: string;
  description: string | null;
  version?: number;
  previousVersionId?: number | null;
  contentHash?: string | null;
  scanStatus?: DocumentScanStatus;
  retentionUntil?: Date | null;
  expiryDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: document.id,
    caseId: document.caseId,
    matterId: document.matterId,
    projectId: document.projectId,
    fileName: document.fileName,
    fileType: document.fileType,
    fileSize: document.fileSize,
    documentType: document.documentType,
    description: document.description,
    version: document.version ?? 1,
    previousVersionId: document.previousVersionId ?? null,
    contentHash: document.contentHash ?? null,
    // Missing scan state is never safe to treat as clean; legacy or incomplete rows remain blocked.
    scanStatus: document.scanStatus ?? "pending",
    retentionUntil: document.retentionUntil ?? null,
    expiryDate: document.expiryDate,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}
