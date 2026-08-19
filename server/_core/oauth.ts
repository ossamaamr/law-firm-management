import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { parse as parseCookieHeader } from "cookie";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { configuredAppOrigin } from "./request-security";
import { sdk } from "./sdk";

const OAUTH_STATE_COOKIE = "mersad_oauth_state";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function getCookie(req: Request, name: string): string | undefined {
  return parseCookieHeader(req.headers.cookie ?? "")[name];
}

function equalSecret(left: string | undefined, right: string | undefined): boolean {
  if (!left || !right) return false;
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function getCallbackRedirectUri(req: Request): string | null {
  const origin = configuredAppOrigin(req);
  return origin ? `${origin}/api/oauth/callback` : null;
}

function encodeOAuthState(redirectUri: string, nonce: string): string {
  return Buffer.from(`${redirectUri}|${nonce}`, "utf8").toString("base64");
}

function decodeOAuthState(state: string): { redirectUri: string; nonce: string } | null {
  try {
    const decoded = Buffer.from(state, "base64").toString("utf8");
    const separator = decoded.lastIndexOf("|");
    if (separator <= 0 || separator === decoded.length - 1) return null;
    return {
      redirectUri: decoded.slice(0, separator),
      nonce: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

function clearOAuthStateCookie(req: Request, res: Response): void {
  const options = getSessionCookieOptions(req);
  res.clearCookie(OAUTH_STATE_COOKIE, {
    ...options,
    sameSite: "lax",
    httpOnly: true,
    maxAge: 0,
  });
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/start", (req: Request, res: Response) => {
    const portalUrl = process.env.VITE_OAUTH_PORTAL_URL;
    const appId = process.env.VITE_APP_ID;
    const redirectUri = getCallbackRedirectUri(req);

    if (!portalUrl || !appId || !redirectUri) {
      res.status(503).json({ error: "OAuth is not configured" });
      return;
    }

    let portal: URL;
    try {
      portal = new URL(portalUrl);
    } catch {
      res.status(503).json({ error: "OAuth portal URL is invalid" });
      return;
    }

    const nonce = randomBytes(32).toString("hex");
    const state = encodeOAuthState(redirectUri, nonce);
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(OAUTH_STATE_COOKIE, nonce, {
      ...cookieOptions,
      sameSite: "lax",
      httpOnly: true,
      path: "/api/oauth",
      maxAge: OAUTH_STATE_TTL_MS,
    });

    portal.pathname = `${portal.pathname.replace(/\/$/, "")}/app-auth`;
    portal.searchParams.set("appId", appId);
    portal.searchParams.set("redirectUri", redirectUri);
    portal.searchParams.set("state", state);
    portal.searchParams.set("type", "signIn");
    res.redirect(302, portal.toString());
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const stateCookie = getCookie(req, OAUTH_STATE_COOKIE);
    const redirectUri = getCallbackRedirectUri(req);
    const decodedState = state ? decodeOAuthState(state) : null;

    if (
      !code ||
      !state ||
      !stateCookie ||
      !redirectUri ||
      !decodedState ||
      decodedState.redirectUri !== redirectUri ||
      !equalSecret(decodedState.nonce, stateCookie)
    ) {
      clearOAuthStateCookie(req, res);
      res.status(400).json({ error: "Invalid OAuth state" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      clearOAuthStateCookie(req, res);
      res.redirect(302, "/");
    } catch (error) {
      clearOAuthStateCookie(req, res);
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
