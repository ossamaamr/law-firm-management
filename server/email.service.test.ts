import { describe, it, expect, beforeAll } from 'vitest';
import { Resend } from 'resend';

describe('Email Service - Resend Integration', () => {
  let resend: Resend;

  beforeAll(() => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set');
    }
    resend = new Resend(apiKey);
  });

  it('should validate Resend API key by testing connection', async () => {
    try {
      // Test by sending a test email to Resend's test domain
      const response = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'delivered@resend.dev',
        subject: 'CasEngine - Email Service Test',
        html: '<h1>Test Email</h1><p>This is a test email from CasEngine</p>',
      });

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data?.id).toBeDefined();
      console.log('✅ Resend API key is valid!');
      console.log('Email ID:', response.data?.id);
    } catch (error) {
      console.error('❌ Resend API key validation failed:', error);
      throw new Error(`Failed to validate Resend API key: ${error}`);
    }
  });

  it('should send welcome email to new users', async () => {
    const response = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'delivered@resend.dev',
      subject: 'Welcome to CasEngine',
      html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <h1>مرحباً بك في CasEngine</h1>
          <p>شكراً لتسجيلك في نظام إدارة مكتب المحاماة</p>
          <p>يمكنك الآن البدء في استخدام جميع الميزات:</p>
          <ul>
            <li>إدارة القضايا</li>
            <li>إدارة الموكلين</li>
            <li>إدارة الفواتير</li>
            <li>التقارير والتحليلات</li>
          </ul>
        </div>
      `,
    });

    expect(response.data?.id).toBeDefined();
    console.log('✅ Welcome email sent successfully');
  });

  it('should send court session reminder', async () => {
    const response = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'delivered@resend.dev',
      subject: 'تذكير: جلسة قضائية غداً',
      html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <h2>تذكير جلسة قضائية</h2>
          <p>لديك جلسة قضائية غداً الساعة 10:00 صباحاً</p>
          <p><strong>القضية:</strong> قضية رقم 2026-001</p>
          <p><strong>الموكل:</strong> أحمد محمد</p>
          <p><strong>المحكمة:</strong> محكمة الاستئناف</p>
        </div>
      `,
    });

    expect(response.data?.id).toBeDefined();
    console.log('✅ Court session reminder sent successfully');
  });
});
