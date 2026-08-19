import { Router } from "express";
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { ENV } from "./_core/env";
import { validateProductionEnv } from "./_core/production-env";

export const healthRouter = Router();

const startedAt = Date.now();

healthRouter.get("/live", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "mersad",
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
  });
});

healthRouter.get("/ready", async (_req, res) => {
  const requestStartedAt = Date.now();
  const productionConfig = validateProductionEnv();
  const checks = {
    database: "unavailable" as "ok" | "unavailable" | "error",
    storage: ENV.forgeApiUrl && ENV.forgeApiKey ? "configured" : "unconfigured",
    configuration: ENV.isProduction
      ? (productionConfig.valid ? "ok" : "unconfigured")
      : "skipped",
  };

  const db = await getDb();
  if (db) {
    try {
      await db.execute(sql`SELECT 1`);
      checks.database = "ok";
    } catch {
      checks.database = "error";
    }
  }

  const ready = checks.database === "ok"
    && checks.storage === "configured"
    && (!ENV.isProduction || checks.configuration === "ok");
  res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "not_ready",
    checks,
    responseTimeMs: Date.now() - requestStartedAt,
  });
});
