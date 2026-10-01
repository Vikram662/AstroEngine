import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationOtpEmail } from "@/lib/email";
import { generateOtp, hashOtp, OTP_TTL_MS } from "@/lib/otp";
import { SharedRateLimiter } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/clientIp";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 3 codes per email and 10 per IP in 10 minutes.
const perEmail = new SharedRateLimiter("perEmail", 3, 10 * 60 * 1000);
const perIp = new SharedRateLimiter("perIp", 10, 10 * 60 * 1000);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = body?.email;

    if (typeof email !== "string" || email.length > 254 || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json(
        { status: "error", message: "A valid email address is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (await perIp.hit(getClientIp(req)) || await perEmail.hit(normalizedEmail)) {
      return NextResponse.json(
        { status: "error", message: "Too many OTP requests. Please wait a few minutes before trying again." },
        { status: 429 }
      );
    }

    // Same response whether or not the account exists, so this endpoint cannot
    // be used to enumerate registered emails. Existing accounts get no OTP.
    const genericResponse = NextResponse.json({
      status: "success",
      message: "If this email can be registered, a 6-digit verification code has been sent to it."
    });

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
    if (existing) return genericResponse;

    const otp = generateOtp();
    const otpHash = hashOtp(normalizedEmail, otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await prisma.emailOtp.upsert({
      where: { email: normalizedEmail },
      update: { otp: otpHash, attempts: 0, expiresAt, createdAt: new Date() },
      create: { email: normalizedEmail, otp: otpHash, expiresAt }
    });

    await sendVerificationOtpEmail(normalizedEmail, otp);

    return genericResponse;
  } catch (error: unknown) {
    console.error("OTP generation error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to send verification code." },
      { status: 500 }
    );
  }
}
