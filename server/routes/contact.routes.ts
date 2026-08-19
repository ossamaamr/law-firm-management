import { Router, type Request, type Response } from "express";
import { emailService } from "../external-apis.service";
import { contactConfig } from "../config/contact.config";
import { logger } from "../logger";

const router = Router();

const CONTACT_TYPES = ["support", "sales", "billing", "technical", "feedback"] as const;
type ContactType = (typeof CONTACT_TYPES)[number];

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 40;
const MAX_MESSAGE_LENGTH = 10_000;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 20_000;
const MAX_USER_AGENT_LENGTH = 1_000;

function asBoundedString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.normalize("NFC").trim();
  if (!normalized || normalized.length > maxLength || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(normalized)) {
    return null;
  }
  return normalized;
}

function isEmail(value: string): boolean {
  return value.length <= MAX_EMAIL_LENGTH && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

function asContactType(value: unknown): ContactType {
  return typeof value === "string" && CONTACT_TYPES.includes(value as ContactType)
    ? (value as ContactType)
    : "support";
}

function contactEmailFor(type: ContactType): string {
  switch (type) {
    case "sales":
      return contactConfig.sales.email;
    case "billing":
      return contactConfig.billing.email;
    case "technical":
      return contactConfig.technical.email;
    case "feedback":
      return contactConfig.feedback.email;
    default:
      return contactConfig.support.email;
  }
}

function deliveryFailure(res: Response): Response {
  return res.status(502).json({
    success: false,
    error: "Email delivery is currently unavailable",
  });
}

router.post("/send", async (req: Request, res: Response) => {
  try {
    const name = asBoundedString(req.body?.name, MAX_NAME_LENGTH);
    const email = asBoundedString(req.body?.email, MAX_EMAIL_LENGTH);
    const phone = req.body?.phone == null ? "غير محدد" : asBoundedString(req.body.phone, MAX_PHONE_LENGTH);
    const message = asBoundedString(req.body?.message, MAX_MESSAGE_LENGTH);
    const type = asContactType(req.body?.type);

    if (!name || !email || !message || !isEmail(email) || phone === null) {
      return res.status(400).json({ success: false, error: "Invalid contact request" });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeMessage = escapeHtml(message).replace(/\r?\n/g, "<br>");
    const safeType = escapeHtml(type);

    const supportEmailSent = await emailService.sendEmail(
      contactEmailFor(type),
      `طلب اتصال جديد من ${safeName}`,
      `<div style="font-family: Arial, sans-serif; direction: rtl;">
        <h2>طلب اتصال جديد</h2>
        <p><strong>الاسم:</strong> ${safeName}</p>
        <p><strong>البريد الإلكتروني:</strong> ${safeEmail}</p>
        <p><strong>الهاتف:</strong> ${safePhone}</p>
        <p><strong>نوع الطلب:</strong> ${safeType}</p>
        <p><strong>الرسالة:</strong></p>
        <p>${safeMessage}</p>
      </div>`,
    );

    const userEmailSent = await emailService.sendEmail(
      email,
      "شكراً على تواصلك معنا",
      `<div style="font-family: Arial, sans-serif; direction: rtl;">
        <h2>شكراً على تواصلك معنا</h2>
        <p>مرحباً ${safeName}!</p>
        <p>تلقينا طلبك وسيتم الرد عليك في أقرب وقت ممكن.</p>
        <p><strong>البريد الإلكتروني:</strong> ${safeEmail}</p>
        <p><strong>الهاتف:</strong> ${safePhone}</p>
        <p><strong>نوع الطلب:</strong> ${safeType}</p>
      </div>`,
    );

    if (!supportEmailSent || !userEmailSent) {
      logger.error("Contact request email delivery was incomplete", {
        type,
        supportEmailSent,
        userEmailSent,
      });
      return deliveryFailure(res);
    }

    logger.info("Contact request email delivery completed", { type });
    return res.json({
      success: true,
      message: "تم استقبال طلبك بنجاح. سيتم الرد عليك قريباً.",
    });
  } catch (error) {
    logger.error("Error sending contact request", error);
    return res.status(500).json({ success: false, error: "Failed to send contact request" });
  }
});

router.get("/info", (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      primary: contactConfig.primary,
      support: contactConfig.support,
      social: contactConfig.social,
      company: contactConfig.company,
    },
  });
});

router.get("/support", (_req: Request, res: Response) => {
  return res.json({ success: true, data: contactConfig.support });
});

router.get("/social", (_req: Request, res: Response) => {
  return res.json({ success: true, data: contactConfig.social });
});

router.post("/newsletter", async (req: Request, res: Response) => {
  try {
    const email = asBoundedString(req.body?.email, MAX_EMAIL_LENGTH);
    const name = req.body?.name == null ? "الصديق" : asBoundedString(req.body.name, MAX_NAME_LENGTH);

    if (!email || !isEmail(email) || name === null) {
      return res.status(400).json({ success: false, error: "Invalid newsletter subscription" });
    }

    const sent = await emailService.sendEmail(
      email,
      "شكراً على اشتراكك في النشرة البريدية",
      `<div style="font-family: Arial, sans-serif; direction: rtl;">
        <h2>شكراً على اشتراكك</h2>
        <p>مرحباً ${escapeHtml(name)}!</p>
        <p>تم اشتراكك بنجاح في النشرة البريدية الخاصة بنا.</p>
      </div>`,
    );

    if (!sent) {
      logger.error("Newsletter confirmation email delivery failed");
      return deliveryFailure(res);
    }

    logger.info("Newsletter confirmation email delivery completed");
    return res.json({ success: true, message: "تم اشتراكك بنجاح في النشرة البريدية" });
  } catch (error) {
    logger.error("Error subscribing to newsletter", error);
    return res.status(500).json({ success: false, error: "Failed to subscribe to newsletter" });
  }
});

router.post("/bug-report", async (req: Request, res: Response) => {
  try {
    const title = asBoundedString(req.body?.title, MAX_TITLE_LENGTH);
    const description = asBoundedString(req.body?.description, MAX_DESCRIPTION_LENGTH);
    const severity = asBoundedString(req.body?.severity ?? "عادية", 40);
    const email = req.body?.email == null ? "غير محدد" : asBoundedString(req.body.email, MAX_EMAIL_LENGTH);
    const userAgent = req.body?.userAgent == null ? "غير محدد" : asBoundedString(req.body.userAgent, MAX_USER_AGENT_LENGTH);

    if (!title || !description || !severity || email === null || userAgent === null || (email !== "غير محدد" && !isEmail(email))) {
      return res.status(400).json({ success: false, error: "Invalid bug report" });
    }

    const sent = await emailService.sendEmail(
      contactConfig.bugReport.email,
      `تقرير خطأ جديد: ${escapeHtml(title)}`,
      `<div style="font-family: Arial, sans-serif; direction: rtl;">
        <h2>تقرير خطأ جديد</h2>
        <p><strong>العنوان:</strong> ${escapeHtml(title)}</p>
        <p><strong>الخطورة:</strong> ${escapeHtml(severity)}</p>
        <p><strong>البريد الإلكتروني:</strong> ${escapeHtml(email)}</p>
        <p><strong>الوصف:</strong></p>
        <p>${escapeHtml(description).replace(/\r?\n/g, "<br>")}</p>
        <p><strong>معلومات المتصفح:</strong></p>
        <p>${escapeHtml(userAgent)}</p>
      </div>`,
    );

    if (!sent) {
      logger.error("Bug report email delivery failed");
      return deliveryFailure(res);
    }

    logger.info("Bug report email delivery completed", { severity });
    return res.json({ success: true, message: "شكراً على الإبلاغ عن الخطأ. سيتم التحقيق فيه قريباً." });
  } catch (error) {
    logger.error("Error reporting bug", error);
    return res.status(500).json({ success: false, error: "Failed to report bug" });
  }
});

export default router;
