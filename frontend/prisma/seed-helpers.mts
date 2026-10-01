// Shared helpers for the seed scripts. Relative imports with explicit .ts
// extensions so the scripts run directly on Node 22+ (no ts-node / path aliases).
import crypto from "crypto";
import { generateApiKey } from "../src/lib/apiKey.ts";

/** Same format as src/lib/session.ts / passwords.ts: scrypt$<salt>$<key>. */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  return `scrypt$${salt}$${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

/** Uses the env value when set, otherwise a random password (shown once, never a known default). */
export function passwordFromEnvOrRandom(envValue: string | undefined): { value: string; generated: boolean } {
  if (envValue) return { value: envValue, generated: false };
  return { value: crypto.randomBytes(18).toString("base64url"), generated: true };
}

/** API key for a seeded account. The raw key is only ever printed by the seed script. */
export function apiKeyFromEnvOrNew(envRaw?: string) {
  if (envRaw) {
    return {
      rawKey: envRaw,
      keyPrefix: envRaw.substring(0, 16),
      keyHash: crypto.createHash("sha256").update(envRaw).digest("hex"),
    };
  }
  return generateApiKey();
}

export function refuseInProduction(scriptName: string) {
  if (process.env.NODE_ENV === "production") {
    console.error(`CRITICAL: ${scriptName} is disabled in production to prevent credential resets.`);
    process.exit(0);
  }
}
