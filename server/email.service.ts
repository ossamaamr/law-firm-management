import { notifyOwner } from "./_core/notification";

/**
 * Email Templates and Service
 * يتعامل مع إرسال رسائل البريد الإلكتروني المختلفة
 */

interface EmailData {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send new registration request notification to admin
 * إرسال إشعار طلب تسجيل جديد للمسؤول
 */
export async function sendRegistrationRequestEmail(
  registrationData: {
    fullName: string;
    email: string;
    phone: string;
    birthDate: string;
    firmName: string;
    city: string;
    country: string;
  },
  adminEmail: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; background-color: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px;">
          🔔 طلب تسجيل حساب جديد
        </h2>
        
        <p style="color: #555; font-size: 16px; margin-top: 20px;">
          لديك طلب تسجيل حساب جديد من قبل مستخدم جديد. يرجى مراجعة البيانات أدناه:
        </p>

        <div style="background-color: #ecf0f1; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">البيانات الشخصية</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #bdc3c7; font-weight: bold; color: #2c3e50; width: 30%;">الاسم الكامل:</td>
              <td style="padding: 10px; border-bottom: 1px solid #bdc3c7; color: #555;">${registrationData.fullName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #bdc3c7; font-weight: bold; color: #2c3e50;">البريد الإلكتروني:</td>
              <td style="padding: 10px; border-bottom: 1px solid #bdc3c7; color: #555;">${registrationData.email}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #bdc3c7; font-weight: bold; color: #2c3e50;">رقم الهاتف:</td>
              <td style="padding: 10px; border-bottom: 1px solid #bdc3c7; color: #555;">${registrationData.phone}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #bdc3c7; font-weight: bold; color: #2c3e50;">تاريخ الميلاد:</td>
              <td style="padding: 10px; border-bottom: 1px solid #bdc3c7; color: #555;">${new Date(registrationData.birthDate).toLocaleDateString("ar-SA")}</td>
            </tr>
          </table>

          <h3 style="color: #2c3e50; margin-top: 20px;">بيانات المكتب</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #bdc3c7; font-weight: bold; color: #2c3e50; width: 30%;">اسم المكتب:</td>
              <td style="padding: 10px; border-bottom: 1px solid #bdc3c7; color: #555;">${registrationData.firmName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #bdc3c7; font-weight: bold; color: #2c3e50;">المدينة:</td>
              <td style="padding: 10px; border-bottom: 1px solid #bdc3c7; color: #555;">${registrationData.city}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #bdc3c7; font-weight: bold; color: #2c3e50;">الدولة:</td>
              <td style="padding: 10px; border-bottom: 1px solid #bdc3c7; color: #555;">${registrationData.country}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-right: 4px solid #ffc107;">
          <p style="color: #856404; margin: 0;">
            ⚠️ يرجى مراجعة هذا الطلب والموافقة عليه أو رفضه من خلال لوحة التحكم.
          </p>
        </div>

        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          هذا البريد الإلكتروني تم إرساله تلقائياً من نظام إدارة المكاتب القانونية.
        </p>
      </div>
    </div>
  `;

  try {
    // Send notification to admin
    await notifyOwner({
      title: "طلب تسجيل حساب جديد",
      content: `تم استقبال طلب تسجيل من ${registrationData.fullName} (${registrationData.email})`,
    });

    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log("Registration request email sent to:", adminEmail);
    return true;
  } catch (error) {
    console.error("Failed to send registration request email:", error);
    return false;
  }
}

/**
 * Send approval email with generated identifier
 * إرسال بريد الموافقة مع المعرف الفريد المُنشأ
 */
export async function sendApprovalEmail(
  userEmail: string,
  userName: string,
  firmName: string,
  identifier: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; background-color: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #27ae60; font-size: 32px; margin: 0;">✅ تم قبول طلبك!</h1>
        </div>

        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          مرحباً <strong>${userName}</strong>,
        </p>

        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          يسعدنا إخبارك بأن طلب تسجيلك في نظام إدارة المكاتب القانونية قد تمت الموافقة عليه! ✨
        </p>

        <div style="background: linear-gradient(135deg, #27ae60 0%, #229954 100%); padding: 25px; border-radius: 8px; margin: 25px 0; color: white; text-align: center;">
          <p style="font-size: 14px; margin: 0 0 10px 0; opacity: 0.9;">معرفك الفريد للمكتب:</p>
          <div style="background-color: rgba(255,255,255,0.2); padding: 15px; border-radius: 5px; border: 2px dashed white;">
            <code style="font-size: 24px; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace;">
              ${identifier}
            </code>
          </div>
          <p style="font-size: 12px; margin: 10px 0 0 0; opacity: 0.9;">احفظ هذا المعرف في مكان آمن</p>
        </div>

        <h3 style="color: #2c3e50; margin-top: 25px;">خطواتك التالية:</h3>
        <ol style="color: #555; font-size: 15px; line-height: 1.8;">
          <li>استخدم المعرف أعلاه لتسجيل الدخول إلى النظام</li>
          <li>أدخل بيانات تسجيل الدخول الخاصة بك</li>
          <li>ابدأ في إدارة قضاياك وملفاتك</li>
        </ol>

        <div style="background-color: #e8f4f8; padding: 20px; border-radius: 5px; margin: 25px 0; border-right: 4px solid #3498db;">
          <h4 style="color: #2c3e50; margin-top: 0;">معلومات مكتبك:</h4>
          <p style="color: #555; margin: 5px 0;"><strong>اسم المكتب:</strong> ${firmName}</p>
          <p style="color: #555; margin: 5px 0;"><strong>المعرف:</strong> ${identifier}</p>
        </div>

        <p style="color: #555; font-size: 15px; line-height: 1.6; margin-top: 25px;">
          إذا كان لديك أي أسئلة أو احتجت إلى مساعدة، لا تتردد في التواصل معنا.
        </p>

        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          هذا البريد الإلكتروني تم إرساله تلقائياً من نظام إدارة المكاتب القانونية.
        </p>
      </div>
    </div>
  `;

  try {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log("Approval email sent to:", userEmail);
    return true;
  } catch (error) {
    console.error("Failed to send approval email:", error);
    return false;
  }
}

/**
 * Send rejection email
 * إرسال بريد الرفض
 */
export async function sendRejectionEmail(
  userEmail: string,
  userName: string,
  rejectionReason: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; background-color: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e74c3c; font-size: 32px; margin: 0;">⚠️ تم رفض طلبك</h1>
        </div>

        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          مرحباً <strong>${userName}</strong>,
        </p>

        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          للأسف، لم نتمكن من الموافقة على طلب تسجيلك في النظام في هذا الوقت.
        </p>

        <div style="background-color: #fadbd8; padding: 20px; border-radius: 5px; margin: 20px 0; border-right: 4px solid #e74c3c;">
          <h4 style="color: #c0392b; margin-top: 0;">سبب الرفض:</h4>
          <p style="color: #555; margin: 0;">${rejectionReason}</p>
        </div>

        <p style="color: #555; font-size: 15px; line-height: 1.6; margin-top: 25px;">
          يمكنك محاولة إعادة تقديم الطلب بعد معالجة الملاحظات أعلاه، أو التواصل معنا للحصول على مزيد من المساعدة.
        </p>

        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          هذا البريد الإلكتروني تم إرساله تلقائياً من نظام إدارة المكاتب القانونية.
        </p>
      </div>
    </div>
  `;

  try {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log("Rejection email sent to:", userEmail);
    return true;
  } catch (error) {
    console.error("Failed to send rejection email:", error);
    return false;
  }
}

/**
 * Send activity notification email
 * إرسال بريد إشعار النشاط
 */
export async function sendActivityNotificationEmail(
  firmEmail: string,
  activityData: {
    userName: string;
    actionType: string;
    entityType: string;
    entityName: string;
    timestamp: Date;
  }
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; background-color: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px;">
          📢 إشعار نشاط جديد
        </h2>

        <div style="background-color: #ecf0f1; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #555; font-size: 15px; margin: 5px 0;">
            <strong>${activityData.userName}</strong> قام بـ <strong>${activityData.actionType}</strong> على 
            <strong>${activityData.entityType}</strong>: <strong>${activityData.entityName}</strong>
          </p>
          <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
            ${activityData.timestamp.toLocaleString("ar-SA")}
          </p>
        </div>

        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          هذا البريد الإلكتروني تم إرساله تلقائياً من نظام إدارة المكاتب القانونية.
        </p>
      </div>
    </div>
  `;

  try {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log("Activity notification email sent to:", firmEmail);
    return true;
  } catch (error) {
    console.error("Failed to send activity notification email:", error);
    return false;
  }
}
