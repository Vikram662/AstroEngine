import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken } from "@/lib/session";
import { hashPasswordAsync, validatePasswordStrength, verifyPasswordAsync } from "@/lib/passwords";
import { otpMatches, OTP_MAX_VERIFY_ATTEMPTS } from "@/lib/otp";
import { RateLimiter } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/clientIp";

// Failed sign-ins: 6 per IP and 8 per account per 5 minutes.
const loginFailsByIp = new RateLimiter(6, 5 * 60 * 1000);
const loginFailsByEmail = new RateLimiter(8, 5 * 60 * 1000);
// Wrong OTP guesses per email; exceeding the cap burns the OTP.
const otpFailsByEmail = new RateLimiter(OTP_MAX_VERIFY_ATTEMPTS, 10 * 60 * 1000);

function tooMany(message: string) {
  return NextResponse.json({ status: "error", message }, { status: 429 });
}

function setSessionCookies(response: NextResponse, token: string, user: { role: string; email: string }) {
  const isProd = process.env.NODE_ENV === "production";
  const base = { path: "/", httpOnly: true, secure: isProd, sameSite: "lax" as const };
  response.cookies.set("astro_session_token", token, { ...base, maxAge: 72 * 3600 });
  response.cookies.set("astro_session_role", user.role, base);
  response.cookies.set("astro_session_email", user.email, base);
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    if (loginFailsByIp.isLimited(ip)) {
      return tooMany("Too many failed attempts. Please wait 5 minutes.");
    }

    const body = await req.json().catch(() => null);
    const { email, password, action } = body || {};

    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return NextResponse.json(
        { status: "error", message: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ACTION 1: Register (requires a verified email OTP)
    if (action === "register") {
      const { otp } = body;

      const weak = validatePasswordStrength(password);
      if (weak) {
        return NextResponse.json({ status: "error", message: weak }, { status: 400 });
      }

      if (!otp || typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
        return NextResponse.json(
          { status: "error", message: "A valid 6-digit email verification code (OTP) is required to register." },
          { status: 400 }
        );
      }

      if (otpFailsByEmail.isLimited(normalizedEmail)) {
        await prisma.emailOtp.deleteMany({ where: { email: normalizedEmail } });
        return tooMany("Too many incorrect codes. Please request a new verification code.");
      }

      const otpRecord = await prisma.emailOtp.findUnique({ where: { email: normalizedEmail } });

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

      if (!otpMatches(normalizedEmail, otp.trim(), otpRecord.otp)) {
        otpFailsByEmail.hit(normalizedEmail);
        loginFailsByIp.hit(ip);
        return NextResponse.json(
          { status: "error", message: "Invalid verification code. Please check your email and enter the correct 6 digits." },
          { status: 400 }
        );
      }

      // Burn the OTP atomically: only one concurrent request can consume it.
      const burned = await prisma.emailOtp.deleteMany({ where: { id: otpRecord.id } });
      if (burned.count !== 1) {
        return NextResponse.json(
          { status: "error", message: "This verification code was already used. Please request a new one." },
          { status: 400 }
        );
      }
      otpFailsByEmail.reset(normalizedEmail);

      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
      if (existing) {
        return NextResponse.json(
          { status: "error", message: "Unable to register with this email. Please sign in or reset your password." },
          { status: 400 }
        );
      }

      const settings = await prisma.systemSetting.findMany({
        where: { key: { in: ["DEFAULT_FREE_CREDITS", "DEFAULT_MONTHLY_QUOTA", "DEFAULT_STARTER_RPM"] } }
      });
      const setting = (k: string) => settings.find((s: { key: string; value: string }) => s.key === k)?.value;

      const credits = parseFloat(setting("DEFAULT_FREE_CREDITS") ?? "");
      const quota = parseInt(setting("DEFAULT_MONTHLY_QUOTA") ?? "", 10);
      const rpm = parseInt(setting("DEFAULT_STARTER_RPM") ?? "", 10);

      const { generateApiKey } = await import("@/lib/apiKey");
      const keyData = generateApiKey();

      const newUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          emailVerified: true,
          password: await hashPasswordAsync(password),
          name: normalizedEmail.split("@")[0],
          role: "USER",
          apiKeyHash: keyData.keyHash,
          apiKeyPrefix: keyData.keyPrefix,
          apiKeyCreatedAt: new Date(),
          walletBalance: isNaN(credits) ? 100.0 : credits,
          planTier: "STARTER",
          monthlyQuota: isNaN(quota) ? 35000 : quota,
          rateLimitPerMin: isNaN(rpm) ? 60 : rpm,
          monthlyUsage: 0
        }
      });

      const token = createSessionToken({ userId: newUser.id, email: newUser.email, role: newUser.role });
      const response = NextResponse.json({
        status: "success",
        message: "Account created successfully.",
        role: newUser.role
      });
      setSessionCookies(response, token, newUser);
      return response;
    }

    // ACTION 2: Sign in
    if (loginFailsByEmail.isLimited(normalizedEmail)) {
      return tooMany("Too many failed attempts for this account. Please wait a few minutes.");
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Always run the hash comparison (dummy hash for unknown emails) so response
    // timing does not reveal whether the account exists.
    const passwordOk = await verifyPasswordAsync(password, user?.password);
    if (!user || !passwordOk) {
      loginFailsByIp.hit(ip);
      loginFailsByEmail.hit(normalizedEmail);
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

    loginFailsByIp.reset(ip);
    loginFailsByEmail.reset(normalizedEmail);

    // Transparently upgrade legacy unsalted SHA-256 hashes to scrypt.
    if (user.password && !user.password.startsWith("scrypt$")) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: await hashPasswordAsync(password) }
      });
    }

    const token = createSessionToken({ userId: user.id, email: user.email, role: user.role });
    const response = NextResponse.json({
      status: "success",
      message: `Signed in successfully as ${user.role}`,
      role: user.role
    });
    setSessionCookies(response, token, user);
    return response;
  } catch (err: unknown) {
    console.error("Auth session error:", err);
    return NextResponse.json({ status: "error", message: "Authentication failed. Please try again." }, { status: 500 });
  }
}

export async function DELETE() {
  const isProd = process.env.NODE_ENV === "production";
  const base = { path: "/", httpOnly: true, secure: isProd, sameSite: "lax" as const, maxAge: 0 };
  const response = NextResponse.json({ status: "success", message: "Logged out" });
  response.cookies.set("astro_session_token", "", base);
  response.cookies.set("astro_session_role", "", base);
  response.cookies.set("astro_session_email", "", base);
  return response;
}
