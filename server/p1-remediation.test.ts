import { describe, expect, it } from "vitest";
import { PaymentService } from "./external-apis.service";
import { assertProductionEnv, validateProductionEnv } from "./_core/production-env";

describe("P1 remediation contracts", () => {
  it("rejects missing and placeholder production secrets", () => {
    const result = validateProductionEnv({
      appId: "mersad",
      cookieSecret: "short",
      databaseUrl: "",
      oAuthServerUrl: "",
      forgeApiUrl: "",
      forgeApiKey: "",
      isProduction: true,
      ownerOpenId: "",
    });

    expect(result.valid).toBe(false);
    expect(result.missing).toEqual(expect.arrayContaining([
      "JWT_SECRET",
      "DATABASE_URL",
      "OAUTH_SERVER_URL",
      "BUILT_IN_FORGE_API_URL",
      "BUILT_IN_FORGE_API_KEY",
    ]));
  });

  it("throws a non-secret configuration error in production", () => {
    expect(() => assertProductionEnv({
      appId: "mersad",
      cookieSecret: "short",
      databaseUrl: "",
      oAuthServerUrl: "",
      forgeApiUrl: "",
      forgeApiKey: "",
      isProduction: true,
      ownerOpenId: "",
    })).toThrow(/Production environment is not configured/);
  });

  it("never reports an unconfigured payment as successful", async () => {
    const result = await new PaymentService().processPayment(100, "SAR", "card");
    expect(result).toEqual({
      success: false,
      error: "Payment provider is not configured",
    });
  });
});
