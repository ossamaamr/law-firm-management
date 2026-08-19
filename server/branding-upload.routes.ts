import express, { type Request, type Response } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { createContext } from "./_core/context";
import { getBrandingSettings, getLawFirmById, upsertBrandingSettings } from "./db";
import { storagePut } from "./storage";
import { validateUploadedFileContent } from "./document-security";
import { logActivity } from "./activity.service";

export const MAX_BRANDING_LOGO_BYTES = 2 * 1024 * 1024;

const allowedLogoTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const extensionByType: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BRANDING_LOGO_BYTES },
});

const uploadMiddleware = (req: Request, res: Response, next: express.NextFunction) => {
  upload.single("logo")(req, res, error => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Logo exceeds the 2 MB limit" });
    }
    return res.status(400).json({ error: "Invalid logo upload" });
  });
};

export const brandingUploadRouter = express.Router();

brandingUploadRouter.post(
  "/logo",
  uploadMiddleware,
  async (req: Request, res: Response) => {
    try {
      const ctx = await createContext({ req, res } as any);
      if (!ctx.user) return res.status(401).json({ error: "Authentication required" });
      if (!ctx.user.lawFirmId) return res.status(403).json({ error: "User is not assigned to a firm" });
      if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
        return res.status(403).json({ error: "Admin access required" });
      }
      if (!req.file) return res.status(400).json({ error: "A logo file is required" });

      const fileType = String(req.file.mimetype || "").toLowerCase();
      if (!allowedLogoTypes.has(fileType)) {
        return res.status(400).json({ error: "Logo must be PNG, JPEG, or WebP" });
      }
      validateUploadedFileContent(fileType, req.file.buffer);

      const previous = await getBrandingSettings(ctx.user.lawFirmId);
      const firm = await getLawFirmById(ctx.user.lawFirmId);
      if (!firm) return res.status(404).json({ error: "Law firm not found" });
      const extension = extensionByType[fileType];
      const storageKey = `firms/${ctx.user.lawFirmId}/branding/logo-${randomUUID()}.${extension}`;
      const stored = await storagePut(storageKey, req.file.buffer, fileType);
      const saved = await upsertBrandingSettings(ctx.user.lawFirmId, {
        platformNameAr: previous?.platformNameAr ?? firm.name,
        platformNameEn: previous?.platformNameEn ?? firm.name,
        logoUrl: stored.url,
        updatedById: ctx.user.id,
      });

      await logActivity({
        firmId: ctx.user.lawFirmId,
        userId: ctx.user.id,
        actionType: "upload",
        entityType: "branding",
        entityId: ctx.user.lawFirmId,
        entityName: "logo",
        changes: {
          before: previous?.logoUrl ? { logoUrl: previous.logoUrl } : undefined,
          after: { logoUrl: saved.logoUrl },
        },
        ipAddress: ctx.req.headers["x-forwarded-for"] as string || undefined,
      });

      return res.status(201).json({
        lawFirmId: saved.lawFirmId,
        logoUrl: saved.logoUrl,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Logo upload failed";
      if (/content does not match|Unsupported|signature/i.test(message)) {
        return res.status(400).json({ error: message });
      }
      console.error("[Branding] Logo upload failed", error);
      return res.status(500).json({ error: "Logo upload failed" });
    }
  },
);
