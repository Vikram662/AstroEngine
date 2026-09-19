// Web Crypto compatible session token signing & verification
// Works in both Node.js and Edge Runtime (Next.js middleware) without requiring 'crypto' module

export interface SessionPayload {
  userId: string;
  email: string;
  role: "USER" | "SUPPORT_ADMIN" | "BILLING_ADMIN" | "AUDITOR" | "ADMIN" | "SUPER_ADMIN";
  exp: number; // Unix timestamp in seconds
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.ASTRO_INTERNAL_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL SECURITY ERROR: SESSION_SECRET or ASTRO_INTERNAL_SECRET must be defined in production environment.");
    }
    return "sec_astro_enterprise_session_sign_key_2026_salt_dev_only";
  }
  return secret;
}

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  if (typeof atob === "function") {
    return atob(base64);
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Creates a cryptographically signed session token using Web Crypto (Edge + Node compatible)
 */
export async function createSessionToken(
  data: { userId: string; email: string; role: string },
  expiresInHours: number = 72
): Promise<string> {
  const secret = getSessionSecret();
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
  const payload: SessionPayload = {
    userId: data.userId,
    email: data.email.toLowerCase().trim(),
    role: data.role as SessionPayload["role"],
    exp
  };

  const enc = new TextEncoder();
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(enc.encode(payloadJson));

  const key = await getHmacKey(secret);
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  const signature = base64UrlEncode(sigBuffer);

  return `${payloadB64}.${signature}`;
}

/**
 * Synchronous / fallback token verification for backward compatibility
 * Also supports async verifySessionTokenAsync for complete Web Crypto
 */
export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;

  try {
    const secret = getSessionSecret();
    const enc = new TextEncoder();
    const key = await getHmacKey(secret);

    // Decode signature from base64url
    let base64 = signature.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const rawSigStr = typeof atob === "function" ? atob(base64) : Buffer.from(base64, "base64").toString("binary");
    const sigBytes = new Uint8Array(rawSigStr.length);
    for (let i = 0; i < rawSigStr.length; i++) {
      sigBytes[i] = rawSigStr.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(payloadB64));
    if (!isValid) return null;

    const payloadJson = base64UrlDecode(payloadB64);
    const payload: SessionPayload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
