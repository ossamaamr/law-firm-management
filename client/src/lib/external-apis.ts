/**
 * External APIs Integration
 * تكامل الأكواد والـ APIs الخارجية
 */

/**
 * Email Service Configuration
 * إعدادات خدمة البريد الإلكتروني
 */
export const emailConfig = {
  // Contact email for support
  supportEmail: "boss1291boss@gmail.com",
  // Email for notifications
  notificationEmail: "boss1291boss@gmail.com",
  // Email for reports
  reportsEmail: "boss1291boss@gmail.com",
  // Email service provider (e.g., SendGrid, Mailgun, SMTP)
  provider: "smtp",
  // SMTP Configuration
  smtp: {
    host: process.env.VITE_SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.VITE_SMTP_PORT || "587"),
    secure: process.env.VITE_SMTP_SECURE === "true",
    auth: {
      user: process.env.VITE_SMTP_USER || "boss1291boss@gmail.com",
      pass: process.env.VITE_SMTP_PASSWORD || "",
    },
  },
};

/**
 * Contact Information
 * معلومات الاتصال
 */
export const contactInfo = {
  email: "boss1291boss@gmail.com",
  phone: "+966 (متاح قريباً)",
  address: "المملكة العربية السعودية",
  website: "https://casengine.com",
  supportHours: "24/7",
};

/**
 * Social Media Links
 * روابط وسائل التواصل الاجتماعي
 */
export const socialMediaLinks = {
  github: "https://github.com/ossamaamr/law-firm-management",
  linkedin: "https://linkedin.com/company/casengine",
  twitter: "https://twitter.com/casengine",
  facebook: "https://facebook.com/casengine",
  instagram: "https://instagram.com/casengine",
};

/**
 * Payment Gateway Configuration
 * إعدادات بوابة الدفع
 */
export const paymentConfig = {
  // Stripe Configuration
  stripe: {
    publicKey: process.env.VITE_STRIPE_PUBLIC_KEY || "",
    apiVersion: "2023-10-16",
  },
  // PayPal Configuration
  paypal: {
    clientId: process.env.VITE_PAYPAL_CLIENT_ID || "",
    environment: process.env.VITE_PAYPAL_ENV || "sandbox",
  },
  // Fawry Configuration (Egyptian Payment Gateway)
  fawry: {
    merchantCode: process.env.VITE_FAWRY_MERCHANT_CODE || "",
    merchantRefNum: process.env.VITE_FAWRY_MERCHANT_REF || "",
  },
};

/**
 * Analytics Configuration
 * إعدادات التحليلات
 */
export const analyticsConfig = {
  // Google Analytics
  google: {
    trackingId: process.env.VITE_GOOGLE_ANALYTICS_ID || "",
  },
  // Mixpanel
  mixpanel: {
    token: process.env.VITE_MIXPANEL_TOKEN || "",
  },
  // Segment
  segment: {
    writeKey: process.env.VITE_SEGMENT_WRITE_KEY || "",
  },
};

/**
 * Cloud Storage Configuration
 * إعدادات التخزين السحابي
 */
export const storageConfig = {
  // AWS S3
  aws: {
    region: process.env.VITE_AWS_REGION || "us-east-1",
    bucket: process.env.VITE_AWS_BUCKET || "",
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || "",
  },
  // Google Cloud Storage
  gcs: {
    projectId: process.env.VITE_GCS_PROJECT_ID || "",
    bucket: process.env.VITE_GCS_BUCKET || "",
  },
  // Azure Blob Storage
  azure: {
    accountName: process.env.VITE_AZURE_ACCOUNT_NAME || "",
    accountKey: process.env.VITE_AZURE_ACCOUNT_KEY || "",
    containerName: process.env.VITE_AZURE_CONTAINER_NAME || "",
  },
};

/**
 * Document Processing Configuration
 * إعدادات معالجة المستندات
 */
export const documentConfig = {
  // PDF Processing
  pdf: {
    // PDFKit or similar
    engine: "pdfkit",
  },
  // Document Conversion
  conversion: {
    // LibreOffice or similar
    engine: "libreoffice",
  },
  // OCR (Optical Character Recognition)
  ocr: {
    // Tesseract or Google Vision
    engine: process.env.VITE_OCR_ENGINE || "tesseract",
    apiKey: process.env.VITE_OCR_API_KEY || "",
  },
};

/**
 * SMS Service Configuration
 * إعدادات خدمة الرسائل النصية
 */
export const smsConfig = {
  // Twilio
  twilio: {
    accountSid: process.env.VITE_TWILIO_ACCOUNT_SID || "",
    authToken: process.env.VITE_TWILIO_AUTH_TOKEN || "",
    phoneNumber: process.env.VITE_TWILIO_PHONE_NUMBER || "",
  },
  // AWS SNS
  aws: {
    region: process.env.VITE_AWS_REGION || "us-east-1",
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || "",
  },
};

/**
 * Maps and Location Services
 * خدمات الخرائط والمواقع
 */
export const mapsConfig = {
  // Google Maps
  google: {
    apiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || "",
  },
  // Mapbox
  mapbox: {
    accessToken: process.env.VITE_MAPBOX_ACCESS_TOKEN || "",
  },
};

/**
 * AI and Machine Learning Services
 * خدمات الذكاء الاصطناعي والتعلم الآلي
 */
export const aiConfig = {
  // OpenAI
  openai: {
    apiKey: process.env.VITE_OPENAI_API_KEY || "",
    model: "gpt-4",
  },
  // Google Vertex AI
  vertexAi: {
    projectId: process.env.VITE_VERTEX_AI_PROJECT_ID || "",
    region: process.env.VITE_VERTEX_AI_REGION || "us-central1",
  },
  // Anthropic Claude
  claude: {
    apiKey: process.env.VITE_CLAUDE_API_KEY || "",
  },
};

/**
 * Video Conference Services
 * خدمات المؤتمرات المرئية
 */
export const videoConfig = {
  // Zoom
  zoom: {
    clientId: process.env.VITE_ZOOM_CLIENT_ID || "",
    clientSecret: process.env.VITE_ZOOM_CLIENT_SECRET || "",
  },
  // Google Meet
  googleMeet: {
    apiKey: process.env.VITE_GOOGLE_MEET_API_KEY || "",
  },
  // Jitsi
  jitsi: {
    domain: process.env.VITE_JITSI_DOMAIN || "meet.jit.si",
  },
};

/**
 * Electronic Signature Services
 * خدمات التوقيع الإلكتروني
 */
export const signatureConfig = {
  // DocuSign
  docusign: {
    integrationKey: process.env.VITE_DOCUSIGN_INTEGRATION_KEY || "",
    userId: process.env.VITE_DOCUSIGN_USER_ID || "",
  },
  // Adobe Sign
  adobeSign: {
    clientId: process.env.VITE_ADOBE_SIGN_CLIENT_ID || "",
    clientSecret: process.env.VITE_ADOBE_SIGN_CLIENT_SECRET || "",
  },
};

/**
 * Notification Services
 * خدمات الإشعارات
 */
export const notificationConfig = {
  // Firebase Cloud Messaging
  fcm: {
    serverKey: process.env.VITE_FCM_SERVER_KEY || "",
    senderId: process.env.VITE_FCM_SENDER_ID || "",
  },
  // OneSignal
  oneSignal: {
    appId: process.env.VITE_ONESIGNAL_APP_ID || "",
    apiKey: process.env.VITE_ONESIGNAL_API_KEY || "",
  },
};

/**
 * Fetch email configuration from environment
 * جلب إعدادات البريد من البيئة
 */
export function getEmailConfig() {
  return {
    supportEmail: process.env.VITE_SUPPORT_EMAIL || emailConfig.supportEmail,
    notificationEmail:
      process.env.VITE_NOTIFICATION_EMAIL || emailConfig.notificationEmail,
    reportsEmail: process.env.VITE_REPORTS_EMAIL || emailConfig.reportsEmail,
  };
}

/**
 * Fetch contact information from environment
 * جلب معلومات الاتصال من البيئة
 */
export function getContactInfo() {
  return {
    email: process.env.VITE_CONTACT_EMAIL || contactInfo.email,
    phone: process.env.VITE_CONTACT_PHONE || contactInfo.phone,
    address: process.env.VITE_CONTACT_ADDRESS || contactInfo.address,
    website: process.env.VITE_WEBSITE_URL || contactInfo.website,
  };
}

/**
 * Initialize external APIs
 * تهيئة الأكواد الخارجية
 */
export async function initializeExternalAPIs() {
  try {
    // Initialize Google Analytics
    if (analyticsConfig.google.trackingId) {
      // Load Google Analytics script
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsConfig.google.trackingId}`;
      document.head.appendChild(script);
    }

    // Initialize other services as needed
    console.log("External APIs initialized successfully");
  } catch (error) {
    console.error("Error initializing external APIs:", error);
  }
}

/**
 * Send email notification
 * إرسال إشعار بريد إلكتروني
 */
export async function sendEmailNotification(
  to: string,
  subject: string,
  body: string
) {
  try {
    const response = await fetch("/api/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, subject, body }),
    });

    if (!response.ok) {
      throw new Error(`Email sending failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

/**
 * Send SMS notification
 * إرسال إشعار رسالة نصية
 */
export async function sendSMSNotification(
  phoneNumber: string,
  message: string
) {
  try {
    const response = await fetch("/api/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber, message }),
    });

    if (!response.ok) {
      throw new Error(`SMS sending failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw error;
  }
}

/**
 * Track analytics event
 * تتبع حدث تحليلي
 */
export function trackAnalyticsEvent(
  eventName: string,
  eventData?: Record<string, any>
) {
  try {
    // Google Analytics
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", eventName, eventData);
    }

    // Mixpanel
    if (typeof window !== "undefined" && (window as any).mixpanel) {
      (window as any).mixpanel.track(eventName, eventData);
    }
  } catch (error) {
    console.error("Error tracking analytics event:", error);
  }
}
