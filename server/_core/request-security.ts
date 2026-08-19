import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, RequestHandler, Response } from "express";
import { parse as parseCookieHeader } from "cookie";

export const CSRF_COOKIE_NAME = "mersad_csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const LOCAL_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://[::1]:3000",
]);

function normalizeOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isSecureRequest(req: Request): boolean {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  const values = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto?.split(",") ?? [];
  return values.some(value => value.trim().toLowerCase() === "https");
}

function requestOrigin(req: Request): string | null {
  const protocol = isSecureRequest(req) ? "https" : "http";
  return normalizeOrigin(`${protocol}://${req.get("host") ?? ""}`);
}

export function configuredAppOrigin(req: Request): string | null {
  return normalizeOrigin(process.env.PUBLIC_APP_ORIGIN) ?? requestOrigin(req);
}

export function issueCsrfToken(res: Response, req: Request): string {
  const token = randomBytes(32).toString("hex");
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: isSecureRequest(req),
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
  });
  return token;
}

function getCsrfCookie(req: Request): string | undefined {
  const cookies = parseCookieHeader(req.headers.cookie ?? "");
  return cookies[CSRF_COOKIE_NAME];
}

export const csrfCookieMiddleware: RequestHandler = (req, res, next) => {
  if (!getCsrfCookie(req)) issueCsrfToken(res, req);
  next();
};

function safeEqual(left: string, right: string): boolean {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function validateRequestOrigin(req: Request): boolean {
  const supplied = normalizeOrigin(
    typeof req.headers.origin === "string"
      ? req.headers.origin
      : typeof req.headers.referer === "string"
        ? req.headers.referer
        : undefined
  );
  const expected = configuredAppOrigin(req);
  if (!supplied || !expected) return false;
  if (supplied === expected) return true;
  return !process.env.PUBLIC_APP_ORIGIN && LOCAL_ORIGINS.has(supplied) && LOCAL_ORIGINS.has(expected);
}

export const csrfProtectionMiddleware: RequestHandler = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  if (!validateRequestOrigin(req)) {
    res.status(403).json({ error: "Request origin is not allowed" });
    return;
  }

  const cookieToken = getCsrfCookie(req);
  const headerToken = req.get(CSRF_HEADER_NAME);
  if (
    typeof cookieToken !== "string" ||
    typeof headerToken !== "string" ||
    cookieToken.length < 32 ||
    !safeEqual(cookieToken, headerToken)
  ) {
    res.status(403).json({ error: "CSRF validation failed" });
    return;
  }

  next();
};

type RateLimitEntry = { count: number; resetAt: number };
const rateLimitEntries = new Map<string, RateLimitEntry>();

export function createRateLimitMiddleware(limit: number, windowMs: number): RequestHandler {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.socket.remoteAddress ?? "unknown"}:${req.path}`;
    const current = rateLimitEntries.get(key);
    const entry = !current || now >= current.resetAt
      ? { count: 1, resetAt: now + windowMs }
      : { count: current.count + 1, resetAt: current.resetAt };

    rateLimitEntries.set(key, entry);
    if (rateLimitEntries.size > 10000) {
      rateLimitEntries.forEach((value, entryKey) => {
        if (now >= value.resetAt) rateLimitEntries.delete(entryKey);
      });
    }

    if (entry.count > limit) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      res.status(429).json({ error: "Too many requests" });
      return;
    }
    next();
  };
}

export const securityHeadersMiddleware: RequestHandler = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  next();
};
