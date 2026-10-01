import crypto from "crypto";

// RFC 6238 time-based one-time passwords (SHA-1, 6 digits, 30 s step), compatible
// with Google Authenticator, Authy, 1Password, Microsoft Authenticator, etc.

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;

export function generateTotpSecret(): string {
  const bytes = crypto.randomBytes(20);
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

function base32Decode(input: string): Buffer {
  let bits = "";
  for (const c of input.replace(/=+$/, "").toUpperCase()) {
    const idx = B32.indexOf(c);
    if (idx === -1) throw new Error("Invalid base32 secret");
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function totpAtStep(secret: string, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = crypto.createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return (code % 1_000_000).toString().padStart(6, "0");
}

export function currentStep(nowMs = Date.now()): number {
  return Math.floor(nowMs / 1000 / STEP_SECONDS);
}

/**
 * Checks a user-supplied code against the current step and +/- `window` steps
 * (clock drift). Returns the matching step, or null. The caller must store the
 * step and refuse anything <= the last accepted one, so a code works only once.
 */
export function verifyTotp(secret: string, code: string, nowMs = Date.now(), window = 1): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const base = currentStep(nowMs);
  let matched: number | null = null;
  for (let w = -window; w <= window; w++) {
    const step = base + w;
    const expected = Buffer.from(totpAtStep(secret, step));
    const given = Buffer.from(code);
    // No early exit: every candidate is compared, in constant time.
    if (crypto.timingSafeEqual(expected, given) && matched === null) matched = step;
  }
  return matched;
}

export function otpauthUri(email: string, secret: string, issuer = "AstroEngine"): string {
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=${STEP_SECONDS}`;
}
