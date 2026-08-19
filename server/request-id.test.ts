import { describe, expect, it } from "vitest";
import { requestIdMiddleware } from "./_core/request-id";

describe("request ID middleware", () => {
  it("preserves a safe supplied request ID", () => {
    const headers: Record<string, string> = {};
    const req = { header: () => "trace-123" } as any;
    const res = {
      locals: {},
      setHeader: (name: string, value: string) => { headers[name] = value; },
    } as any;
    let called = false;

    requestIdMiddleware(req, res, () => { called = true; });

    expect(called).toBe(true);
    expect(headers["x-request-id"]).toBe("trace-123");
    expect(res.locals.requestId).toBe("trace-123");
  });

  it("replaces unsafe supplied request IDs", () => {
    const headers: Record<string, string> = {};
    const req = { header: () => "<secret>\n" } as any;
    const res = {
      locals: {},
      setHeader: (name: string, value: string) => { headers[name] = value; },
    } as any;

    requestIdMiddleware(req, res, () => undefined);

    expect(headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
    expect(headers["x-request-id"]).not.toContain("secret");
  });
});
