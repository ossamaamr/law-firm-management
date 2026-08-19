import { describe, expect, it, vi } from "vitest";

const isSessionRevoked = vi.hoisted(() => vi.fn());
const revokeSession = vi.hoisted(() => vi.fn());

vi.mock("./db", () => ({
  isSessionRevoked,
  revokeSession,
}));

vi.mock("./_core/env", () => ({
  ENV: {
    cookieSecret: "mersad-test-cookie-secret",
    appId: "mersad-test",
    oAuthServerUrl: "",
  },
}));

describe("OAuth session revocation", () => {
  it("issues a jti and rejects the session after server-side revocation", async () => {
    process.env.COOKIE_SECRET = "mersad-test-cookie-secret";
    const { sdk } = await import("./_core/sdk");
    isSessionRevoked.mockResolvedValue(false);
    revokeSession.mockResolvedValue(undefined);

    const token = await sdk.signSession({
      openId: "revocation-test-user",
      appId: "mersad-test",
      name: "Revocation Test",
    });

    const verified = await sdk.verifySession(token);
    expect(verified?.openId).toBe("revocation-test-user");
    expect(verified?.jti).toEqual(expect.any(String));
    expect(token).not.toContain(verified?.jti ?? "");

    await sdk.revokeSessionCookie(token);
    expect(revokeSession).toHaveBeenCalledWith(verified?.jti);

    isSessionRevoked.mockResolvedValue(true);
    await expect(sdk.verifySession(token)).resolves.toBeNull();
  });
});
