import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";
import { hashPassword, verifyPassword } from "@/lib/session";

export async function GET() {
  try {
    const session = await getVerifiedSession();
    if (!session || !session.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const sessionEmail = session.email;

    let user = await prisma.user.findUnique({
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

    return NextResponse.json({
      status: "success",
      data: {
        ...user,
        apiLogs: formattedLogs,
        planDetails: planDetails || {
          name: user.planTier,
          rateLimitPerMin: user.rateLimitPerMin,
          includedQuota: user.monthlyQuota,
          features: ["All Standard Endpoints"]
        }
      }
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
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
      const isMatch = verifyPassword(currentPassword, user.password || "");
      if (!isMatch) {
        return NextResponse.json({ status: "error", message: "Current password does not match." }, { status: 400 });
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ status: "error", message: "New password must be at least 8 characters long." }, { status: 400 });
      }
      updateData.password = hashPassword(newPassword);
    }

    const updated = await prisma.user.update({
      where: { email: sessionEmail },
      data: updateData
    });

    return NextResponse.json({
      status: "success",
      message: "Profile updated successfully.",
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role
      }
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
