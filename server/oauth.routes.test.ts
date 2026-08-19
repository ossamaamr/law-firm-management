import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { registerOAuthRoutes } from "./_core/oauth";

const originalEnv = {
  appId: process.env.VITE_APP_ID,
  portal: process.env.VITE_OAUTH_PORTAL_URL,
  origin: process.env.PUBLIC_APP_ORIGIN,
};

afterEach(() => {
  process.env.VITE_APP_ID = originalEnv.appId;
  process.env.VITE_OAUTH_PORTAL_URL = originalEnv.portal;
  process.env.PUBLIC_APP_ORIGIN = originalEnv.origin;
});

function makeApp() {
  const app = express();
  registerOAuthRoutes(app);
  return app;
}

describe("OAuth state and nonce protection", () => {
  it("creates a server-owned OAuth state and nonce cookie", async () => {
    process.env.VITE_APP_ID = "mersad-test";
    process.env.VITE_OAUTH_PORTAL_URL = "https://oauth.example";
    process.env.PUBLIC_APP_ORIGIN = "http://localhost:3000";

    const response = await request(makeApp())
      .get("/api/oauth/start")
      .set("Host", "localhost:3000");

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("https://oauth.example/app-auth?");
    expect(response.headers.location).toContain("appId=mersad-test");
    expect(response.headers.location).toContain("state=");
    expect(response.headers["set-cookie"]?.some(cookie => cookie.startsWith("mersad_oauth_state="))).toBe(true);
  });

  it("rejects a callback with missing or forged state before token exchange", async () => {
    process.env.PUBLIC_APP_ORIGIN = "http://localhost:3000";

    const missingState = await request(makeApp())
      .get("/api/oauth/callback?code=attacker-code")
      .set("Host", "localhost:3000");
    expect(missingState.status).toBe(400);
    expect(missingState.body.error).toBe("Invalid OAuth state");

    const forgedState = await request(makeApp())
      .get("/api/oauth/callback?code=attacker-code&state=Zm9yZ2Vk")
      .set("Host", "localhost:3000")
      .set("Cookie", "mersad_oauth_state=attacker-nonce");
    expect(forgedState.status).toBe(400);
    expect(forgedState.body.error).toBe("Invalid OAuth state");
  });
});
