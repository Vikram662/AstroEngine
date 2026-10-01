import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateOtp, hashOtp, otpMatches, OTP_MAX_VERIFY_ATTEMPTS, OTP_TTL_MS } from "@/lib/otp";
import { hashPasswordAsync, validatePasswordStrength } from "@/lib/passwords";
import { SharedRateLimiter } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/clientIp";
import { notify } from "@/lib/notifications";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Reset codes live in the same EmailOtp table as sign-up codes (an email is either
// registered or not, so the two flows never collide). The hash is domain-separated
// so a sign-up code can never be replayed as a reset code.
const purpose = (email: string) => `reset:${email}`;

const requestsPerEmail = new SharedRateLimiter("reset-req-email", 3, 10 * 60 * 1000);
const requestsPerIp = new SharedRateLimiter("reset-req-ip", 10, 10 * 60 * 1000);
const guessesPerIp = new SharedRateLimiter("reset-guess-ip", 20, 10 * 60 * 1000);

function validEmail(v: unknown): v is string {
  return typeof v === "string" && v.length <= 254 && EMAIL_RE.test(v.trim());
}

// POST { email } -> emails a reset code. The response is identical whether or not the
// account exists, so this cannot be used to enumerate users.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!validEmail(body?.email)) {
      return NextResponse.json({ status: "error", message: "A valid email address is required." }, { status: 400 });
    }
    const email = body.email.toLowerCase().trim();

    if ((await requestsPerIp.hit(getClientIp(req))) || (await requestsPerEmail.hit(email))) {
      return NextResponse.json(
        { status: "error", message: "Too many requests. Please wait a few minutes before trying again." },
        { status: 429 }
      );
    }

    const generic = NextResponse.json({
      status: "success",
      message: "If an account exists for this email, a password reset code has been sent."
    });

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, isBlocked: true } });
    if (!user || user.isBlocked) return generic;

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    await prisma.emailOtp.upsert({
      where: { email },
      update: { otp: hashOtp(purpose(email), code), attempts: 0, expiresAt, createdAt: new Date() },
      create: { email, otp: hashOtp(purpose(email), code), expiresAt }
    });
    await sendPasswordResetEmail(email, code);

    return generic;
  } catch (error: unknown) {
    console.error("[auth/reset POST]", error);
    return NextResponse.json({ status: "error", message: "Could not process the request." }, { status: 500 });
  }
}

// PUT { email, otp, newPassword } -> sets the new password.
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const { otp, newPassword } = body || {};
    if (!validEmail(body?.email) || typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
      return NextResponse.json({ status: "error", message: "Email and a valid 6-digit code are required." }, { status: 400 });
    }
    const weak = validatePasswordStrength(newPassword);
    if (weak) return NextResponse.json({ status: "error", message: weak }, { status: 400 });

    const email = body.email.toLowerCase().trim();
    const ip = getClientIp(req);

    const tooMany = () =>
      NextResponse.json(
        { status: "error", message: "Too many incorrect codes. Please request a new reset code." },
        { status: 429 }
      );
    if (await guessesPerIp.isLimited(ip)) return tooMany();

    const record = await prisma.emailOtp.findUnique({ where: { email } });
    const invalid = () =>
      NextResponse.json({ status: "error", message: "Invalid or expired reset code." }, { status: 400 });

    // Attempts are stored with the code (persistent, shared across instances).
    if (record && record.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
      await prisma.emailOtp.deleteMany({ where: { id: record.id } });
      return tooMany();
    }

    if (!record || new Date() > record.expiresAt || !otpMatches(purpose(email), otp.trim(), record.otp)) {
      if (record) await prisma.emailOtp.updateMany({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
      await guessesPerIp.hit(ip);
      return invalid();
    }

    // One-time use, even under concurrent requests.
    const burned = await prisma.emailOtp.deleteMany({ where: { id: record.id } });
    if (burned.count !== 1) return invalid();

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, isBlocked: true } });
    if (!user || user.isBlocked) return invalid();

    // passwordChangedAt invalidates every session issued before the reset.
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPasswordAsync(newPassword), passwordChangedAt: new Date() }
    });

    await notify(user.id, "PASSWORD_CHANGED", { via: "password reset" });

    return NextResponse.json({ status: "success", message: "Password updated. You can now sign in." });
  } catch (error: unknown) {
    console.error("[auth/reset PUT]", error);
    return NextResponse.json({ status: "error", message: "Could not reset the password." }, { status: 500 });
  }
}
