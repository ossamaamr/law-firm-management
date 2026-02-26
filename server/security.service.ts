/**
 * Security Service
 * خدمة الأمان
 */

import crypto from 'crypto';
import { TRPCError } from '@trpc/server';

/**
 * Password hashing and validation
 * تجزئة كلمات المرور والتحقق منها
 */
export const passwordService = {
  /**
   * Hash a password using bcrypt-like algorithm
   * تجزئة كلمة مرور باستخدام خوارزمية مشابهة لـ bcrypt
   */
  async hash(password: string): Promise<string> {
    // In production, use bcrypt: import bcrypt from 'bcrypt'
    // في الإنتاج، استخدم bcrypt
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');
    return `${salt}:${hash}`;
  },

  /**
   * Verify a password against its hash
   * التحقق من كلمة مرور مقابل تجزئتها
   */
  async verify(password: string, hash: string): Promise<boolean> {
    const [salt, storedHash] = hash.split(':');
    const computedHash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');
    return computedHash === storedHash;
  },

  /**
   * Validate password strength
   * التحقق من قوة كلمة المرور
   */
  validateStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push('يجب أن تكون كلمة المرور 8 أحرف على الأقل');

    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    else feedback.push('يجب أن تحتوي على أحرف صغيرة');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('يجب أن تحتوي على أحرف كبيرة');

    if (/[0-9]/.test(password)) score++;
    else feedback.push('يجب أن تحتوي على أرقام');

    if (/[!@#$%^&*]/.test(password)) score++;
    else feedback.push('يجب أن تحتوي على رموز خاصة');

    return {
      isValid: score >= 3,
      score,
      feedback,
    };
  },
};

/**
 * Identifier generation and validation
 * إنشاء والتحقق من المعرفات
 */
export const identifierService = {
  /**
   * Generate a unique firm identifier
   * إنشاء معرف فريد للمكتب
   */
  generateIdentifier(firmName: string): string {
    // Remove special characters and spaces
    const sanitized = firmName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 20);

    // Add random suffix for uniqueness
    const random = crypto.randomBytes(4).toString('hex').substring(0, 4);

    return `@${sanitized}_${random}#`;
  },

  /**
   * Validate identifier format
   * التحقق من صيغة المعرف
   */
  validateFormat(identifier: string): boolean {
    const pattern = /^@[a-z0-9_-]+#$/;
    return pattern.test(identifier);
  },

  /**
   * Extract firm name from identifier
   * استخراج اسم المكتب من المعرف
   */
  extractFirmName(identifier: string): string {
    if (!this.validateFormat(identifier)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'صيغة المعرف غير صحيحة',
      });
    }
    return identifier.slice(1, -1); // Remove @ and #
  },
};

/**
 * Email validation and sanitization
 * التحقق من البريد الإلكتروني وتنظيفه
 */
export const emailService = {
  /**
   * Validate email format
   * التحقق من صيغة البريد الإلكتروني
   */
  validate(email: string): boolean {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email) && email.length <= 320;
  },

  /**
   * Sanitize email
   * تنظيف البريد الإلكتروني
   */
  sanitize(email: string): string {
    return email.toLowerCase().trim();
  },

  /**
   * Check if email is from trusted domain
   * التحقق من أن البريد من نطاق موثوق
   */
  isTrustedDomain(email: string): boolean {
    const domain = email.split('@')[1];
    const trustedDomains = ['gmail.com', 'outlook.com', 'yahoo.com'];
    return trustedDomains.includes(domain);
  },
};

/**
 * Phone number validation
 * التحقق من رقم الهاتف
 */
export const phoneService = {
  /**
   * Validate phone number format
   * التحقق من صيغة رقم الهاتف
   */
  validate(phone: string): boolean {
    // Support international format: +966501234567
    const pattern = /^\+?[1-9]\d{1,14}$/;
    return pattern.test(phone);
  },

  /**
   * Sanitize phone number
   * تنظيف رقم الهاتف
   */
  sanitize(phone: string): string {
    return phone.replace(/\D/g, '');
  },

  /**
   * Format phone number for display
   * تنسيق رقم الهاتف للعرض
   */
  format(phone: string): string {
    const sanitized = this.sanitize(phone);
    if (sanitized.length === 10) {
      return `+966${sanitized.substring(1)}`;
    }
    return `+${sanitized}`;
  },
};

/**
 * Rate limiting
 * تحديد معدل الطلبات
 */
export const rateLimiter = {
  /**
   * Store for tracking requests
   * متجر لتتبع الطلبات
   */
  requests: new Map<string, { count: number; resetTime: number }>(),

  /**
   * Check if request is allowed
   * التحقق من السماح بالطلب
   */
  isAllowed(
    key: string,
    limit: number = 100,
    windowMs: number = 60000
  ): boolean {
    const now = Date.now();
    const entry = this.requests.get(key);

    if (!entry || now > entry.resetTime) {
      this.requests.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (entry.count < limit) {
      entry.count++;
      return true;
    }

    return false;
  },

  /**
   * Get remaining requests
   * الحصول على الطلبات المتبقية
   */
  getRemaining(
    key: string,
    limit: number = 100,
    windowMs: number = 60000
  ): number {
    const entry = this.requests.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return limit;
    }
    return Math.max(0, limit - entry.count);
  },

  /**
   * Reset requests for a key
   * إعادة تعيين الطلبات لمفتاح
   */
  reset(key: string): void {
    this.requests.delete(key);
  },
};

/**
 * Input sanitization
 * تنظيف المدخلات
 */
export const sanitizer = {
  /**
   * Sanitize string input
   * تنظيف إدخال النص
   */
  string(input: string, maxLength: number = 1000): string {
    return input
      .trim()
      .substring(0, maxLength)
      .replace(/[<>]/g, ''); // Remove potential HTML tags
  },

  /**
   * Sanitize number input
   * تنظيف إدخال الرقم
   */
  number(input: any): number {
    const num = parseFloat(input);
    return isNaN(num) ? 0 : num;
  },

  /**
   * Sanitize array input
   * تنظيف إدخال المصفوفة
   */
  array(input: any[]): any[] {
    if (!Array.isArray(input)) return [];
    return input.slice(0, 1000); // Limit array size
  },

  /**
   * Sanitize object input
   * تنظيف إدخال الكائن
   */
  object(input: Record<string, any>, allowedKeys: string[]): Record<string, any> {
    const result: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (key in input) {
        result[key] = input[key];
      }
    }
    return result;
  },
};

/**
 * CORS and security headers
 * CORS ورؤوس الأمان
 */
export const securityHeaders = {
  /**
   * Get security headers for response
   * الحصول على رؤوس الأمان للاستجابة
   */
  getHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
  },
};

/**
 * Encryption utilities
 * أدوات التشفير
 */
export const encryptionService = {
  /**
   * Encrypt sensitive data
   * تشفير البيانات الحساسة
   */
  encrypt(data: string, key: string = process.env.ENCRYPTION_KEY || ''): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(key.padEnd(32, '0').substring(0, 32)),
      iv
    );
    let encrypted = cipher.update(data, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  },

  /**
   * Decrypt sensitive data
   * فك تشفير البيانات الحساسة
   */
  decrypt(encrypted: string, key: string = process.env.ENCRYPTION_KEY || ''): string {
    const [ivHex, encryptedData] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(key.padEnd(32, '0').substring(0, 32)),
      iv
    );
    let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
  },
};
