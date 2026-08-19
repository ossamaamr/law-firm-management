import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => dbMock);

import { healthRouter } from "./health.routes";

function app() {
  const instance = express();
  instance.use("/health", healthRouter);
  return instance;
}

describe("health readiness routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getDb.mockResolvedValue(null);
  });

  it("returns liveness without requiring database or storage", async () => {
    const response = await request(app()).get("/health/live");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: "ok", service: "mersad" });
    expect(dbMock.getDb).not.toHaveBeenCalled();
  });

  it("returns not_ready when the database is unavailable", async () => {
    const response = await request(app()).get("/health/ready");
    expect(response.status).toBe(503);
    expect(response.body.status).toBe("not_ready");
    expect(response.body.checks.database).toBe("unavailable");
    expect(response.body).not.toHaveProperty("JWT_SECRET");
    expect(response.body).not.toHaveProperty("apiKey");
  });

  it("reports database errors without exposing the underlying error", async () => {
    dbMock.getDb.mockResolvedValue({ execute: vi.fn().mockRejectedValue(new Error("private connection detail")) });
    const response = await request(app()).get("/health/ready");
    expect(response.status).toBe(503);
    expect(response.body.checks.database).toBe("error");
    expect(JSON.stringify(response.body)).not.toContain("private connection detail");
  });
});
