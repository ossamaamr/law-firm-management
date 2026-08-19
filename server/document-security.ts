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
