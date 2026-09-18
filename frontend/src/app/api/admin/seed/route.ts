import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// POST /api/admin/seed - Direct browser/API triggered seed
export async function POST() {
  try {
    const adminPasswordHash = crypto.createHash("sha256").update("Admin@12345").digest("hex");

    // 1. Create/Update Admin User
    const admin = await prisma.user.upsert({
      where: { email: "admin@astroengine.io" },
      update: {
        role: "ADMIN",
        password: adminPasswordHash,
        planTier: "ENTERPRISE",
        isBlocked: false,
      },
      create: {
        email: "admin@astroengine.io",
        name: "Master Administrator",
        role: "ADMIN",
        password: adminPasswordHash,
        apiKeyHash: crypto.randomBytes(32).toString("hex"),
        apiKeyPrefix: "ak_live_admin_root",
        walletBalance: 999999.0,
        planTier: "ENTERPRISE",
        monthlyQuota: 10000000,
        rateLimitPerMin: 5000,
        monthlyUsage: 0,
        isBlocked: false
      }
    });

    // 2. Insert Default Dynamic System Settings
    const defaultSettings = [
      { key: "DEFAULT_FREE_CREDITS", value: "100.00", category: "BILLING", description: "Initial free testing credits granted to newly registered developer accounts" },
      { key: "DEFAULT_MONTHLY_QUOTA", value: "35000", category: "LIMITS", description: "Monthly included API call quota for Free/Starter accounts" },
      { key: "DEFAULT_STARTER_RPM", value: "60", category: "LIMITS", description: "Rate limit per minute for Starter tier keys" },
      { key: "DEFAULT_PRO_RPM", value: "300", category: "LIMITS", description: "Rate limit per minute for Pro tier keys" },
      { key: "DEFAULT_ENTERPRISE_RPM", value: "1000", category: "LIMITS", description: "Rate limit per minute for Enterprise tier keys" },
      { key: "OVERAGE_COST_PER_CALL", value: "0.02", category: "BILLING", description: "Amount in INR automatically deducted from wallet per call once quota is exhausted" },
      { key: "MAINTENANCE_MODE", value: "false", category: "MAINTENANCE", description: "Platform maintenance switch. If true, all public APIs return 503" },
      { key: "MAINTENANCE_NOTICE", value: "Scheduled maintenance in progress. All API calls will return 503 until 04:00 UTC.", category: "MAINTENANCE", description: "Banner message displayed during maintenance mode" },
      { key: "MODULE_WESTERN_ACTIVE", value: "true", category: "MODULES", description: "Western Tropical astrology & Synastry engine switch" },
      { key: "MODULE_LALKITAB_ACTIVE", value: "true", category: "MODULES", description: "Lal Kitab debts & Varshphal engine switch" },
      { key: "MODULE_MATCHMAKING_ACTIVE", value: "true", category: "MODULES", description: "36-Guna Ashtakoota matchmaking module switch" },
      { key: "AUTO_REFUND_FAILED_JOBS", value: "true", category: "BILLING", description: "Automatically refund credits if a PDF job fails or times out" }
    ];

    for (const s of defaultSettings) {
      await prisma.systemSetting.upsert({
        where: { key: s.key },
        update: {},
        create: s
      });
    }

    // 3. Insert Subscription Plans
    const plans = [
      {
        tier: "STARTER" as const,
        name: "STARTER",
        priceMonthly: 0,
        includedQuota: 35000,
        rateLimitPerMin: 60,
        overageCost: 0.02,
        features: ["All 117 Endpoints Active", "Kundli & Panchang Calculations", "Community Support"],
        isPopular: false
      },
      {
        tier: "PRO" as const,
        name: "PRO",
        priceMonthly: 4999,
        includedQuota: 300000,
        rateLimitPerMin: 300,
        overageCost: 0.015,
        features: ["300,000 Requests / Mo", "300 RPM Burst Limit", "Full D1-D60 Divisional Charts", "99.9% SLA & Priority Support"],
        isPopular: true
      },
      {
        tier: "ENTERPRISE" as const,
        name: "ENTERPRISE",
        priceMonthly: 14999,
        includedQuota: 1500000,
        rateLimitPerMin: 1200,
        overageCost: 0.01,
        features: ["1,500,000 Requests / Mo", "1,200 RPM High Throughput", "Whitelabel PDF Engine with Custom Logo", "Dedicated Slack Channel & 24/7 SLA"],
        isPopular: false
      }
    ];

    for (const p of plans) {
      await prisma.subscriptionPlan.upsert({
        where: { tier: p.tier },
        update: {},
        create: p
      });
    }

    return NextResponse.json({
      status: "success",
      message: "Admin account, Subscription Plans, and SystemSettings successfully synced into MySQL!",
      admin: {
        email: admin.email,
        role: admin.role,
        tier: admin.planTier
      }
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
