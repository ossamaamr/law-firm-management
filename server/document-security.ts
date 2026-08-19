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
    expiryDate: document.expiryDate,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}
