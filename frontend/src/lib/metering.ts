import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toMoney } from "@/lib/money";
import { cached } from "@/lib/ttlCache";
import type { ApiData } from "@/lib/apiTypes";
import { isFreePdfEndpoint, reportPriceForPath } from "@/lib/reportPricing";
import { notify } from "@/lib/notifications";

// Plan / add-on / switch lookups are identical for every request, so they are cached
// briefly; only the user row (balance, quota, blocked flag) is read fresh each call.
const CONFIG_TTL_MS = 30_000;
const MAINTENANCE_TTL_MS = 10_000;

const LOW_BALANCE_THRESHOLD = 50;
const lowBalanceSeen = new Set<string>(); // per process: avoids a DB round-trip on every call while the balance stays low

/**
 * Raises the usage alerts the user can switch on/off in the panel: wallet below Rs 50, and
 * the plan quota crossing 80% / 100%. Fire-and-forget: it never delays or fails a call.
 * One alert per day (balance) / per month (quota).
 */
function afterMetering(
  user: MeteredUser,
  info: { deductionType: string; creditsDeducted: number; walletBefore: number; quota?: number }
) {
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") return;
  const day = new Date().toISOString().substring(0, 10);

  if (info.creditsDeducted > 0) {
    const after = info.walletBefore - info.creditsDeducted;
    if (after < LOW_BALANCE_THRESHOLD) {
      const memo = `${user.id}:${day}`;
      if (!lowBalanceSeen.has(memo)) {
        if (lowBalanceSeen.size > 10_000) lowBalanceSeen.clear();
        lowBalanceSeen.add(memo);
        void notify(user.id, "LOW_BALANCE", { balance: Math.max(0, after) }, { dedupeKey: `LOW_BALANCE:${user.id}:${day}` });
      }
    }
  }

  if (info.deductionType === "QUOTA" && info.quota) {
    const used = (user.monthlyUsage || 0) + 1;
    const month = day.substring(0, 7);
    for (const [event, share] of [["QUOTA_80", 0.8], ["QUOTA_100", 1]] as const) {
      const threshold = Math.ceil(info.quota * share);
      if (used >= threshold && used - 1 < threshold) {
        void notify(user.id, event, { used, quota: info.quota, plan: user.planTier }, { dedupeKey: `${event}:${user.id}:${month}` });
      }
    }
  }
}

export type MeteredUser = Prisma.UserGetPayload<{ include: { subscription: true } }>;

/**
 * Meters ONE call for `user`: maintenance switch, module / add-on entitlement, then an
 * atomic debit of plan quota, add-on quota or wallet. Returns the JSON response the
 * verify-key gateway sends (valid: true + receiptId on success, an error body otherwise).
 * Used by /api/internal/verify-key (API-key traffic) and by the dashboard PDF flow, so
 * both are billed identically.
 */
export async function meterCall(
  user: MeteredUser,
  endpoint: string,
  moduleName: string,
  responseTime = 10
): Promise<NextResponse> {
  // Check system maintenance mode from SystemSetting
  const maintenanceSetting = await cached("setting:MAINTENANCE_MODE", MAINTENANCE_TTL_MS, () =>
    prisma.systemSetting.findUnique({ where: { key: "MAINTENANCE_MODE" } })
  );
  if (maintenanceSetting?.value === "true" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    const notice = await prisma.systemSetting.findUnique({ where: { key: "MAINTENANCE_NOTICE" } });
    return NextResponse.json({
      valid: false,
      error_code: "MAINTENANCE_MODE",
      message: notice?.value || "Platform maintenance in progress. Please retry in a few moments."
    }, { status: 503 });
  }

  // ── Reports are priced per report (Rs 4 - Rs 12), not as a generic API call ──────
  const isAdminUser = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  if (!isAdminUser) {
    if (isFreePdfEndpoint(endpoint)) return freePdfCall(user);
    const price = reportPriceForPath(endpoint);
    if (price !== null) return meterReport(user, endpoint, moduleName, price, responseTime);
  }

  // =========================================================================
  // 100% DYNAMIC DB-DRIVEN MODULE & ADDON PERMISSION SYSTEM
  // =========================================================================
  const normalizedModule = (moduleName || "GENERAL").toLowerCase();
  const isSuperOrAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  // 1. Fetch live plans, user's plan record, and all active addons directly from MySQL
  const [allDbAddons, planRecord, planModulesSetting] = await Promise.all([
    cached<ApiData[]>("addons:active", CONFIG_TTL_MS, () => (prisma as ApiData).addonPackage.findMany({ where: { isActive: true } })),
    cached(`plan:${user.planTier}`, CONFIG_TTL_MS, () => prisma.subscriptionPlan.findUnique({ where: { tier: user.planTier } })),
    cached(`setting:PLAN_MODULES_${user.planTier}`, CONFIG_TTL_MS, () =>
      prisma.systemSetting.findUnique({ where: { key: `PLAN_MODULES_${user.planTier}` } })
    )
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
  let matchedAddonRecord = allDbAddons.find((addon: ApiData) => {
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

  // 4. Other PDF endpoints (e.g. HTML preview) stay available to anyone with a funded
  //    wallet and are metered like a normal call. Report generation itself never gets here.
  let isPayPerUsePdf = false;
  if (normalizedModule.includes("pdf") && !isWildcardAllowed && !isAddonActive) {
    if (toMoney(user.walletBalance) >= 1.0) {
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
      message: `The '${moduleName.toUpperCase()}' engine is not included in your '${user.planTier}' plan. Activate it as a Modular Add-on or upgrade your plan.`,
      details: {
        currentPlan: user.planTier,
        requiredPlan: requiredTier,
        module: moduleName,
        addonAvailable: Boolean(matchedAddonRecord),
        addonId: matchedAddonRecord?.id,
        addonPortalUrl: `${billingUrl}#addons`,
        upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing`,
        action: `Activate the ${matchedAddonRecord?.name || moduleName.toUpperCase()} Add-on in your Billing dashboard or recharge your wallet.`
      }
    }, { status: 403 });
  }

  // Only deduct from Add-on if not included in the base plan
  if (isWildcardAllowed || allowedModulesList.includes(normalizedModule)) {
    matchedAddonRecord = null;
  }

  const walletBalance = toMoney(user.walletBalance);
  let deductionType = "QUOTA";
  let creditsDeducted = 0;

  // CASE A: Access is through an ADD-ON (Module is covered by AddonPackage)
  if (matchedAddonRecord) {
    const addonQuota = matchedAddonRecord.monthlyQuota !== undefined ? matchedAddonRecord.monthlyQuota : 1000;
    const addonOverage = matchedAddonRecord.overageCost !== undefined ? toMoney(matchedAddonRecord.overageCost) : 0.05;
    
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
    else if (
      walletBalance >= addonOverage &&
      // Conditional update: the balance check and debit are one atomic statement,
      // so concurrent calls cannot overdraw the wallet.
      (await prisma.user.updateMany({
        where: { id: user.id, walletBalance: { gte: addonOverage } },
        data: {
          addonUsage: { ...currentAddonUsageMap, [matchedAddonRecord.id]: currentAddonUsage + 1 },
          walletBalance: { decrement: addonOverage },
          monthlyUsage: { increment: 1 },
          apiKeyLastUsedAt: new Date()
        }
      })).count === 1
    ) {
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
    let costPerCall = planRecord?.overageCost !== undefined && planRecord?.overageCost !== null
      ? toMoney(planRecord.overageCost)
      : null;
    if (costPerCall === null) {
      const overageSetting = await cached("setting:OVERAGE_COST_PER_CALL", CONFIG_TTL_MS, () =>
        prisma.systemSetting.findUnique({ where: { key: "OVERAGE_COST_PER_CALL" } })
      );
      costPerCall = overageSetting ? parseFloat(overageSetting.value) || 0.02 : 0.02;
    }

    const monthlyQuota = planRecord?.includedQuota || user.monthlyQuota || 35000;
    const monthlyUsage = user.monthlyUsage || 0;

    // STEP 1: claim one unit of plan quota atomically (no read-then-write race)
    const quotaClaim = await prisma.user.updateMany({
      where: { id: user.id, monthlyUsage: { lt: monthlyQuota } },
      data: { monthlyUsage: { increment: 1 }, apiKeyLastUsedAt: new Date() }
    });

    if (quotaClaim.count === 1) {
      deductionType = "QUOTA";
      creditsDeducted = 0;
    } else {
      // STEP 2: quota exhausted -> debit the prepaid wallet atomically
      const walletClaim = await prisma.user.updateMany({
        where: { id: user.id, walletBalance: { gte: costPerCall } },
        data: {
          walletBalance: { decrement: costPerCall },
          monthlyUsage: { increment: 1 },
          apiKeyLastUsedAt: new Date()
        }
      });
      if (walletClaim.count === 1) {
        deductionType = "WALLET_CREDIT";
        creditsDeducted = costPerCall;
      } else {
        deductionType = "EXHAUSTED";
      }
    }

    if (deductionType === "EXHAUSTED") {
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

  // Log the call. The log row doubles as the billing "receipt": /api/internal/refund
  // uses its id (and flips its statusCode) so a failed call is refunded exactly once.
  let receiptId: string | null = null;
  try {
    const log = await prisma.apiRequestLog.create({
      data: {
        userId: user.id,
        endpoint: endpoint.substring(0, 100),
        module: moduleName.substring(0, 50),
        creditsCost: creditsDeducted,
        responseTime: responseTime || 12,
        statusCode: 200,
      }
    });
    receiptId = log.id.toString();
  } catch {
    // Non-blocking log failure (such a call simply cannot be auto-refunded)
  }

  afterMetering(user, {
    deductionType,
    creditsDeducted,
    walletBefore: walletBalance,
    quota: planRecord?.includedQuota || user.monthlyQuota || 35000,
  });

  return NextResponse.json({
    valid: true,
    role: user.role,
    receiptId,
    addonId: deductionType.startsWith("ADDON") ? matchedAddonRecord?.id ?? null : null,
    userId: user.id,
    email: user.email,
    planTier: user.planTier,
    deductionType,
    creditsDeducted,
    quota: {
      plan: user.planTier,
      planName: planRecord?.name || user.planTier,
      priceMonthly: planRecord?.priceMonthly !== undefined ? toMoney(planRecord.priceMonthly) : 4999,
      monthlyQuota: planRecord?.includedQuota || user.monthlyQuota || 35000,
      rateLimitPerMin: planRecord?.rateLimitPerMin || 60,
      monthlyUsage: (user.monthlyUsage || 0) + 1,
      deductionType: deductionType,
      walletBalance: deductionType.includes("OVERAGE") || deductionType === "WALLET_CREDIT" ? Math.max(0, walletBalance - creditsDeducted) : walletBalance
    }
  });

}

function quotaBlock(user: MeteredUser, planRecord: ApiData | null, deductionType: string, walletAfter: number, usageAfter: number) {
  return {
    plan: user.planTier,
    planName: planRecord?.name || user.planTier,
    priceMonthly: planRecord?.priceMonthly !== undefined ? toMoney(planRecord.priceMonthly) : 4999,
    monthlyQuota: planRecord?.includedQuota || user.monthlyQuota || 35000,
    rateLimitPerMin: planRecord?.rateLimitPerMin || 60,
    monthlyUsage: usageAfter,
    deductionType,
    walletBalance: walletAfter,
  };
}

/** Status polls and downloads of a report: authenticated, never charged, nothing to refund. */
async function freePdfCall(user: MeteredUser): Promise<NextResponse> {
  const planRecord = await cached(`plan:${user.planTier}`, CONFIG_TTL_MS, () => prisma.subscriptionPlan.findUnique({ where: { tier: user.planTier } }));
  return NextResponse.json({
    valid: true,
    role: user.role,
    receiptId: null,
    addonId: null,
    userId: user.id,
    email: user.email,
    planTier: user.planTier,
    deductionType: "FREE",
    creditsDeducted: 0,
    quota: quotaBlock(user, planRecord, "FREE", toMoney(user.walletBalance), user.monthlyUsage || 0),
  });
}

/**
 * Bills ONE report. The price depends on the report type. Customers with the PDF add-on
 * get its monthly included reports for free; beyond that (and for everyone else) the
 * report price is taken from the wallet. The debit is a single conditional update, so
 * concurrent requests cannot overdraw the wallet.
 */
async function meterReport(
  user: MeteredUser,
  endpoint: string,
  moduleName: string,
  price: number,
  responseTime: number
): Promise<NextResponse> {
  const [allDbAddons, planRecord] = await Promise.all([
    cached<ApiData[]>("addons:active", CONFIG_TTL_MS, () => (prisma as ApiData).addonPackage.findMany({ where: { isActive: true } })),
    cached(`plan:${user.planTier}`, CONFIG_TTL_MS, () => prisma.subscriptionPlan.findUnique({ where: { tier: user.planTier } })),
  ]);

  const activeAddons: string[] = Array.isArray(user.activeAddons) ? (user.activeAddons as string[]) : [];
  const pdfAddon = allDbAddons.find((a: ApiData) => a.id === "pdf");
  const hasPdfAddon = Boolean(pdfAddon) && activeAddons.includes("pdf");

  const walletBefore = toMoney(user.walletBalance);
  let deductionType = "WALLET_CREDIT";
  let creditsDeducted = 0;
  let addonId: string | null = null;

  const debitWallet = async (extra: Record<string, unknown> = {}) => {
    const claim = await prisma.user.updateMany({
      where: { id: user.id, walletBalance: { gte: price } },
      data: {
        walletBalance: { decrement: price },
        monthlyUsage: { increment: 1 },
        apiKeyLastUsedAt: new Date(),
        ...extra,
      },
    });
    return claim.count === 1;
  };

  if (hasPdfAddon) {
    addonId = "pdf";
    const usageMap = (user.addonUsage && typeof user.addonUsage === "object" ? user.addonUsage : {}) as Record<string, number>;
    const used = Number(usageMap.pdf || 0);
    const included = pdfAddon!.monthlyQuota !== undefined ? Number(pdfAddon!.monthlyQuota) : 500;
    const nextUsage = { ...usageMap, pdf: used + 1 };

    if (used < included) {
      await prisma.user.update({
        where: { id: user.id },
        data: { addonUsage: nextUsage, monthlyUsage: { increment: 1 }, apiKeyLastUsedAt: new Date() },
      });
      deductionType = "ADDON_QUOTA";
    } else if (await debitWallet({ addonUsage: nextUsage })) {
      deductionType = "ADDON_OVERAGE";
      creditsDeducted = price;
    } else {
      return insufficient(price, walletBefore, `You have used all ${included} reports included in your PDF add-on this month.`);
    }
  } else if (await debitWallet()) {
    creditsDeducted = price;
  } else {
    return insufficient(price, walletBefore, "Recharge your wallet to generate this report.");
  }

  let receiptId: string | null = null;
  try {
    const log = await prisma.apiRequestLog.create({
      data: {
        userId: user.id,
        endpoint: endpoint.substring(0, 100),
        module: moduleName.substring(0, 50),
        creditsCost: creditsDeducted,
        responseTime: responseTime || 12,
        statusCode: 200,
      },
    });
    receiptId = log.id.toString();
  } catch {
    // a missing log row only means this call cannot be auto-refunded
  }

  const walletAfter = creditsDeducted > 0 ? Math.max(0, walletBefore - creditsDeducted) : walletBefore;
  afterMetering(user, { deductionType, creditsDeducted, walletBefore });

  return NextResponse.json({
    valid: true,
    role: user.role,
    receiptId,
    addonId,
    userId: user.id,
    email: user.email,
    planTier: user.planTier,
    deductionType,
    creditsDeducted,
    reportPrice: price,
    quota: quotaBlock(user, planRecord, deductionType, walletAfter, (user.monthlyUsage || 0) + 1),
  });
}

function insufficient(price: number, walletBalance: number, hint: string): NextResponse {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.json({
    valid: false,
    error_code: "INSUFFICIENT_WALLET_FOR_REPORT",
    message: `This report costs ₹${price.toFixed(2)} and your wallet balance is ₹${walletBalance.toFixed(2)}. ${hint}`,
    details: {
      reportPrice: price,
      walletBalance: Number(walletBalance.toFixed(2)),
      rechargeUrl: `${base}/billing`,
    },
  }, { status: 403 });
}
