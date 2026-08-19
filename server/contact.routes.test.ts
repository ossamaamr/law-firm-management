import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendEmail } = vi.hoisted(() => ({ sendEmail: vi.fn() }));

vi.mock("./external-apis.service", () => ({
  emailService: { sendEmail },
}));

vi.mock("./config/contact.config", () => ({
  contactConfig: {
    primary: { email: "primary@example.test" },
    support: { email: "support@example.test" },
    sales: { email: "sales@example.test" },
    billing: { email: "billing@example.test" },
    technical: { email: "technical@example.test" },
    feedback: { email: "feedback@example.test" },
    bugReport: { email: "bugs@example.test" },
    social: {},
    company: { name: "MERSAD" },
  },
}));

import contactRouter from "./routes/contact.routes";

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/contact", contactRouter);
  return app;
}

describe("contact routes security contracts", () => {
  beforeEach(() => {
    sendEmail.mockReset();
    sendEmail.mockResolvedValue(true);
  });

  it("rejects malformed contact requests before email delivery", async () => {
    const response = await request(makeApp()).post("/api/contact/send").send({
      name: "A",
      email: "not-an-email",
      message: "hello",
    });

    expect(response.status).toBe(400);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("escapes untrusted HTML before placing contact fields in email markup", async () => {
    await request(makeApp()).post("/api/contact/send").send({
      name: "<img src=x onerror=alert(1)>",
      email: "person@example.test",
      message: "<script>alert(1)</script>",
    });

    expect(sendEmail).toHaveBeenCalledTimes(2);
    const html = sendEmail.mock.calls[0]?.[2] as string;
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("fails closed when contact email delivery is unavailable", async () => {
    sendEmail.mockResolvedValue(false);

    const response = await request(makeApp()).post("/api/contact/newsletter").send({
      email: "person@example.test",
      name: "مستخدم",
    });

    expect(response.status).toBe(502);
    expect(response.body.success).toBe(false);
  });

  it("does not report a bug as accepted when delivery fails", async () => {
    sendEmail.mockResolvedValue(false);

    const response = await request(makeApp()).post("/api/contact/bug-report").send({
      title: "خطأ",
      description: "وصف الخطأ",
      email: "person@example.test",
    });

    expect(response.status).toBe(502);
    expect(response.body.success).toBe(false);
  });
});
