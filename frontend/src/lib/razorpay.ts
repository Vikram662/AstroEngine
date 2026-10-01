import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { safeEqual } from "@/lib/internalAuth";
import { decryptSetting } from "@/lib/secretBox";

// Values that older versions of the seed script wrote into the database. They
// are public (they live in the git history) so they must never be trusted.
const KNOWN_DUMMY_VALUES = new Set([
  "whsec_astro_enterprise_live2026",
  "s8e8w9f0a1b2c3d4e5f6g7h8",
  "rzp_test_1DP5mmOlF5G5ag",
]);

export function isUnusableSecret(v?: string | null): boolean {
  if (!v || !v.trim()) return true;
  const lower = v.toLowerCase();
  return (
    KNOWN_DUMMY_VALUES.has(v) ||
    lower.includes("placeholder") ||
    lower.includes("mock") ||
    lower.includes("test_mock")
  );
}

async function resolveSetting(key: string, envName: string): Promise<string | null> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  const dbValue = row ? decryptSetting(row.value) : "";
  if (dbValue && !isUnusableSecret(dbValue)) return dbValue;
  const env = process.env[envName];
  return isUnusableSecret(env) ? null : (env as string);
}

export async function getRazorpayCredentials(): Promise<{ keyId: string; keySecret: string } | null> {
  const [keyId, keySecret] = await Promise.all([
    resolveSetting("RAZORPAY_KEY_ID", "RAZORPAY_KEY_ID"),
    resolveSetting("RAZORPAY_KEY_SECRET", "RAZORPAY_KEY_SECRET"),
  ]);
  return keyId && keySecret ? { keyId, keySecret } : null;
}

export async function getRazorpayKeySecret(): Promise<string | null> {
  return resolveSetting("RAZORPAY_KEY_SECRET", "RAZORPAY_KEY_SECRET");
}

export async function getRazorpayWebhookSecret(): Promise<string | null> {
  return resolveSetting("RAZORPAY_WEBHOOK_SECRET", "RAZORPAY_WEBHOOK_SECRET");
}

/** Hex HMAC-SHA256 verification; never throws on malformed or short signatures. */
export function verifyHmacHex(payload: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return safeEqual(expected, signature);
}

/** Wallet credits granted for a verified payment amount (volume bonus tiers). */
export function creditsForAmount(amount: number): number {
  if (amount >= 10000) return amount * 1.25;
  if (amount >= 5000) return amount * 1.16;
  if (amount >= 2000) return amount * 1.1;
  return amount;
}

export const PAID_PLAN_TIERS = ["STARTER", "PRO", "ENTERPRISE"] as const;
export type PlanTier = (typeof PAID_PLAN_TIERS)[number];
export function isPlanTier(v: unknown): v is PlanTier {
  return typeof v === "string" && (PAID_PLAN_TIERS as readonly string[]).includes(v);
}
