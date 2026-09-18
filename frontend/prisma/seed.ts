import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log("Seeding Master Admin and Core Platform Data...");

  // 1. Seed or Update Master Admin
  const adminPasswordHash = hashPassword("Admin@12345");
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

  console.log(`✓ Admin account ready: ${admin.email} (Role: ${admin.role})`);

  // 2. Seed Default System Settings
  const defaultSettings = [
    { key: "DEFAULT_FREE_CREDITS", value: "100.00", category: "BILLING", description: "Initial free credits granted to newly registered developers" },
    { key: "DEFAULT_MONTHLY_QUOTA", value: "35000", category: "LIMITS", description: "Monthly API call limit for Starter accounts" },
    { key: "DEFAULT_STARTER_RPM", value: "60", category: "LIMITS", description: "Rate limit per min for Starter tier" },
    { key: "DEFAULT_PRO_RPM", value: "300", category: "LIMITS", description: "Rate limit per min for Pro tier" },
    { key: "DEFAULT_ENTERPRISE_RPM", value: "1000", category: "LIMITS", description: "Rate limit per min for Enterprise tier" },
    { key: "OVERAGE_COST_PER_CALL", value: "0.02", category: "BILLING", description: "Overage fee deducted per call after quota exhaustion" },
    { key: "MAINTENANCE_MODE", value: "false", category: "MAINTENANCE", description: "Public maintenance mode 503 switch" },
    { key: "MAINTENANCE_NOTICE", value: "Scheduled maintenance in progress. APIs resume shortly.", category: "MAINTENANCE", description: "503 maintenance message" },
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s
    });
  }
  console.log(`✓ Seeded ${defaultSettings.length} default SystemSettings`);

  // 3. Seed Subscription Plans
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
      features: ["300,000 Requests / Mo", "300 RPM Burst Limit", "Full D1-D60 Divisional Charts", "99.9% SLA & Priority Email Support"],
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
  console.log(`✓ Seeded ${plans.length} Subscription Plans`);

  console.log("\nSetup complete! You can now log in with:");
  console.log("Email: admin@astroengine.io");
  console.log("Password: Admin@12345\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
