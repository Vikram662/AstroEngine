import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function getInternalSecret(): string {
  const secret = process.env.ASTRO_INTERNAL_SECRET;
  if (!secret) {
    throw new Error("CRITICAL SECURITY ERROR: ASTRO_INTERNAL_SECRET must be configured in environment.");
  }
  return secret;
}

// POST /api/internal/verify-key - Fast verification & quota/wallet debit for Python FastAPI engine
export async function POST(req: NextRequest) {
  try {
    const internalSecret = getInternalSecret();
    const authHeader = req.headers.get("x-internal-secret");
    if (!authHeader || authHeader !== internalSecret) {
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

    // Look up user strictly by cryptographic apiKeyHash
    let user = await prisma.user.findFirst({
      where: {
        apiKeyHash: keyHash
      },
      include: {
        subscription: true
      }
    });

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

    // =========================================================================
    // 100% DYNAMIC DB-DRIVEN MODULE & ADDON PERMISSION SYSTEM
    // =========================================================================
    const normalizedModule = (module || "GENERAL").toLowerCase();
    const isSuperOrAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    // 1. Fetch live plans, user's plan record, and all active addons directly from MySQL
    const [allDbAddons, planRecord, planModulesSetting] = await Promise.all([
      (prisma as any).addonPackage.findMany({ where: { isActive: true } }),
      prisma.subscriptionPlan.findUnique({ where: { tier: user.planTier } }),
      prisma.systemSetting.findUnique({ where: { key: `PLAN_MODULES_${user.planTier}` } })
    ]);

    // 2. Determine allowed modules strictly from MySQL:
    // If Admin configured PLAN_MODULES_{tier} in SystemSetting, use that.
    // Otherwise, dynamically derive allowed modules from the plan's own DB record!
    let allowedModulesList: string[] = [];
    if (planModulesSetting?.value) {
      allowedModulesList = planModulesSetting.value.split(",").map((m: string) => m.trim().toLowerCase());
    } else if (isSuperOrAdmin) {
      allowedModulesList = ["*"];
    } else if (planRecord?.features && Array.isArray(planRecord.features)) {
      // Dynamically extract allowed modules from plan features string in DB
      allowedModulesList = ["core", "panchang", "parashari", "general"];
      for (const feat of planRecord.features as string[]) {
        const lowerFeat = feat.toLowerCase();
        for (const dbAddon of allDbAddons) {
          if (lowerFeat.includes(dbAddon.id.toLowerCase()) || lowerFeat.includes(dbAddon.name.toLowerCase())) {
            allowedModulesList.push(dbAddon.id.toLowerCase());
          }
        }
      }
    } else {
      allowedModulesList = ["core", "panchang", "parashari", "general"];
    }

    const isWildcardAllowed = allowedModulesList.includes("*") || isSuperOrAdmin;
    const userActiveAddons: string[] = Array.isArray(user.activeAddons) ? (user.activeAddons as string[]) : [];

    // 3. Find if this incoming request corresponds to an active Addon in MySQL
    // Dynamically match against addon.id, addon.name, or any words in addon.features
    let matchedAddonRecord = allDbAddons.find((addon: any) => {
      const aId = (addon.id || "").toLowerCase();
      const aName = (addon.name || "").toLowerCase();
      if (aId === normalizedModule) return true;
      if (aName.includes(normalizedModule) || normalizedModule.includes(aId)) return true;

      // Also check features array in DB
      if (Array.isArray(addon.features)) {
        for (const f of addon.features) {
          const lowerF = String(f).toLowerCase();
          if (lowerF.includes(normalizedModule) || normalizedModule.includes(lowerF)) return true;
        }
      }
      return false;
    });

    const isAddonActive = matchedAddonRecord ? userActiveAddons.includes(matchedAddonRecord.id) : false;

    // 4. Pay-per-use fallback for PDF reports (₹10/PDF if wallet balance is positive)
    let isPayPerUsePdf = false;
    if (normalizedModule.includes("pdf") && !isWildcardAllowed && !isAddonActive) {
      if (user.walletBalance >= 10.0) {
        isPayPerUsePdf = true;
      }
    }

    const isModuleAllowed = isWildcardAllowed || 
                            allowedModulesList.includes(normalizedModule) || 
                            isAddonActive || 
                            isPayPerUsePdf;

    if (!isModuleAllowed) {
      const requiredTier = matchedAddonRecord?.category === "REPORTS" ? "ENTERPRISE" : "PRO";
      const billingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/billing`;

      return NextResponse.json({
        valid: false,
        error_code: "PLAN_UPGRADE_OR_ADDON_REQUIRED",
        message: `The '${module.toUpperCase()}' engine is not included in your '${user.planTier}' plan. Activate it as a Modular Add-on or upgrade your plan.`,
        details: {
          currentPlan: user.planTier,
          requiredPlan: requiredTier,
          module: module,
          addonAvailable: Boolean(matchedAddonRecord),
          addonId: matchedAddonRecord?.id,
          addonPortalUrl: `${billingUrl}#addons`,
          upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing`,
          action: `Activate the ${matchedAddonRecord?.name || module.toUpperCase()} Add-on in your Billing dashboard or recharge your wallet.`
        }
      }, { status: 403 });
    }

    // Only deduct from Add-on if not included in the base plan
    if (isWildcardAllowed || allowedModulesList.includes(normalizedModule)) {
      matchedAddonRecord = null;
    }

    const walletBalance = user.walletBalance || 0;
    let deductionType = "QUOTA";
    let creditsDeducted = 0;

    // CASE A: Access is through an ADD-ON (Module is covered by AddonPackage)
    if (matchedAddonRecord) {
      const addonQuota = matchedAddonRecord.monthlyQuota !== undefined ? matchedAddonRecord.monthlyQuota : 1000;
      const addonOverage = matchedAddonRecord.overageCost !== undefined ? matchedAddonRecord.overageCost : 0.05;
      
      const currentAddonUsageMap = (user.addonUsage && typeof user.addonUsage === "object" ? user.addonUsage : {}) as Record<string, number>;
      const currentAddonUsage = Number(currentAddonUsageMap[matchedAddonRecord.id] || 0);

      // 1. Within Add-on quota
      if (currentAddonUsage < addonQuota) {
        currentAddonUsageMap[matchedAddonRecord.id] = currentAddonUsage + 1;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            addonUsage: currentAddonUsageMap,
            monthlyUsage: { increment: 1 },
            apiKeyLastUsedAt: new Date()
          }
        });
        deductionType = "ADDON_QUOTA";
        creditsDeducted = 0;
      }
      // 2. Add-on quota exhausted -> Wallet Overage fallback
      else if (walletBalance >= addonOverage) {
        currentAddonUsageMap[matchedAddonRecord.id] = currentAddonUsage + 1;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            addonUsage: currentAddonUsageMap,
            walletBalance: { decrement: addonOverage },
            monthlyUsage: { increment: 1 },
            apiKeyLastUsedAt: new Date()
          }
        });
        deductionType = "ADDON_OVERAGE";
        creditsDeducted = addonOverage;
      }
      // 3. Both Add-on Quota & Wallet exhausted
      else {
        return NextResponse.json({
          valid: false,
          error_code: "ADDON_QUOTA_EXHAUSTED",
          message: `Your monthly quota for the ${matchedAddonRecord.name} add-on (${addonQuota.toLocaleString()} units) is exhausted, and your wallet balance (₹${walletBalance.toFixed(2)}) is insufficient for overage (₹${addonOverage.toFixed(2)}/unit).`,
          details: {
            addonId: matchedAddonRecord.id,
            addonName: matchedAddonRecord.name,
            includedQuota: addonQuota,
            usedQuota: currentAddonUsage,
            overageCost: addonOverage,
            walletBalance: Number(walletBalance.toFixed(2)),
            action: "Please recharge your wallet or contact support."
          }
        }, { status: 403 });
      }
    } 
    // CASE B: Standard Plan Quota deduction
    else {
      let costPerCall = planRecord?.overageCost;
      if (costPerCall === undefined || costPerCall === null) {
        const overageSetting = await prisma.systemSetting.findUnique({
          where: { key: "OVERAGE_COST_PER_CALL" }
        });
        costPerCall = overageSetting ? parseFloat(overageSetting.value) || 0.02 : 0.02;
      }

      const monthlyQuota = planRecord?.includedQuota || user.monthlyQuota || 35000;
      const monthlyUsage = user.monthlyUsage || 0;

      // STEP 1: Plan quota remaining
      if (monthlyUsage < monthlyQuota) {
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
      // STEP 2: Quota exhausted -> Fallback to prepaid wallet
      else if (walletBalance >= costPerCall) {
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
        monthlyQuota: planRecord?.includedQuota || user.monthlyQuota || 35000,
        monthlyUsage: (user.monthlyUsage || 0) + 1,
        deductionType: deductionType,
        walletBalance: deductionType.includes("OVERAGE") || deductionType === "WALLET_CREDIT" ? Math.max(0, walletBalance - creditsDeducted) : walletBalance
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
