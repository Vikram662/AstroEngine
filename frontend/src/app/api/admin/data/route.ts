import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/authGuard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ status: "error", message: "Forbidden: Admin authorization required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "users" | "billing" | "audit" | "prompts" | "usage"

    if (type === "users") {
      let users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          planTier: true,
          walletBalance: true,
          monthlyUsage: true,
          monthlyQuota: true,
          rateLimitPerMin: true,
          isBlocked: true,
          apiKeyPrefix: true,
          apiKeyCreatedAt: true,
          apiKeyLastUsedAt: true,
          createdAt: true,
          updatedAt: true
        }
      });
      return NextResponse.json({ status: "success", data: users });
    }

    if (type === "billing") {
      let txs = await prisma.transaction.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, planTier: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      });
      return NextResponse.json({ status: "success", data: txs });
    }

    if (type === "audit") {
      let audits = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 50
      });
      return NextResponse.json({ status: "success", data: audits });
    }

    if (type === "prompts") {
      let prompts = await prisma.astrologicalPrediction.findMany({
        orderBy: { updatedAt: "desc" },
        take: 50
      });
      return NextResponse.json({ status: "success", data: prompts });
    }

    if (type === "usage" || type === "traffic") {
      const logs = await prisma.apiRequestLog.findMany({
        include: {
          user: {
            select: { id: true, email: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 100
      });
      // Convert BigInt id to string for JSON serialization
      const serialized = logs.map((l: { id: bigint; user?: { email?: string } | null; [key: string]: unknown }) => ({
        ...l,
        id: l.id.toString(),
        userEmail: l.user?.email || "anonymous"
      }));
      return NextResponse.json({ status: "success", data: serialized });
    }

    if (type === "pdf_jobs" || type === "pdf_queue") {
      const jobs = await prisma.pdfGenerationJob.findMany({
        include: { 
          user: {
            select: { id: true, email: true, name: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 100
      });
      const serialized = jobs.map((j: { user?: { email?: string } | null; [key: string]: unknown }) => ({
        ...j,
        userEmail: j.user?.email || "unknown"
      }));
      return NextResponse.json({ status: "success", data: serialized });
    }

    return NextResponse.json({ status: "error", message: "Invalid type" }, { status: 400 });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ status: "error", message: "Forbidden: Admin authorization required." }, { status: 403 });
    }

    const body = await req.json();
    const { userId, isBlocked, addCredit, planTier, activeAddons } = body;

    if (!userId) {
      return NextResponse.json({ status: "error", message: "userId required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked;
    if (activeAddons !== undefined) updateData.activeAddons = activeAddons;
    if (addCredit !== undefined && !isNaN(Number(addCredit))) {
      updateData.walletBalance = { increment: Number(addCredit) };
    }
    if (planTier !== undefined) {
      updateData.planTier = planTier;
      // Also fetch quota if plan exists
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { tier: planTier }
      });
      if (plan) {
        updateData.monthlyQuota = plan.includedQuota;
        updateData.rateLimitPerMin = plan.rateLimitPerMin;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Immutable audit trail entry (§12.5)
    await prisma.auditLog.create({
      data: {
        actorUserId: "admin_super",
        actorRole: "ADMIN",
        action: planTier ? "PLAN_TIER_CHANGED" : addCredit ? "WALLET_CREDIT_ADDED" : "USER_STATUS_TOGGLED",
        targetType: "User",
        targetId: userId,
        metadata: JSON.parse(JSON.stringify({ updateData }))
      }
    });

    return NextResponse.json({ status: "success", data: updatedUser });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}
