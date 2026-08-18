/**
 * Contact Routes
 * مسارات الاتصال
 */

import { Router, Request, Response } from "express";
import { emailService } from "../external-apis.service";
import { contactConfig } from "../config/contact.config";
import { logger } from "../logger";

const router = Router();

/**
 * Send contact request
 * POST /api/contact/send
 * إرسال طلب اتصال
 */
router.post("/send", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, message, type = "support" } = req.body;

    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Get contact email based on type
    const contactEmail = type === "sales"
      ? contactConfig.sales.email
      : type === "billing"
        ? contactConfig.billing.email
        : type === "technical"
          ? contactConfig.technical.email
          : type === "feedback"
            ? contactConfig.feedback.email
            : contactConfig.support.email;

    // Send email to support team
    const supportEmailSent = await emailService.sendEmail(
      contactEmail,
      `طلب اتصال جديد من ${name}`,
      `
        <div style="font-family: Arial, sans-serif; direction: rtl;">
          <h2>طلب اتصال جديد</h2>
          <p><strong>الاسم:</strong> ${name}</p>
          <p><strong>البريد الإلكتروني:</strong> ${email}</p>
          <p><strong>الهاتف:</strong> ${phone || "غير محدد"}</p>
          <p><strong>نوع الطلب:</strong> ${type}</p>
          <p><strong>الرسالة:</strong></p>
          <p>${message.replace(/\n/g, "<br>")}</p>
        </div>
      `
    );

    // Send confirmation email to user
    const userEmailSent = await emailService.sendEmail(
      email,
      "شكراً على تواصلك معنا",
      `
        <div style="font-family: Arial, sans-serif; direction: rtl;">
          <h2>شكراً على تواصلك معنا</h2>
          <p>مرحباً ${name}!</p>
          <p>تلقينا طلبك وسيتم الرد عليك في أقرب وقت ممكن.</p>
          <p>بيانات طلبك:</p>
          <ul>
            <li><strong>البريد الإلكتروني:</strong> ${email}</li>
            <li><strong>الهاتف:</strong> ${phone || "غير محدد"}</li>
            <li><strong>نوع الطلب:</strong> ${type}</li>
          </ul>
          <p>مع أطيب التحيات،<br>فريق CasEngine</p>
        </div>
      `
    );

    logger.info(`Contact request received from ${email}`, {
      name,
      type,
      supportEmailSent,
      userEmailSent,
    });

    res.json({
      success: true,
      message: "تم استقبال طلبك بنجاح. سيتم الرد عليك قريباً.",
      supportEmailSent,
      userEmailSent,
    });
  } catch (error) {
    logger.error("Error sending contact request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send contact request",
    });
  }
});

/**
 * Get contact information
 * GET /api/contact/info
 * الحصول على معلومات الاتصال
 */
router.get("/info", (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        primary: contactConfig.primary,
        support: contactConfig.support,
        social: contactConfig.social,
        company: contactConfig.company,
      },
    });
  } catch (error) {
    logger.error("Error fetching contact information:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch contact information",
    });
  }
});

/**
 * Get support contact
 * GET /api/contact/support
 * الحصول على معلومات الدعم الفني
 */
router.get("/support", (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: contactConfig.support,
    });
  } catch (error) {
    logger.error("Error fetching support contact:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch support contact",
    });
  }
});

/**
 * Get social media links
 * GET /api/contact/social
 * الحصول على روابط وسائل التواصل
 */
router.get("/social", (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: contactConfig.social,
    });
  } catch (error) {
    logger.error("Error fetching social media links:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch social media links",
    });
  }
});

/**
 * Subscribe to newsletter
 * POST /api/contact/newsletter
 * الاشتراك في النشرة البريدية
 */
router.post("/newsletter", async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    // Validate email
    if (!email || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address",
      });
    }

    // Send confirmation email
    const sent = await emailService.sendEmail(
      email,
      "شكراً على اشتراكك في النشرة البريدية",
      `
        <div style="font-family: Arial, sans-serif; direction: rtl;">
          <h2>شكراً على اشتراكك</h2>
          <p>مرحباً ${name || "الصديق"}!</p>
          <p>تم اشتراكك بنجاح في النشرة البريدية الخاصة بنا.</p>
          <p>ستتلقى آخر الأخبار والتحديثات والنصائح المفيدة مباشرة في بريدك الإلكتروني.</p>
          <p>مع أطيب التحيات،<br>فريق CasEngine</p>
        </div>
      `
    );

    logger.info(`Newsletter subscription from ${email}`);

    res.json({
      success: true,
      message: "تم اشتراكك بنجاح في النشرة البريدية",
    });
  } catch (error) {
    logger.error("Error subscribing to newsletter:", error);
    res.status(500).json({
      success: false,
      error: "Failed to subscribe to newsletter",
    });
  }
});

/**
 * Report a bug
 * POST /api/contact/bug-report
 * الإبلاغ عن خطأ
 */
router.post("/bug-report", async (req: Request, res: Response) => {
  try {
    const { title, description, severity, email, userAgent } = req.body;

    // Validate input
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Send bug report email
    const sent = await emailService.sendEmail(
      contactConfig.bugReport.email,
      `تقرير خطأ جديد: ${title}`,
      `
        <div style="font-family: Arial, sans-serif; direction: rtl;">
          <h2>تقرير خطأ جديد</h2>
          <p><strong>العنوان:</strong> ${title}</p>
          <p><strong>الخطورة:</strong> ${severity || "عادية"}</p>
          <p><strong>البريد الإلكتروني:</strong> ${email || "غير محدد"}</p>
          <p><strong>الوصف:</strong></p>
          <p>${description.replace(/\n/g, "<br>")}</p>
          <p><strong>معلومات المتصفح:</strong></p>
          <p>${userAgent || "غير محدد"}</p>
        </div>
      `
    );

    logger.info(`Bug report received: ${title}`, {
      severity,
      email,
    });

    res.json({
      success: true,
      message: "شكراً على الإبلاغ عن الخطأ. سيتم التحقيق فيه قريباً.",
    });
  } catch (error) {
    logger.error("Error reporting bug:", error);
    res.status(500).json({
      success: false,
      error: "Failed to report bug",
    });
  }
});

export default router;
