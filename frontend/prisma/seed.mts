import { PrismaClient } from "@prisma/client";
import { apiKeyFromEnvOrNew, hashPassword, passwordFromEnvOrRandom, refuseInProduction } from "./seed-helpers.mts";

const prisma = new PrismaClient();

async function main() {
  refuseInProduction("prisma/seed.mts");

  console.log("Seeding Master Admin and Core Platform Data...");

  // 1. Seed or Update Master Admin (do NOT overwrite existing password on update)
  const adminPassword = passwordFromEnvOrRandom(process.env.SEED_ADMIN_PASSWORD);
  const adminKey = apiKeyFromEnvOrNew(process.env.ASTRO_MASTER_API_KEY);
  const existingAdmin = await prisma.user.findUnique({ where: { email: "admin@astroengine.io" }, select: { id: true } });
  const admin = await prisma.user.upsert({
    where: { email: "admin@astroengine.io" },
    update: {
      role: "ADMIN",
      planTier: "ENTERPRISE",
      isBlocked: false,
    },
    create: {
      email: "admin@astroengine.io",
      name: "Master Administrator",
      role: "ADMIN",
      emailVerified: true,
      password: hashPassword(adminPassword.value),
      apiKeyHash: adminKey.keyHash,
      apiKeyPrefix: adminKey.keyPrefix,
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
    // Credentials are created EMPTY on purpose: fill them in Admin > Settings (or via env).
    // They are encrypted at rest when SETTINGS_ENCRYPTION_KEY is configured.
    { key: "RAZORPAY_KEY_ID", value: "", category: "PAYMENTS", description: "Razorpay Key ID" },
    { key: "RAZORPAY_KEY_SECRET", value: "", category: "PAYMENTS", description: "Razorpay Key Secret (payment signature verification)" },
    { key: "RAZORPAY_WEBHOOK_SECRET", value: "", category: "PAYMENTS", description: "Razorpay webhook signing secret (webhooks are refused until set)" },
    { key: "R2_ACCOUNT_ID", value: "", category: "STORAGE", description: "Cloudflare Account ID for PDF/logo storage" },
    { key: "R2_ACCESS_KEY_ID", value: "", category: "STORAGE", description: "Cloudflare R2 Access Key ID" },
    { key: "R2_SECRET_ACCESS_KEY", value: "", category: "STORAGE", description: "Cloudflare R2 Secret Access Key" },
    { key: "R2_BUCKET_NAME", value: "", category: "STORAGE", description: "Cloudflare R2 bucket name" },
    { key: "R2_PUBLIC_DOMAIN", value: "", category: "STORAGE", description: "Public CDN domain for stored files" },
    { key: "SMTP_HOST", value: "", category: "EMAIL", description: "Outgoing mail server host" },
    { key: "SMTP_PORT", value: "587", category: "EMAIL", description: "SMTP port (587 TLS / 465 SSL)" },
    { key: "SMTP_USER", value: "", category: "EMAIL", description: "SMTP username / sender address" },
    { key: "SMTP_PASSWORD", value: "", category: "EMAIL", description: "SMTP app password" },
    { key: "SMTP_FROM_NAME", value: "AstroEngine", category: "EMAIL", description: "Sender display name" },
    // Which API modules each plan may call (checked on every request)
    { key: "PLAN_MODULES_STARTER", value: "core,panchang,parashari,general,tarot,vastu", category: "PERMISSIONS", description: "Allowed API modules for STARTER" },
    { key: "PLAN_MODULES_PRO", value: "core,panchang,parashari,dasha,kp,dosha,matching,dosha_matching,remedies,numerology,western,lalkitab,advanced,general,tarot,vastu", category: "PERMISSIONS", description: "Allowed API modules for PRO" },
    { key: "PLAN_MODULES_ENTERPRISE", value: "*", category: "PERMISSIONS", description: "Allowed API modules for ENTERPRISE" },
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
      priceMonthly: 4999,
      includedQuota: 35000,
      rateLimitPerMin: 60,
      overageCost: 0.02,
      features: [
        "35,000 Requests / Month",
        "60 RPM Rate Limit",
        "Core Astronomy (Planets, Cusps, Retrograde)",
        "Panchang & Muhurat (5 Limbs & Choghadiya)",
        "Basic Kundli (D1 Lagna & D9 Navamsha)",
        "Vedic Astrological Remedies"
      ],
      isPopular: false
    },
    {
      tier: "PRO" as const,
      name: "PRO",
      priceMonthly: 14999,
      includedQuota: 300000,
      rateLimitPerMin: 300,
      overageCost: 0.015,
      features: [
        "300,000 Requests / Month",
        "300 RPM Rate Limit",
        "Full D1–D60 Divisional Vargas (Harmonics)",
        "120-Yr Vimshottari Dasha Hierarchy (MD/AD/PD)",
        "KP Stellar Astrology & Sub-Lords 1–249",
        "36-Guna Kundli Matchmaking & Dosha Engine",
        "Lal Kitab Debts (Rin) & Varshphal Returns",
        "Numerology Engine & Western Tropical Synastry",
        "99.9% Production SLA & Priority Support"
      ],
      isPopular: true
    },
    {
      tier: "ENTERPRISE" as const,
      name: "ENTERPRISE",
      priceMonthly: 39999,
      includedQuota: 1500000,
      rateLimitPerMin: 1200,
      overageCost: 0.01,
      features: [
        "1,500,000 Requests / Month",
        "1,200 RPM High-Volume Burst Capacity",
        "ALL 117 Production Calculation APIs Unlocked",
        "Full Automated 12–60 Page PDF Report Engine",
        "Whitelabel Branding, Custom Logo & Watermark",
        "Multi-User Team Sub-Accounts & API Keys",
        "Custom Ephemeris & Dedicated Slack 24/7 SLA"
      ],
      isPopular: false
    }
  ];

  for (const p of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { tier: p.tier },
      update: {
        name: p.name,
        priceMonthly: p.priceMonthly,
        includedQuota: p.includedQuota,
        rateLimitPerMin: p.rateLimitPerMin,
        overageCost: p.overageCost,
        features: p.features,
        isPopular: p.isPopular
      },
      create: p
    });
  }
  console.log(`✓ Seeded ${plans.length} Subscription Plans`);

  console.log("\nSetup complete! Admin login: admin@astroengine.io");
  if (existingAdmin) {
    console.log("Admin already existed: its password and API key were NOT changed.");
  } else {
    console.log(adminPassword.generated
      ? `Password (generated, shown once): ${adminPassword.value}`
      : "Password: (from SEED_ADMIN_PASSWORD)");
    console.log(`Admin API key (shown once, use it as ASTRO_INTERNAL_API_KEY): ${adminKey.rawKey}`);
  }
  console.log("Next: set SESSION_SECRET / ASTRO_INTERNAL_SECRET, fill Razorpay/R2/SMTP in Admin > Settings, and enable 2FA on the admin profile.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
