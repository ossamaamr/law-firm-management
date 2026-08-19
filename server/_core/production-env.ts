import { ENV } from "./env";

const PLACEHOLDER_VALUES = new Set([
  "",
  "change-me",
  "your-session-secret-key-change-in-production",
  "your-api-key",
  "your-secret",
]);

function isConfigured(value: string, minimumLength = 1): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.length >= minimumLength && !PLACEHOLDER_VALUES.has(normalized);
}

export type ProductionEnvValidation = {
  valid: boolean;
  missing: string[];
};

type ProductionEnv = Omit<typeof ENV, "oAuthPortalUrl" | "publicAppOrigin"> &
  Partial<Pick<typeof ENV, "oAuthPortalUrl" | "publicAppOrigin">>;

export function validateProductionEnv(env: ProductionEnv = ENV): ProductionEnvValidation {
  const required: Array<[string, string, number]> = [
    ["JWT_SECRET", env.cookieSecret, 32],
    ["VITE_APP_ID", env.appId, 1],
    ["DATABASE_URL", env.databaseUrl, 1],
    ["OAUTH_SERVER_URL", env.oAuthServerUrl, 1],
    ["VITE_OAUTH_PORTAL_URL", env.oAuthPortalUrl ?? "", 1],
    ["PUBLIC_APP_ORIGIN", env.publicAppOrigin ?? "", 1],
    ["BUILT_IN_FORGE_API_URL", env.forgeApiUrl, 1],
    ["BUILT_IN_FORGE_API_KEY", env.forgeApiKey, 1],
  ];

  const missing = required
    .filter(([, value, minimumLength]) => !isConfigured(value, minimumLength))
    .map(([name]) => name);

  return { valid: missing.length === 0, missing };
}

export function assertProductionEnv(env: ProductionEnv = ENV): void {
  if (!env.isProduction) return;

  const result = validateProductionEnv(env);
  if (!result.valid) {
    throw new Error(`Production environment is not configured: ${result.missing.join(", ")}`);
  }
}
