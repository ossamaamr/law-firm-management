import { describe, expect, it } from "vitest";
import {
  sendActivityNotificationEmail,
  sendApprovalEmail,
  sendRegistrationRequestEmail,
  sendRejectionEmail,
} from "./email.service";

describe("Email Service", () => {
  it("fails closed when no approved provider is configured", async () => {
    await expect(sendRegistrationRequestEmail({
      fullName: "أحمد محمد",
      email: "ahmad@example.com",
      phone: "+966501234567",
      birthDate: "1990-01-15",
      firmName: "مكتب أحمد",
      city: "الرياض",
      country: "السعودية",
    }, "admin@example.com")).resolves.toBe(false);
  });

  it("does not claim approval or rejection delivery", async () => {
    await expect(sendApprovalEmail("user@example.com", "أحمد", "مكتب أحمد", "@ahmad#"))
      .resolves.toBe(false);
    await expect(sendRejectionEmail("user@example.com", "أحمد", "بيانات غير مكتملة"))
      .resolves.toBe(false);
  });

  it("does not claim activity notification delivery", async () => {
    await expect(sendActivityNotificationEmail("firm@example.com", {
      userName: "أحمد",
      actionType: "update",
      entityType: "case",
      entityName: "CASE-1",
      timestamp: new Date(),
    })).resolves.toBe(false);
  });
});
