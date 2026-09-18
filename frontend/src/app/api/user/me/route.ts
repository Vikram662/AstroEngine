import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get("astro_session_email")?.value;

    if (!sessionEmail) {
      return NextResponse.json({ status: "error", message: "Unauthorized. Please sign in." }, { status: 401 });
    }

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
    const formattedLogs = user.apiLogs.map((l: { id: bigint; createdAt: Date; [key: string]: unknown }) => ({
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
    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get("astro_session_email")?.value;

    if (!sessionEmail) {
      return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { 
      name, 
      currentPassword, 
      newPassword,
      accountWebhookUrl,
      accountWebhookSecret,
      notificationPrefs
    } = body;

    const user = await prisma.user.findUnique({
      where: { email: sessionEmail }
    });

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found." }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (accountWebhookUrl !== undefined) updateData.accountWebhookUrl = accountWebhookUrl;
    if (accountWebhookSecret !== undefined) updateData.accountWebhookSecret = accountWebhookSecret;
    if (notificationPrefs !== undefined) updateData.notificationPrefs = notificationPrefs;

    if (newPassword) {
      const crypto = await import("crypto");
      const currentHashed = crypto.createHash("sha256").update(currentPassword || "").digest("hex");
      if (user.password && user.password !== currentHashed) {
        return NextResponse.json({ status: "error", message: "Current password does not match." }, { status: 400 });
      }
      updateData.password = crypto.createHash("sha256").update(newPassword).digest("hex");
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
