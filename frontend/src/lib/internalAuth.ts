import crypto from "crypto";

/** Constant-time string comparison that is safe for inputs of different length. */
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function getInternalSecret(): string {
  const secret = process.env.ASTRO_INTERNAL_SECRET;
  if (!secret) {
    throw new Error("CRITICAL SECURITY ERROR: ASTRO_INTERNAL_SECRET must be configured in environment.");
  }
  return secret;
}

/** True when the request carries the valid service-to-service secret header. */
export function hasValidInternalSecret(req: Request): boolean {
  const provided = req.headers.get("x-internal-secret");
  if (!provided) return false;
  return safeEqual(provided, getInternalSecret());
}
