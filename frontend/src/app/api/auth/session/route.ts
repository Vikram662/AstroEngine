import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, hashPassword, verifyPassword } from "@/lib/session";
import crypto from "crypto";

export const hashNewPassword = hashPassword;

// Memory-based rate limiter for login protection: 5 attempts per IP in 5 minutes
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return false;

  // 5 minute window
  if (now - record.firstAttempt > 5 * 60 * 1000) {
    loginAttempts.delete(ip);
    return false;
  }
  return record.count >= 6;
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now - record.firstAttempt > 5 * 60 * 1000) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  } else {
    record.count += 1;
  }
}

function clearFailedAttempts(ip: string) {
  loginAttempts.delete(ip);
}

const verifyPasswordHash = verifyPassword;



export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { status: "error", message: "Too many failed login attempts. Please wait 5 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password, action } = body;

    if (!email || !password) {
      return NextResponse.json(
        { status: "error", message: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ACTION 1: Register (Requires Verified Email OTP)
    if (action === "register") {
      const { otp } = body;

      if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
        return NextResponse.json(
          { status: "error", message: "A valid 6-digit email verification code (OTP) is required to register." },
          { status: 400 }
        );
      }

      // Check OTP in database
      const otpRecord = await prisma.emailOtp.findUnique({
        where: { email: normalizedEmail }
      });

      if (!otpRecord) {
        return NextResponse.json(
          { status: "error", message: "No verification code requested for this email. Please request an OTP first." },
          { status: 400 }
        );
      }

      if (new Date() > otpRecord.expiresAt) {
        return NextResponse.json(
          { status: "error", message: "The verification code has expired. Please request a new one." },
          { status: 400 }
        );
      }

      if (otpRecord.otp !== otp.trim()) {
        return NextResponse.json(
          { status: "error", message: "Invalid verification code. Please check your email and enter the correct 6 digits." },
          { status: 400 }
        );
      }

      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        return NextResponse.json(
          { status: "error", message: "An account with this email already exists." },
          { status: 400 }
        );
      }

      // Burn OTP immediately to prevent reuse
      await prisma.emailOtp.delete({
        where: { email: normalizedEmail }
      });

      const freeCreditsSetting = await prisma.systemSetting.findUnique({
        where: { key: "DEFAULT_FREE_CREDITS" }
      });
      const monthlyQuotaSetting = await prisma.systemSetting.findUnique({
        where: { key: "DEFAULT_MONTHLY_QUOTA" }
      });
      const starterRpmSetting = await prisma.systemSetting.findUnique({
        where: { key: "DEFAULT_STARTER_RPM" }
      });

      const initialCredits = freeCreditsSetting ? parseFloat(freeCreditsSetting.value) : 100.0;
      const initialQuota = monthlyQuotaSetting ? parseInt(monthlyQuotaSetting.value, 10) : 35000;
      const initialRpm = starterRpmSetting ? parseInt(starterRpmSetting.value, 10) : 60;

      const { generateApiKey } = await import("@/lib/apiKey");
      const keyData = generateApiKey();

      const newUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          emailVerified: true,
          password: hashNewPassword(password),
          name: normalizedEmail.split("@")[0],
          role: "USER",
          apiKeyHash: keyData.keyHash,
          apiKeyPrefix: keyData.keyPrefix,
          apiKeyCreatedAt: new Date(),
          walletBalance: isNaN(initialCredits) ? 100.0 : initialCredits,
          planTier: "STARTER",
          monthlyQuota: isNaN(initialQuota) ? 35000 : initialQuota,
          rateLimitPerMin: isNaN(initialRpm) ? 60 : initialRpm,
          monthlyUsage: 0
        }
      });

      const token = createSessionToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role
      });

      const response = NextResponse.json({
        status: "success",
        message: "Account created successfully.",
        role: newUser.role
      });

      const isProd = process.env.NODE_ENV === "production";
      response.cookies.set("astro_session_token", token, {
        path: "/",
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 72 * 3600
      });
      // Safe non-sensitive UI indicators only
      response.cookies.set("astro_session_role", newUser.role, { path: "/", httpOnly: true, secure: isProd, sameSite: "lax" });
      response.cookies.set("astro_session_email", newUser.email, { path: "/", httpOnly: true, secure: isProd, sameSite: "lax" });

      clearFailedAttempts(ip);
      return response;
    }

    // ACTION 2: Sign In
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || !verifyPasswordHash(password, user.password || "")) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { status: "error", message: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { status: "error", message: "This account has been suspended by administration." },
        { status: 403 }
      );
    }

    clearFailedAttempts(ip);

    // If password was stored in legacy single-pass sha256, upgrade to scrypt transparently
    if (user.password && !user.password.startsWith("scrypt$")) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashNewPassword(password) }
      });
    }

    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    const response = NextResponse.json({
      status: "success",
      message: `Signed in successfully as ${user.role}`,
      role: user.role
    });

    const isProd = process.env.NODE_ENV === "production";
    response.cookies.set("astro_session_token", token, {
      path: "/",
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 72 * 3600
    });
    // Set httpOnly on all session cookies to prevent document.cookie forgery
    response.cookies.set("astro_session_role", user.role, { path: "/", httpOnly: true, secure: isProd, sameSite: "lax" });
    response.cookies.set("astro_session_email", user.email, { path: "/", httpOnly: true, secure: isProd, sameSite: "lax" });

    return response;
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ status: "success", message: "Logged out" });
  response.cookies.set("astro_session_token", "", { path: "/", maxAge: 0 });
  response.cookies.set("astro_session_role", "", { path: "/", maxAge: 0 });
  response.cookies.set("astro_session_email", "", { path: "/", maxAge: 0 });
  return response;
}
