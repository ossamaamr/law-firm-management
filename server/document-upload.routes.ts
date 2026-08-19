import { randomUUID } from "node:crypto";
import express, { type Request, type Response } from "express";
import multer from "multer";
import { getCaseById, createDocument, getLatestDocumentVersion } from "./db";
import { createContext } from "./_core/context";
import { storagePut } from "./storage";
import {
  MAX_DOCUMENT_BYTES,
  validateDocumentUploadMetadata,
  validateUploadedFileContent,
  getDocumentContentHash,
  scanDocumentBuffer,
  toSafeDocumentMetadata,
} from "./document-security";
import { logActivity } from "./activity.service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENT_BYTES },
});

const uploadMiddleware = (req: Request, res: Response, next: express.NextFunction) => {
  upload.single("file")(req, res, (error: unknown) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File exceeds the 50 MB limit" });
    }
    return res.status(400).json({ error: "Invalid multipart upload" });
  });
};

const documentTypes = new Set([
  "power_of_attorney", "contract", "evidence", "court_order", "judgment",
  "petition", "response", "invoice", "receipt", "other",
]);

export const documentUploadRouter = express.Router();

documentUploadRouter.post(
  "/upload",
  uploadMiddleware,
  async (req: Request, res: Response) => {
    try {
      const ctx = await createContext({ req, res } as any);
      if (!ctx.user) return res.status(401).json({ error: "Authentication required" });
      if (!ctx.user.lawFirmId) return res.status(403).json({ error: "User is not assigned to a firm" });
      if (!req.file) return res.status(400).json({ error: "A file is required" });

      const fileType = String(req.file.mimetype || "").toLowerCase();
      const metadata = validateDocumentUploadMetadata({
        fileName: req.file.originalname,
        fileType,
        fileSize: req.file.size,
      });
      validateUploadedFileContent(metadata.fileType, req.file.buffer);
      const contentHash = getDocumentContentHash(req.file.buffer);
      const scanStatus = await scanDocumentBuffer({
        buffer: req.file.buffer,
        fileName: metadata.fileName,
        fileType: metadata.fileType,
      });

      const caseId = Number(req.body.caseId);
      const documentType = String(req.body.documentType || "other");
      if (!Number.isInteger(caseId) || caseId < 1) {
        return res.status(400).json({ error: "A valid caseId is required" });
      }
      if (!documentTypes.has(documentType)) {
        return res.status(400).json({ error: "Invalid document type" });
      }

      const caseData = await getCaseById(caseId);
      if (!caseData || caseData.lawFirmId !== ctx.user.lawFirmId) {
        return res.status(404).json({ error: "Case not found" });
      }

      const latestVersion = await getLatestDocumentVersion(ctx.user.lawFirmId, caseId, metadata.fileName);
      const safeName = metadata.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storageKey = `firms/${ctx.user.lawFirmId}/documents/${randomUUID()}-${safeName}`;
      const stored = await storagePut(storageKey, req.file.buffer, metadata.fileType);
      const document = await createDocument({
        caseId,
        matterId: null,
        projectId: null,
        lawFirmId: ctx.user.lawFirmId,
        uploadedById: ctx.user.id,
        fileName: metadata.fileName,
        fileType: metadata.fileType,
        fileSize: metadata.fileSize,
        s3Key: stored.key,
        s3Url: stored.url,
        documentType: documentType as any,
        description: typeof req.body.description === "string" ? req.body.description.slice(0, 2000) : null,
        isPublic: false,
        version: (latestVersion?.version ?? 0) + 1,
        previousVersionId: latestVersion?.id ?? null,
        contentHash,
        scanStatus,
        retentionUntil: null,
        expiryDate: null,
      });

      await logActivity({
        firmId: ctx.user.lawFirmId,
        userId: ctx.user.id,
        actionType: "upload",
        entityType: "document",
        entityId: document.id,
        entityName: document.fileName,
      });

      return res.status(201).json({ document: toSafeDocumentMetadata(document) });
    } catch (error: any) {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "File exceeds the 50 MB limit" });
      }
      const message = error instanceof Error ? error.message : "Upload failed";
      if (/Unsupported document type|content does not match|Invalid file name|File is required/i.test(message)) {
        return res.status(400).json({ error: message });
      }
      console.error("[Documents] Upload failed", error);
      return res.status(500).json({ error: "Upload failed" });
    }
  },
);
