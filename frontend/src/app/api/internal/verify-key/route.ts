import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const INTERNAL_SECRET = process.env.ASTRO_INTERNAL_SECRET || "c9f82d1a6e3b5c7f8a9e0d1b2";

// POST /api/internal/verify-key - Fast verification & quota/wallet debit for Python FastAPI engine
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("x-internal-secret");
    if (authHeader !== INTERNAL_SECRET) {
      return NextResponse.json(
        { status: "error", message: "Forbidden internal handshake" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { apiKey, endpoint = "/api/v1/general", module = "GENERAL", responseTime = 10 } = body;

    if (!apiKey) {
      return NextResponse.json({
        valid: false,
        error_code: "MISSING_KEY",
        message: "Missing 'x-api-key' header. Please provide your active API key."
      }, { status: 401 });
    }

    // SHA-256 hash
    const cleanedKey = apiKey.trim();
    const keyHash = crypto.createHash("sha256").update(cleanedKey).digest("hex");

    console.log("[VERIFY-KEY] Incoming apiKey:", cleanedKey);
    console.log("[VERIFY-KEY] Computed keyHash:", keyHash);

    // Look up user by apiKeyHash or apiKeyPrefix
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { apiKeyHash: keyHash },
          { apiKeyHash: cleanedKey }, // fallback if stored unhashed
          { apiKeyPrefix: cleanedKey.substring(0, 16) }
        ]
      },
      include: {
        subscription: true
      }
    });

    if (!user) {
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true, apiKeyPrefix: true, apiKeyHash: true }
      });
      console.log("[VERIFY-KEY] User not found! DB Users:", JSON.stringify(allUsers));
    }

    console.log("[VERIFY-KEY] Found user:", user ? { id: user.id, email: user.email, planTier: user.planTier } : "NULL");

    if (!user) {
      return NextResponse.json({
        valid: false,
        error_code: "INVALID_KEY",
        message: "Invalid API key. The provided token does not match any registered developer account."
      }, { status: 401 });
    }

    // Check if user is blocked by Admin
    if (user.isBlocked) {
      return NextResponse.json({
        valid: false,
        error_code: "ACCOUNT_SUSPENDED",
        message: "Your developer account has been suspended. Please contact support@astroengine.io."
      }, { status: 403 });
    }

    // Check system maintenance mode from SystemSetting
    const maintenanceSetting = await prisma.systemSetting.findUnique({
      where: { key: "MAINTENANCE_MODE" }
    });
    if (maintenanceSetting?.value === "true" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      const notice = await prisma.systemSetting.findUnique({ where: { key: "MAINTENANCE_NOTICE" } });
      return NextResponse.json({
        valid: false,
        error_code: "MAINTENANCE_MODE",
        message: notice?.value || "Platform maintenance in progress. Please retry in a few moments."
      }, { status: 503 });
    }

    // Fetch user's dynamic subscription plan record directly from MySQL SubscriptionPlan table
    const planRecord = await prisma.subscriptionPlan.findUnique({
      where: { tier: user.planTier }
    });

    // Read overage cost from plan or systemSetting fallback
    let costPerCall = planRecord?.overageCost;
    if (costPerCall === undefined || costPerCall === null) {
      const overageSetting = await prisma.systemSetting.findUnique({
        where: { key: "OVERAGE_COST_PER_CALL" }
      });
      costPerCall = overageSetting ? parseFloat(overageSetting.value) || 0.02 : 0.02;
    }

    const monthlyQuota = planRecord?.includedQuota || user.monthlyQuota || 35000;
    const monthlyUsage = user.monthlyUsage || 0;
    const walletBalance = user.walletBalance || 0;

    let deductionType = "QUOTA";
    let creditsDeducted = 0;

    // STEP 1: If user has monthly quota remaining from their subscription plan
    if (monthlyUsage < monthlyQuota) {
      // Consume from plan quota
      await prisma.user.update({
        where: { id: user.id },
        data: {
          monthlyUsage: { increment: 1 },
          apiKeyLastUsedAt: new Date()
        }
      });
      deductionType = "QUOTA";
      creditsDeducted = 0;
    } 
    // STEP 2: Quota is exhausted (overage) -> Fallback to prepaid wallet credits
    else if (walletBalance >= costPerCall) {
      // Deduct from wallet balance
      await prisma.user.update({
        where: { id: user.id },
        data: {
          walletBalance: { decrement: costPerCall },
          monthlyUsage: { increment: 1 },
          apiKeyLastUsedAt: new Date()
        }
      });
      deductionType = "WALLET_CREDIT";
      creditsDeducted = costPerCall;
    } 
    // STEP 3: Both Monthly Plan Quota AND Wallet Credits are exhausted!
    else {
      const rechargeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/billing`;
      return NextResponse.json({
        valid: false,
        error_code: "QUOTA_AND_CREDITS_EXHAUSTED",
        message: `Your monthly subscription plan quota (${monthlyQuota.toLocaleString()} calls) is completely exhausted, and your prepaid wallet balance (₹${walletBalance.toFixed(2)}) is insufficient to cover overage (₹${costPerCall.toFixed(2)}/call).`,
        details: {
          monthlyQuota,
          monthlyUsage,
          quotaRemaining: 0,
          walletBalance: Number(walletBalance.toFixed(2)),
          requiredPerCall: costPerCall,
          rechargeUrl: rechargeUrl,
          action: "Please recharge your wallet or upgrade to a higher subscription plan to continue making API calls."
        }
      }, { status: 403 });
    }

    // Log the API call in ApiRequestLog for real-time traffic monitoring & usage analytics
    try {
      await prisma.apiRequestLog.create({
        data: {
          userId: user.id,
          endpoint: endpoint.substring(0, 100),
          module: module.substring(0, 50),
          creditsCost: creditsDeducted,
          responseTime: responseTime || 12,
          statusCode: 200,
        }
      });
    } catch {
      // Non-blocking log failure
    }

    return NextResponse.json({
      valid: true,
      userId: user.id,
      email: user.email,
      planTier: user.planTier,
      deductionType,
      creditsDeducted,
      quota: {
        plan: user.planTier,
        planName: planRecord?.name || user.planTier,
        priceMonthly: planRecord?.priceMonthly !== undefined ? planRecord.priceMonthly : 4999,
        monthlyQuota: monthlyQuota,
        monthlyUsage: monthlyUsage + 1,
        remainingQuota: Math.max(0, monthlyQuota - (monthlyUsage + 1)),
        deductionType: deductionType,
        walletBalance: deductionType === "WALLET_CREDIT" ? Math.max(0, walletBalance - costPerCall) : walletBalance
      }
    });

  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({
      valid: false,
      error_code: "SERVER_ERROR",
      message: err.message || "Internal auth error"
    }, { status: 500 });
  }
}
