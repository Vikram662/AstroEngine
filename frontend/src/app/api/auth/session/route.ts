import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, action } = body;

    if (!email || !password) {
      return NextResponse.json(
        { status: "error", message: "Email and password are required." },
        { status: 400 }
      );
    }

    const hashedPassword = hashPassword(password);

    // ACTION 1: Register (For normal users)
    if (action === "register") {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { status: "error", message: "An account with this email already exists." },
          { status: 400 }
        );
      }

      // Fetch dynamic signup defaults configured by Admin in SystemSetting table
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

      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: email.split("@")[0],
          role: "USER",
          apiKeyHash: crypto.randomBytes(32).toString("hex"),
          apiKeyPrefix: `ak_live_${crypto.randomBytes(4).toString("hex")}`,
          walletBalance: isNaN(initialCredits) ? 100.0 : initialCredits,
          planTier: "STARTER",
          monthlyQuota: isNaN(initialQuota) ? 35000 : initialQuota,
          rateLimitPerMin: isNaN(initialRpm) ? 60 : initialRpm,
          monthlyUsage: 0
        }
      });

      const response = NextResponse.json({
        status: "success",
        message: "Account created successfully.",
        role: newUser.role
      });

      response.cookies.set("astro_session_role", newUser.role, { path: "/", httpOnly: false });
      response.cookies.set("astro_session_email", newUser.email, { path: "/", httpOnly: false });
      return response;
    }

    // ACTION 2: Sign In
    let user = await prisma.user.findUnique({ where: { email } });

    // Seed Super Admin automatically if logging in with default master admin credentials
    if (!user && email === "admin@astroengine.io") {
      user = await prisma.user.create({
        data: {
          email: "admin@astroengine.io",
          password: hashPassword("Admin@12345"),
          name: "Master Administrator",
          role: "ADMIN",
          apiKeyHash: crypto.randomBytes(32).toString("hex"),
          apiKeyPrefix: "ak_live_admin_root",
          walletBalance: 999999.0,
          planTier: "ENTERPRISE",
          monthlyQuota: 1000000,
          monthlyUsage: 0
        }
      });
    }

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "Account not found. Please check your credentials." },
        { status: 401 }
      );
    }

    // Validate Password
    if (user.password && user.password !== hashedPassword) {
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

    const response = NextResponse.json({
      status: "success",
      message: `Signed in successfully as ${user.role}`,
      role: user.role
    });

    response.cookies.set("astro_session_role", user.role, { path: "/", httpOnly: false });
    response.cookies.set("astro_session_email", user.email, { path: "/", httpOnly: false });
    return response;
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ status: "success", message: "Logged out" });
  response.cookies.set("astro_session_role", "", { path: "/", maxAge: 0 });
  response.cookies.set("astro_session_email", "", { path: "/", maxAge: 0 });
  return response;
}
