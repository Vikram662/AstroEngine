import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";
import { createSessionToken } from "@/lib/session";
import { hashPasswordAsync, validatePasswordStrength, verifyPasswordAsync } from "@/lib/passwords";
import { toJsonSafe } from "@/lib/money";
import { publicMessage } from "@/lib/apiErrors";

export async function GET() {
  try {
    const session = await getVerifiedSession();
    if (!session || !session.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const sessionEmail = session.email;

    const user = await prisma.user.findUnique({
      where: { email: sessionEmail },
      include: {
        subscription: true,
        apiLogs: {
          orderBy: { createdAt: "desc" },
          take: 5
        }
      }
    });

    if (!user) {
      return NextResponse.json({ status: "error", message: "User account not found." }, { status: 404 });
    }

    // Format logs with BigInt converted to string
    const formattedLogs = user.apiLogs.map((l: { id: bigint; createdAt: Date;[key: string]: unknown }) => ({
      ...l,
      id: l.id.toString(),
      createdAt: l.createdAt.toISOString()
    }));

    // Fetch dynamic plan metadata from SubscriptionPlan table
    const planDetails = await prisma.subscriptionPlan.findUnique({
      where: { tier: user.planTier }
    });

    // Omit sensitive credentials from user response
    const { 
      password: _pwd, 
      apiKeyHash: _keyHash, 
      accountWebhookSecret: _hookSec, 
      totpSecret: _totp,
      ...safeUser 
    } = user;

    return NextResponse.json({
      status: "success",
      data: toJsonSafe({
        ...safeUser,
        apiLogs: formattedLogs,
        planDetails: planDetails || {
          name: user.planTier,
          rateLimitPerMin: user.rateLimitPerMin,
          includedQuota: user.monthlyQuota,
          features: ["All Standard Endpoints"]
        }
      })
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: publicMessage(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getVerifiedSession();
    if (!session || !session.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
    }

    const sessionEmail = session.email;
    const body = await req.json();
    const {
      name,
      currentPassword,
      newPassword,
      accountWebhookUrl,
      accountWebhookSecret,
      notificationPrefs,
      taxProfile
    } = body;

    const user = await prisma.user.findUnique({
      where: { email: sessionEmail }
    });

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found." }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;

    // Validate accountWebhookUrl against SSRF
    if (accountWebhookUrl !== undefined) {
      if (accountWebhookUrl && accountWebhookUrl.trim()) {
        const { validateSafeWebhookUrl } = await import("@/lib/ssrf");
        const safetyCheck = await validateSafeWebhookUrl(accountWebhookUrl.trim());
        if (!safetyCheck.valid) {
          return NextResponse.json({
            status: "error",
            message: `Invalid webhook URL: ${safetyCheck.reason}`
          }, { status: 400 });
        }
        updateData.accountWebhookUrl = accountWebhookUrl.trim();
      } else {
        updateData.accountWebhookUrl = null;
      }
    }

    if (accountWebhookSecret !== undefined) updateData.accountWebhookSecret = accountWebhookSecret;
    if (notificationPrefs !== undefined) updateData.notificationPrefs = notificationPrefs;
    if (taxProfile !== undefined) updateData.taxProfile = taxProfile;

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ status: "error", message: "Current password is required." }, { status: 400 });
      }
      const isMatch = await verifyPasswordAsync(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json({ status: "error", message: "Current password does not match." }, { status: 400 });
      }
      const weak = validatePasswordStrength(newPassword);
      if (weak) {
        return NextResponse.json({ status: "error", message: weak }, { status: 400 });
      }
      updateData.password = await hashPasswordAsync(newPassword);
      updateData.passwordChangedAt = new Date();
    }

    const updated = await prisma.user.update({
      where: { email: sessionEmail },
      data: updateData
    });

    const response = NextResponse.json({
      status: "success",
      message: "Profile updated successfully.",
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role
      }
    });

    if (newPassword) {
      // Other devices are signed out (passwordChangedAt); keep this one signed in.
      const token = createSessionToken({ userId: updated.id, email: updated.email, role: updated.role });
      response.cookies.set("astro_session_token", token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 72 * 3600
      });
    }
    return response;
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: publicMessage(err) }, { status: 500 });
  }
}
