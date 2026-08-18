/**
 * Contact Configuration
 * إعدادات معلومات الاتصال
 */

export const contactConfig = {
  // Primary contact information
  // معلومات الاتصال الأساسية
  primary: {
    email: "boss1291boss@gmail.com",
    phone: "+966",
    address: "المملكة العربية السعودية",
    country: "SA",
    timezone: "Asia/Riyadh",
  },

  // Support contact information
  // معلومات الدعم الفني
  support: {
    email: "boss1291boss@gmail.com",
    phone: "+966",
    website: "https://casengine.com/support",
    hours: "24/7",
    languages: ["ar", "en"],
  },

  // Sales contact information
  // معلومات المبيعات
  sales: {
    email: "boss1291boss@gmail.com",
    phone: "+966",
    website: "https://casengine.com/sales",
  },

  // Billing contact information
  // معلومات الفواتير
  billing: {
    email: "boss1291boss@gmail.com",
    phone: "+966",
  },

  // Technical contact information
  // معلومات الدعم الفني
  technical: {
    email: "boss1291boss@gmail.com",
    phone: "+966",
    slack: "#support",
  },

  // Social media links
  // روابط وسائل التواصل الاجتماعي
  social: {
    github: "https://github.com/ossamaamr/law-firm-management",
    linkedin: "https://linkedin.com/company/casengine",
    twitter: "https://twitter.com/casengine",
    facebook: "https://facebook.com/casengine",
    instagram: "https://instagram.com/casengine",
    youtube: "https://youtube.com/@casengine",
  },

  // Office locations
  // مواقع المكاتب
  offices: [
    {
      name: "المقر الرئيسي",
      country: "السعودية",
      city: "الرياض",
      address: "المملكة العربية السعودية",
      phone: "+966",
      email: "boss1291boss@gmail.com",
      timezone: "Asia/Riyadh",
    },
  ],

  // Company information
  // معلومات الشركة
  company: {
    name: "CasEngine",
    legalName: "نظام إدارة مكتب المحاماة",
    description: "نظام إدارة متكامل وشامل لمكاتب المحاماة",
    founded: 2026,
    website: "https://casengine.com",
    logo: "/logo.png",
  },

  // Emergency contact
  // جهات الاتصال الطارئة
  emergency: {
    email: "boss1291boss@gmail.com",
    phone: "+966",
    whatsapp: "+966",
  },

  // Newsletter subscription
  // الاشتراك في النشرة البريدية
  newsletter: {
    email: "boss1291boss@gmail.com",
    frequency: "weekly",
    topics: ["updates", "tips", "news"],
  },

  // Feedback and suggestions
  // الملاحظات والاقتراحات
  feedback: {
    email: "boss1291boss@gmail.com",
    form: "https://casengine.com/feedback",
  },

  // Bug reporting
  // الإبلاغ عن الأخطاء
  bugReport: {
    email: "boss1291boss@gmail.com",
    github: "https://github.com/ossamaamr/law-firm-management/issues",
  },

  // Security contact
  // جهات الاتصال الأمنية
  security: {
    email: "boss1291boss@gmail.com",
    pgpKey: "https://casengine.com/security/pgp-key",
  },
};

/**
 * Get contact information by type
 * الحصول على معلومات الاتصال حسب النوع
 */
export function getContactByType(
  type: "support" | "sales" | "billing" | "technical" | "emergency"
) {
  return contactConfig[type];
}

/**
 * Get primary contact email
 * الحصول على البريد الإلكتروني الأساسي
 */
export function getPrimaryEmail(): string {
  return contactConfig.primary.email;
}

/**
 * Get primary phone number
 * الحصول على رقم الهاتف الأساسي
 */
export function getPrimaryPhone(): string {
  return contactConfig.primary.phone;
}

/**
 * Get support email
 * الحصول على بريد الدعم الفني
 */
export function getSupportEmail(): string {
  return contactConfig.support.email;
}

/**
 * Get all social media links
 * الحصول على جميع روابط وسائل التواصل
 */
export function getSocialMediaLinks() {
  return contactConfig.social;
}

/**
 * Format contact information for display
 * تنسيق معلومات الاتصال للعرض
 */
export function formatContactInfo(): string {
  return `
    البريد الإلكتروني: ${contactConfig.primary.email}
    الهاتف: ${contactConfig.primary.phone}
    العنوان: ${contactConfig.primary.address}
    ساعات الدعم: ${contactConfig.support.hours}
  `;
}

/**
 * Send contact request
 * إرسال طلب اتصال
 */
export async function sendContactRequest(
  name: string,
  email: string,
  phone: string,
  message: string,
  type: "support" | "sales" | "feedback" = "support"
): Promise<boolean> {
  try {
    const contactEmail = type === "feedback"
      ? contactConfig.feedback.email
      : getContactByType(type).email;

    const response = await fetch("/api/contact/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        message,
        type,
        contactEmail,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error sending contact request:", error);
    return false;
  }
}
