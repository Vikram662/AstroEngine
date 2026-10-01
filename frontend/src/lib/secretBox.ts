import crypto from "crypto";

// Application-level encryption for secrets stored in the SystemSetting table
// (Razorpay secrets, R2 secret key, SMTP password). AES-256-GCM, key derived from
// SETTINGS_ENCRYPTION_KEY. Without that variable values are stored as before, so the
// feature is opt-in. Once it is set, new writes are encrypted and old plaintext rows
// keep working until they are re-saved or `npm run encrypt-settings` is run.

const PREFIX = "enc:v1:";

/** Setting keys whose values are encrypted at rest. */
export const ENCRYPTED_SETTING_KEYS = [
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "R2_SECRET_ACCESS_KEY",
  "SMTP_PASSWORD",
];

function getKey(): Buffer | null {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!raw) return null;
  return crypto.createHash("sha256").update(`astroengine-settings:${raw}`).digest();
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

/** Encrypts when a key is configured; otherwise returns the value unchanged. */
export function encryptSetting(plain: string): string {
  const key = getKey();
  if (!key || !plain || isEncrypted(plain)) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${ct.toString("base64url")}`;
}

/** Decrypts values written by encryptSetting; plaintext passes through unchanged. */
export function decryptSetting(value: string | null | undefined): string {
  if (!value) return "";
  if (!isEncrypted(value)) return value;
  const key = getKey();
  if (!key) {
    console.error("[secretBox] encrypted setting found but SETTINGS_ENCRYPTION_KEY is not configured");
    return "";
  }
  try {
    const [iv, tag, ct] = value.slice(PREFIX.length).split(".");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    console.error("[secretBox] failed to decrypt a setting (wrong SETTINGS_ENCRYPTION_KEY or corrupted value)");
    return "";
  }
}
