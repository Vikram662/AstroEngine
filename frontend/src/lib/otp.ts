import crypto from "crypto";
import { getSessionSecret } from "@/lib/sessionSecret";
import { safeEqual } from "@/lib/internalAuth";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_VERIFY_ATTEMPTS = 5;

/** 6-digit code, uniformly distributed over 000000-999999 range (100000-999999). */
export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/** OTPs are stored as keyed hashes so a DB leak does not reveal live codes. */
export function hashOtp(email: string, otp: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(`otp:${email}:${otp}`).digest("hex");
}

export function otpMatches(email: string, otp: string, storedHash: string): boolean {
  return safeEqual(hashOtp(email, otp), storedHash);
}
