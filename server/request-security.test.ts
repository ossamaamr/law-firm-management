import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  csrfCookieMiddleware,
  csrfProtectionMiddleware,
  securityHeadersMiddleware,
} from "./_core/request-security";

function makeApp() {
  const app = express();
  app.use(securityHeadersMiddleware);
  app.use(csrfCookieMiddleware);
  app.use(csrfProtectionMiddleware);
  app.post("/api/mutation", (_req, res) => res.json({ ok: true }));
  return app;
}

describe("request security middleware", () => {
  it("issues a CSRF cookie and security headers on a safe request", async () => {
    const response = await request(makeApp()).get("/health").set("Host", "localhost:3000");

    expect(response.status).toBe(404);
    expect(response.headers["set-cookie"]?.some(cookie => cookie.startsWith("mersad_csrf="))).toBe(true);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("DENY");
  });

  it("rejects a mutation without an Origin or Referer", async () => {
    const response = await request(makeApp())
      .post("/api/mutation")
      .set("Host", "localhost:3000");

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Request origin is not allowed");
  });

  it("rejects a mutation from a foreign origin", async () => {
    const response = await request(makeApp())
      .post("/api/mutation")
      .set("Host", "localhost:3000")
      .set("Origin", "https://attacker.example")
      .set("x-csrf-token", "invalid");

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Request origin is not allowed");
  });

  it("requires a matching double-submit CSRF token", async () => {
    const agent = request.agent(makeApp());
    const bootstrap = await agent.get("/health").set("Host", "localhost:3000");
    const csrfCookie = bootstrap.headers["set-cookie"]?.find(cookie => cookie.startsWith("mersad_csrf="));
    const csrfToken = csrfCookie?.split(";")[0]?.split("=")[1];

    expect(csrfToken).toBeTruthy();

    const missingHeader = await agent
      .post("/api/mutation")
      .set("Host", "localhost:3000")
      .set("Origin", "http://localhost:3000");
    expect(missingHeader.status).toBe(403);
    expect(missingHeader.body.error).toBe("CSRF validation failed");

    const accepted = await agent
      .post("/api/mutation")
      .set("Host", "localhost:3000")
      .set("Origin", "http://localhost:3000")
      .set("x-csrf-token", csrfToken!);
    expect(accepted.status).toBe(200);
    expect(accepted.body).toEqual({ ok: true });
  });
});
