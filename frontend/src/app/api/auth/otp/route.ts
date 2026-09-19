import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationOtpEmail } from "@/lib/email";
import crypto from "crypto";

// Rate limiting: maximum 3 OTP requests per email per 10 minutes
const otpRateLimits = new Map<string, { count: number; firstAttempt: number }>();

function isOtpRateLimited(email: string): boolean {
  const now = Date.now();
  const record = otpRateLimits.get(email);
  if (!record) return false;

  if (now - record.firstAttempt > 10 * 60 * 1000) {
    otpRateLimits.delete(email);
    return false;
  }
  return record.count >= 4;
}

function recordOtpAttempt(email: string) {
  const now = Date.now();
  const record = otpRateLimits.get(email);
  if (!record || now - record.firstAttempt > 10 * 60 * 1000) {
    otpRateLimits.set(email, { count: 1, firstAttempt: now });
  } else {
    record.count += 1;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { status: "error", message: "A valid email address is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    if (existing) {
      return NextResponse.json(
        { status: "error", message: "An account with this email already exists. Please sign in." },
        { status: 400 }
      );
    }

    // 2. Rate limit check
    if (isOtpRateLimited(normalizedEmail)) {
      return NextResponse.json(
        { status: "error", message: "Too many OTP requests. Please wait a few minutes before trying again." },
        { status: 429 }
      );
    }

    // 3. Generate secure 6-digit numeric OTP
    const otpNumber = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // 4. Upsert OTP in database
    await prisma.emailOtp.upsert({
      where: { email: normalizedEmail },
      update: {
        otp: otpNumber,
        expiresAt,
        createdAt: new Date()
      },
      create: {
        email: normalizedEmail,
        otp: otpNumber,
        expiresAt
      }
    });

    recordOtpAttempt(normalizedEmail);

    // 5. Send Email via SMTP / dev logger
    await sendVerificationOtpEmail(normalizedEmail, otpNumber);

    return NextResponse.json({
      status: "success",
      message: `A 6-digit verification code has been sent to ${normalizedEmail}.`
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("OTP generation error:", err);
    return NextResponse.json(
      { status: "error", message: err.message || "Failed to send verification code." },
      { status: 500 }
    );
  }
}
