import crypto from "crypto";
import { promisify } from "util";
import { safeEqual } from "@/lib/internalAuth";

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: string, len: number) => Promise<Buffer>;

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128; // bounds scrypt work per request

export function validatePasswordStrength(password: unknown): string | null {
  if (typeof password !== "string") return "Password is required.";
  if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (password.length > MAX_PASSWORD_LENGTH) return `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`;
  return null;
}

/** Format: scrypt$<salt>$<derivedKey>. Async so it never blocks the event loop. */
export async function hashPasswordAsync(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)).toString("hex");
  return `scrypt$${salt}$${key}`;
}

// Verified against when the account does not exist, so login timing is the
// same for unknown and known emails.
const DUMMY_HASH = "scrypt$00000000000000000000000000000000$" + "0".repeat(128);

export async function verifyPasswordAsync(password: string, storedHash: string | null | undefined): Promise<boolean> {
  const stored = storedHash || DUMMY_HASH;
  if (stored.startsWith("scrypt$")) {
    const parts = stored.split("$");
    if (parts.length === 3) {
      const derived = await scrypt(password, parts[1], 64);
      const expected = Buffer.from(parts[2], "hex");
      const ok = derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
      return ok && stored !== DUMMY_HASH;
    }
    return false;
  }
  // Legacy unsalted SHA-256 (upgraded to scrypt on the next successful login).
  const legacy = crypto.createHash("sha256").update(password).digest("hex");
  return safeEqual(stored, legacy);
}
