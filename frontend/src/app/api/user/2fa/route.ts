import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";
import { verifyPasswordAsync } from "@/lib/passwords";
import { decryptSetting, encryptSetting } from "@/lib/secretBox";
import { generateTotpSecret, otpauthUri, verifyTotp } from "@/lib/totp";
import { SharedRateLimiter } from "@/lib/rateLimit";

// 5 wrong codes / passwords per user per 10 minutes on every 2FA management action.
const failures = new SharedRateLimiter("2fa-manage", 5, 10 * 60 * 1000);

const fail = (message: string, status = 400) => NextResponse.json({ status: "error", message }, { status });

// GET -> { enabled }
export async function GET() {
  const session = await getVerifiedSession();
  if (!session) return fail("Unauthorized.", 401);
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { totpEnabled: true } });
  return NextResponse.json({ status: "success", enabled: Boolean(user?.totpEnabled) });
}

// POST { action: "setup" | "enable" | "disable", code?, password? }
export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedSession();
    if (!session) return fail("Unauthorized.", 401);

    const body = await req.json().catch(() => null);
    const action = body?.action;
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, password: true, totpSecret: true, totpEnabled: true, totpLastStep: true }
    });
    if (!user) return fail("User not found.", 404);

    if (action === "setup") {
      if (user.totpEnabled) return fail("Two-factor authentication is already enabled.");
      const secret = generateTotpSecret();
      // Stored but inactive until the user proves their app works (action: "enable").
      await prisma.user.update({ where: { id: user.id }, data: { totpSecret: encryptSetting(secret), totpEnabled: false } });
      return NextResponse.json({ status: "success", secret, uri: otpauthUri(user.email, secret) });
    }

    if (action === "enable") {
      if (user.totpEnabled) return fail("Two-factor authentication is already enabled.");
      if (!user.totpSecret) return fail("Start the setup first.");
      if (await failures.isLimited(user.id)) return fail("Too many attempts. Try again in a few minutes.", 429);

      const step = verifyTotp(decryptSetting(user.totpSecret), code);
      if (step === null) {
        await failures.hit(user.id);
        return fail("Invalid code. Check the time on your phone and try again.");
      }
      await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true, totpLastStep: step } });
      return NextResponse.json({ status: "success", message: "Two-factor authentication enabled." });
    }

    if (action === "disable") {
      if (!user.totpEnabled || !user.totpSecret) return fail("Two-factor authentication is not enabled.");
      if (await failures.isLimited(user.id)) return fail("Too many attempts. Try again in a few minutes.", 429);

      const password = typeof body?.password === "string" ? body.password : "";
      const passwordOk = await verifyPasswordAsync(password, user.password);
      const step = verifyTotp(decryptSetting(user.totpSecret), code);
      if (!passwordOk || step === null || step <= (user.totpLastStep ?? -1)) {
        await failures.hit(user.id);
        return fail("Password or code is incorrect.");
      }
      await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: false, totpSecret: null, totpLastStep: null } });
      return NextResponse.json({ status: "success", message: "Two-factor authentication disabled." });
    }

    return fail("Invalid action.");
  } catch (error: unknown) {
    console.error("[user/2fa]", error);
    return fail("Request failed. Please try again.", 500);
  }
}
