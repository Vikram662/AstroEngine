import crypto from "crypto";

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.ASTRO_INTERNAL_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL SECURITY FATAL: SESSION_SECRET or ASTRO_INTERNAL_SECRET must be configured in production environment.");
    }
    return "sec_astro_enterprise_session_sign_key_2026_salt_dev_only";
  }
  return secret;
}

const SESSION_SECRET = getSessionSecret();

export interface SessionPayload {
  userId: string;
  email: string;
  role: "USER" | "SUPPORT_ADMIN" | "BILLING_ADMIN" | "AUDITOR" | "ADMIN" | "SUPER_ADMIN";
  exp: number; // Unix timestamp in seconds
}

/**
 * Creates a cryptographically signed session token:
 * base64url(payload) + "." + hmac_sha256(base64url(payload), SESSION_SECRET)
 */
export function createSessionToken(data: { userId: string; email: string; role: string }, expiresInHours: number = 72): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
  const payload: SessionPayload = {
    userId: data.userId,
    email: data.email.toLowerCase().trim(),
    role: data.role as SessionPayload["role"],
    exp
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a signed session token.
 * Returns decoded SessionPayload if valid and not expired, otherwise null.
 */
export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadB64)
    .digest("base64url");

  // Constant-time comparison to prevent timing attacks
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload: SessionPayload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Generates a salted scrypt hash for passwords:
 * scrypt$<salt>$<derivedKey>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derivedKey}`;
}

/**
 * Constant-time password verification supporting salted scrypt and legacy SHA-256.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;

  // Salted scrypt format: scrypt$<salt>$<hash>
  if (storedHash.startsWith("scrypt$")) {
    const parts = storedHash.split("$");
    if (parts.length === 3) {
      const salt = parts[1];
      const expectedKey = parts[2];
      const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
      const a = Buffer.from(derivedKey, "hex");
      const b = Buffer.from(expectedKey, "hex");
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    }
  }

  // Legacy SHA-256 fallback compatibility check
  const sha256Hashed = crypto.createHash("sha256").update(password).digest("hex");
  if (storedHash === sha256Hashed) {
    return true;
  }

  return false;
}

