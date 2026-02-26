import { describe, it, expect, beforeEach } from "vitest";
import {
  passwordService,
  identifierService,
  emailService,
  phoneService,
  rateLimiter,
  sanitizer,
  encryptionService,
} from "./security.service";

/**
 * Security Tests
 * اختبارات الأمان
 */

describe("Security Services", () => {
  describe("Password Service", () => {
    it("should hash password correctly", async () => {
      const password = "SecurePassword123!";
      const hash = await passwordService.hash(password);

      expect(hash).toBeDefined();
      expect(hash).toContain(":");
      expect(hash.length).toBeGreaterThan(50);
    });

    it("should verify correct password", async () => {
      const password = "SecurePassword123!";
      const hash = await passwordService.hash(password);

      const isValid = await passwordService.verify(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "SecurePassword123!";
      const hash = await passwordService.hash(password);

      const isValid = await passwordService.verify("WrongPassword", hash);
      expect(isValid).toBe(false);
    });

    it("should validate strong password", () => {
      const result = passwordService.validateStrength("SecurePass123!@");

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(3);
    });

    it("should reject weak password", () => {
      const result = passwordService.validateStrength("weak");

      expect(result.isValid).toBe(false);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it("should provide feedback for weak password", () => {
      const result = passwordService.validateStrength("short");

      expect(result.feedback).toContain("يجب أن تكون كلمة المرور 8 أحرف على الأقل");
    });
  });

  describe("Identifier Service", () => {
    it("should generate valid identifier", () => {
      const identifier = identifierService.generateIdentifier("مكتب أحمد");

      expect(identifier).toMatch(/^@[a-z0-9_-]+#$/);
      expect(identifier.startsWith("@")).toBe(true);
      expect(identifier.endsWith("#")).toBe(true);
    });

    it("should validate correct identifier format", () => {
      const isValid = identifierService.validateFormat("@test_firm#");
      expect(isValid).toBe(true);
    });

    it("should reject invalid identifier format", () => {
      const isValid = identifierService.validateFormat("invalid_format");
      expect(isValid).toBe(false);
    });

    it("should extract firm name from identifier", () => {
      const firmName = identifierService.extractFirmName("@test_firm#");
      expect(firmName).toBe("test_firm");
    });

    it("should throw error for invalid identifier extraction", () => {
      expect(() => {
        identifierService.extractFirmName("invalid");
      }).toThrow();
    });

    it("should generate unique identifiers", () => {
      const id1 = identifierService.generateIdentifier("مكتب");
      const id2 = identifierService.generateIdentifier("مكتب");

      expect(id1).not.toBe(id2);
    });
  });

  describe("Email Service", () => {
    it("should validate correct email", () => {
      const isValid = emailService.validate("test@example.com");
      expect(isValid).toBe(true);
    });

    it("should reject invalid email", () => {
      const isValid = emailService.validate("invalid-email");
      expect(isValid).toBe(false);
    });

    it("should sanitize email", () => {
      const sanitized = emailService.sanitize("  TEST@EXAMPLE.COM  ");
      expect(sanitized).toBe("test@example.com");
    });

    it("should check trusted domain", () => {
      const isTrusted = emailService.isTrustedDomain("test@gmail.com");
      expect(isTrusted).toBe(true);
    });

    it("should reject untrusted domain", () => {
      const isTrusted = emailService.isTrustedDomain("test@unknown.com");
      expect(isTrusted).toBe(false);
    });
  });

  describe("Phone Service", () => {
    it("should validate correct phone number", () => {
      const isValid = phoneService.validate("+966501234567");
      expect(isValid).toBe(true);
    });

    it("should reject invalid phone number", () => {
      const isValid = phoneService.validate("123");
      expect(isValid).toBe(false);
    });

    it("should sanitize phone number", () => {
      const sanitized = phoneService.sanitize("+966-50-1234-567");
      expect(sanitized).toBe("966501234567");
    });

    it("should format phone number", () => {
      const formatted = phoneService.format("0501234567");
      expect(formatted).toMatch(/^\+966/);
    });
  });

  describe("Rate Limiter", () => {
    it("should allow requests within limit", () => {
      rateLimiter.reset("test-key");

      for (let i = 0; i < 5; i++) {
        const allowed = rateLimiter.isAllowed("test-key", 10, 60000);
        expect(allowed).toBe(true);
      }
    });

    it("should block requests exceeding limit", () => {
      rateLimiter.reset("test-key-2");

      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed("test-key-2", 5, 60000);
      }

      const allowed = rateLimiter.isAllowed("test-key-2", 5, 60000);
      expect(allowed).toBe(false);
    });

    it("should get remaining requests", () => {
      rateLimiter.reset("test-key-3");

      rateLimiter.isAllowed("test-key-3", 10, 60000);
      const remaining = rateLimiter.getRemaining("test-key-3", 10, 60000);

      expect(remaining).toBe(9);
    });

    it("should reset after window expires", (done) => {
      rateLimiter.reset("test-key-4");

      rateLimiter.isAllowed("test-key-4", 1, 100); // 100ms window
      let allowed = rateLimiter.isAllowed("test-key-4", 1, 100);
      expect(allowed).toBe(false);

      setTimeout(() => {
        allowed = rateLimiter.isAllowed("test-key-4", 1, 100);
        expect(allowed).toBe(true);
        done();
      }, 150);
    });
  });

  describe("Sanitizer", () => {
    it("should sanitize string input", () => {
      const input = "  <script>alert('xss')</script>  ";
      const sanitized = sanitizer.string(input);

      expect(sanitized).not.toContain("<");
      expect(sanitized).not.toContain(">");
    });

    it("should limit string length", () => {
      const input = "a".repeat(2000);
      const sanitized = sanitizer.string(input, 100);

      expect(sanitized.length).toBeLessThanOrEqual(100);
    });

    it("should sanitize number input", () => {
      expect(sanitizer.number("123")).toBe(123);
      expect(sanitizer.number("abc")).toBe(0);
      expect(sanitizer.number("45.67")).toBe(45.67);
    });

    it("should sanitize array input", () => {
      const input = "not an array";
      const sanitized = sanitizer.array(input as any);

      expect(Array.isArray(sanitized)).toBe(true);
      expect(sanitized.length).toBe(0);
    });

    it("should sanitize object input", () => {
      const input = {
        name: "test",
        email: "test@example.com",
        secret: "should-not-include",
      };

      const sanitized = sanitizer.object(input, ["name", "email"]);

      expect(sanitized.name).toBe("test");
      expect(sanitized.email).toBe("test@example.com");
      expect(sanitized.secret).toBeUndefined();
    });
  });

  describe("Encryption Service", () => {
    it("should encrypt and decrypt data", () => {
      const data = "Sensitive information";
      const encrypted = encryptionService.encrypt(data);

      expect(encrypted).not.toBe(data);
      expect(encrypted).toContain(":");

      const decrypted = encryptionService.decrypt(encrypted);
      expect(decrypted).toBe(data);
    });

    it("should produce different ciphertexts for same plaintext", () => {
      const data = "Same data";
      const encrypted1 = encryptionService.encrypt(data);
      const encrypted2 = encryptionService.encrypt(data);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should handle special characters", () => {
      const data = "مرحبا بك في النظام! 123 !@#$%";
      const encrypted = encryptionService.encrypt(data);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(data);
    });
  });
});
