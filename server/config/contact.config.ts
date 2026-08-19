const appOrigin = process.env.PUBLIC_APP_ORIGIN ?? "";
const contactEmail = process.env.PUBLIC_CONTACT_EMAIL ?? "";
const supportEmail = process.env.PUBLIC_SUPPORT_EMAIL ?? contactEmail;
const salesEmail = process.env.PUBLIC_SALES_EMAIL ?? contactEmail;
const billingEmail = process.env.PUBLIC_BILLING_EMAIL ?? contactEmail;
const technicalEmail = process.env.PUBLIC_TECHNICAL_EMAIL ?? contactEmail;
const securityEmail = process.env.PUBLIC_SECURITY_EMAIL ?? contactEmail;
const publicPhone = process.env.PUBLIC_CONTACT_PHONE ?? "";
const publicAddress = process.env.PUBLIC_CONTACT_ADDRESS ?? "";

function publicUrl(path: string): string {
  return appOrigin ? `${appOrigin.replace(/\/$/, "")}${path}` : "";
}

export const contactConfig = {
  primary: {
    email: contactEmail,
    phone: publicPhone,
    address: publicAddress,
    country: "SA",
    timezone: "Asia/Riyadh",
  },
  support: {
    email: supportEmail,
    phone: publicPhone,
    website: publicUrl("/support"),
    hours: process.env.PUBLIC_SUPPORT_HOURS ?? "",
    languages: ["ar", "en"],
  },
  sales: {
    email: salesEmail,
    phone: publicPhone,
    website: publicUrl("/sales"),
  },
  billing: {
    email: billingEmail,
    phone: publicPhone,
  },
  technical: {
    email: technicalEmail,
    phone: publicPhone,
    slack: process.env.PUBLIC_SUPPORT_SLACK ?? "",
  },
  social: {
    github: "https://github.com/ossamaamr/law-firm-management",
    linkedin: process.env.PUBLIC_LINKEDIN_URL ?? "",
    twitter: process.env.PUBLIC_TWITTER_URL ?? "",
    facebook: process.env.PUBLIC_FACEBOOK_URL ?? "",
    instagram: process.env.PUBLIC_INSTAGRAM_URL ?? "",
    youtube: process.env.PUBLIC_YOUTUBE_URL ?? "",
  },
  offices: publicAddress || publicPhone || contactEmail
    ? [{
        name: process.env.PUBLIC_OFFICE_NAME ?? "",
        country: process.env.PUBLIC_OFFICE_COUNTRY ?? "SA",
        city: process.env.PUBLIC_OFFICE_CITY ?? "",
        address: publicAddress,
        phone: publicPhone,
        email: contactEmail,
        timezone: "Asia/Riyadh",
      }]
    : [],
  company: {
    name: "MERSAD",
    legalName: process.env.PUBLIC_COMPANY_LEGAL_NAME ?? "نظام مِرْصاد لإدارة مكاتب المحاماة",
    description: process.env.PUBLIC_COMPANY_DESCRIPTION ?? "نظام تشغيل قانوني عربي-first لمكاتب المحاماة",
    founded: 2026,
    website: appOrigin,
    logo: process.env.PUBLIC_COMPANY_LOGO_URL ?? "",
  },
  emergency: {
    email: process.env.PUBLIC_EMERGENCY_EMAIL ?? securityEmail,
    phone: process.env.PUBLIC_EMERGENCY_PHONE ?? publicPhone,
    whatsapp: process.env.PUBLIC_EMERGENCY_WHATSAPP ?? "",
  },
  newsletter: {
    email: process.env.PUBLIC_NEWSLETTER_EMAIL ?? supportEmail,
    frequency: "weekly",
    topics: ["updates", "tips", "news"],
  },
  feedback: {
    email: process.env.PUBLIC_FEEDBACK_EMAIL ?? supportEmail,
    form: publicUrl("/contact"),
  },
  bugReport: {
    email: process.env.PUBLIC_BUG_REPORT_EMAIL ?? technicalEmail,
    github: "https://github.com/ossamaamr/law-firm-management/issues",
  },
  security: {
    email: securityEmail,
    pgpKey: process.env.PUBLIC_SECURITY_PGP_URL ?? "",
  },
};

export function getContactByType(
  type: "support" | "sales" | "billing" | "technical" | "emergency",
) {
  return contactConfig[type];
}

export function getPrimaryEmail(): string {
  return contactConfig.primary.email;
}

export function getPrimaryPhone(): string {
  return contactConfig.primary.phone;
}

export function getSupportEmail(): string {
  return contactConfig.support.email;
}

export function getSocialMediaLinks() {
  return contactConfig.social;
}

export function formatContactInfo(): string {
  return `
    البريد الإلكتروني: ${contactConfig.primary.email || "غير مهيأ"}
    الهاتف: ${contactConfig.primary.phone || "غير مهيأ"}
    العنوان: ${contactConfig.primary.address || "غير مهيأ"}
    ساعات الدعم: ${contactConfig.support.hours || "غير مهيأة"}
  `;
}
