import crypto from "crypto";

export interface GeneratedKeyResult {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
}

/**
 * Generates a secure API key, its display prefix, and SHA-256 hash.
 * Follows Stripe/GitHub secret token security standard (§12.1).
 */
export function generateApiKey(): GeneratedKeyResult {
  // 32 bytes of cryptographically secure random entropy
  const randomEntropy = crypto.randomBytes(24).toString("hex");
  const rawKey = `ak_live_${randomEntropy}`;
  
  // Safe prefix for UI identification: e.g. "ak_live_a1b2c3d4"
  const keyPrefix = rawKey.substring(0, 16);
  
  // SHA-256 hash for database storage (rawKey is never persisted)
  const keyHash = hashApiKey(rawKey);

  return {
    rawKey,
    keyPrefix,
    keyHash,
  };
}

/**
 * SHA-256 hashing helper
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}
