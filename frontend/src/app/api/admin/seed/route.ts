import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// POST /api/admin/seed - Direct browser/API triggered seed
export async function POST() {
  try {
    const adminPasswordHash = crypto.createHash("sha256").update("Admin@12345").digest("hex");

    const masterKey = "ak_live_dev_test_master_key_astro2026";
    const masterKeyHash = crypto.createHash("sha256").update(masterKey).digest("hex");

    // 1. Create/Update Admin User with known developer key
    const admin = await prisma.user.upsert({
      where: { email: "admin@astroengine.io" },
      update: {
        role: "ADMIN",
        password: adminPasswordHash,
        planTier: "ENTERPRISE",
        apiKeyHash: masterKeyHash,
        apiKeyPrefix: "ak_live_dev_test",
        isBlocked: false,
      },
      create: {
        email: "admin@astroengine.io",
        name: "Master Administrator",
        role: "ADMIN",
        password: adminPasswordHash,
        apiKeyHash: masterKeyHash,
        apiKeyPrefix: "ak_live_dev_test",
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
      { key: "AUTO_REFUND_FAILED_JOBS", value: "true", category: "BILLING", description: "Automatically refund credits if a PDF job fails or times out" },
      // Payment Gateway (Razorpay) Settings from Database
      { key: "RAZORPAY_KEY_ID", value: "rzp_test_1DP5mmOlF5G5ag", category: "PAYMENTS", description: "Razorpay Standard Test Key ID" },
      { key: "RAZORPAY_KEY_SECRET", value: "s8e8w9f0a1b2c3d4e5f6g7h8", category: "PAYMENTS", description: "Razorpay Secret Key for HMAC signature verification" },
      { key: "RAZORPAY_WEBHOOK_SECRET", value: "whsec_astro_enterprise_live2026", category: "PAYMENTS", description: "Razorpay Webhook secret for auto-verification" },
      // Cloudflare R2 Storage Settings from Database
      { key: "R2_ACCOUNT_ID", value: "cf_acc_9012a3b4c5d6e7f8", category: "STORAGE", description: "Cloudflare Account ID for PDF Object Storage" },
      { key: "R2_ACCESS_KEY_ID", value: "r2_key_817291a0b2c3", category: "STORAGE", description: "Cloudflare R2 Access Key ID" },
      { key: "R2_SECRET_ACCESS_KEY", value: "r2_sec_99182736450192837465", category: "STORAGE", description: "Cloudflare R2 Secret Access Key" },
      { key: "R2_BUCKET_NAME", value: "astro-pdf-reports", category: "STORAGE", description: "Cloudflare R2 Storage Bucket Name" },
      { key: "R2_PUBLIC_DOMAIN", value: "https://cdn.astroengine.io", category: "STORAGE", description: "Public CDN domain or custom domain for PDF downloads" },
      // SMTP Email Delivery Settings from Database
      { key: "SMTP_HOST", value: "smtp.gmail.com", category: "EMAIL", description: "Outgoing Mail Server Host" },
      { key: "SMTP_PORT", value: "587", category: "EMAIL", description: "SMTP Port (587 for TLS, 465 for SSL)" },
      { key: "SMTP_USER", value: "notifications@astroengine.io", category: "EMAIL", description: "SMTP Username / Sender Email Address" },
      { key: "SMTP_PASSWORD", value: "abcd efgh ijkl mnop", category: "EMAIL", description: "SMTP App Password" },
      { key: "SMTP_FROM_NAME", value: "AstroEngine Cloud Notifications", category: "EMAIL", description: "Sender Display Name" }
    ];

    for (const s of defaultSettings) {
      await prisma.systemSetting.upsert({
        where: { key: s.key },
        update: {
          category: s.category,
          description: s.description,
          // Only update value if it was empty or not set
        },
        create: s
      });
    }

    // 3. Insert Subscription Plans (Option A Tier Permissions)
    const plans = [
      {
        tier: "STARTER" as const,
        name: "STARTER",
        priceMonthly: 0,
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
        priceMonthly: 4999,
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
        priceMonthly: 14999,
        includedQuota: 1500000,
        rateLimitPerMin: 1200,
        overageCost: 0.01,
        features: [
          "1,500,000 Requests / Month",
          "1,200 RPM High-Volume Burst Capacity",
          "ALL 117 Production Calculation APIs Unlocked",
          "Full Automated 20+ Page PDF Report Engine",
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
          features: p.features,
          name: p.name,
          priceMonthly: p.priceMonthly,
          includedQuota: p.includedQuota,
          rateLimitPerMin: p.rateLimitPerMin,
          overageCost: p.overageCost
        },
        create: p
      });
    }

    // Seed default PLAN_MODULES settings into MySQL SystemSetting table
    const defaultTierModules = [
      { key: "PLAN_MODULES_STARTER", value: "core,panchang,parashari,general" },
      { key: "PLAN_MODULES_PRO", value: "core,panchang,parashari,dasha,kp,dosha,matching,dosha_matching,remedies,numerology,western,lalkitab,advanced,general" },
      { key: "PLAN_MODULES_ENTERPRISE", value: "*" }
    ];

    for (const tm of defaultTierModules) {
      const exists = await prisma.systemSetting.findUnique({ where: { key: tm.key } });
      if (!exists) {
        await prisma.systemSetting.create({
          data: {
            key: tm.key,
            value: tm.value,
            category: "PERMISSIONS",
            description: `Allowed API modules for ${tm.key.replace("PLAN_MODULES_", "")} tier`
          }
        });
      }
    }

    // 4. Insert Default Addon Packages with Quota and Rate Limits
    const addonPackages = [
      {
        id: "pdf",
        name: "Automated PDF Report Engine",
        category: "REPORTS",
        priceMonthly: 999,
        monthlyQuota: 500, // 500 PDF generations included per month
        rateLimitPerMin: 30, // Rate limit: 30 PDF generation requests / min
        overageCost: 5.00, // ₹5.00 per additional PDF generated beyond 500
        description: "Generate 20+ page print-ready Brihat Kundli, Matchmaking, and Dosha PDF reports with vector charts.",
        features: ["500 PDF Generations / mo", "Vector SVG Charts", "Print-Ready 300 DPI", "Cloudflare R2 Direct URLs"],
        icon: "FileText",
        isActive: true
      },
      {
        id: "numerology",
        name: "Numerology Engine",
        category: "CALCULATIONS",
        priceMonthly: 499,
        monthlyQuota: 50000,
        rateLimitPerMin: 120,
        overageCost: 0.03,
        description: "Full Pythagorean & Chaldean numerology: Life Path, Destiny, Soul Urge, and Personal Year forecasts.",
        features: ["50,000 Calculations / mo", "Chaldean & Pythagorean", "Name Correction Matrix", "10-Year Progressions"],
        icon: "Hash",
        isActive: true
      },
      {
        id: "western",
        name: "Western Tropical Astrology",
        category: "CALCULATIONS",
        priceMonthly: 499,
        monthlyQuota: 50000,
        rateLimitPerMin: 120,
        overageCost: 0.03,
        description: "Tropical zodiac calculations, Placidus/Koch wheels, full 12-planet aspects matrix, and synastry.",
        features: ["50,000 Calculations / mo", "Tropical Planetary Longitudes", "Aspects Matrix (Trine, Square)", "Interactive Wheel SVGs"],
        icon: "Compass",
        isActive: true
      },
      {
        id: "lalkitab",
        name: "Lal Kitab System & Varshphal",
        category: "CALCULATIONS",
        priceMonthly: 499,
        monthlyQuota: 50000,
        rateLimitPerMin: 120,
        overageCost: 0.03,
        description: "Kalpurush conversions, 6 ancestral debts (Rin), sleeping planets, and annual solar Varshphal returns.",
        features: ["50,000 Calculations / mo", "6 Ancestral Debts (Rin)", "Sleeping Houses & Planets", "Annual Varshphal Progressions"],
        icon: "BookOpen",
        isActive: true
      },
      {
        id: "kp",
        name: "KP Astrology (Krishnamurti Paddhati)",
        category: "CALCULATIONS",
        priceMonthly: 599,
        monthlyQuota: 50000,
        rateLimitPerMin: 120,
        overageCost: 0.03,
        description: "Stellar astrology with Sign, Star, and Sub-Lords, Placidus cusps, and instant Horary 1–249 seed calculations.",
        features: ["50,000 Calculations / mo", "Sign / Star / Sub-Lords", "Horary 1–249 Seeds", "Significator Rulers (A/B/C/D)"],
        icon: "Star",
        isActive: true
      },
      {
        id: "dosha_matching",
        name: "Matchmaking & Dosha Engine",
        category: "CALCULATIONS",
        priceMonthly: 499,
        monthlyQuota: 50000,
        rateLimitPerMin: 120,
        overageCost: 0.03,
        description: "Comprehensive 36-Guna Ashtakoota Milan, detailed Manglik Dosha with 20+ cancellations, and Kaal Sarp analysis.",
        features: ["50,000 Calculations / mo", "36-Guna Ashtakoota Milan", "Manglik Dosha & Cancellations", "12 Kaal Sarp Yoga Types"],
        icon: "Heart",
        isActive: true
      },
      {
        id: "doshas",
        name: "Comprehensive All-Dosha Suite",
        category: "CALCULATIONS",
        priceMonthly: 599,
        monthlyQuota: 50000,
        rateLimitPerMin: 120,
        overageCost: 0.03,
        description: "Full Vedic Dosha analysis: Manglik with 20+ cancellations, 12 Kaal Sarp yogas, Saturn Sade Sati & Dhaiya, Pitra Dosha, and Guru Chandal.",
        features: ["50,000 Calculations / mo", "Manglik & 20+ Cancellations", "12 Kaal Sarp Yoga Types", "Saturn Sade Sati & Dhaiya", "Pitra & Guru Chandal Doshas"],
        icon: "ShieldAlert",
        isActive: true
      },
      {
        id: "remedies",
        name: "Astrological Remedies Engine",
        category: "REMEDIES",
        priceMonthly: 399,
        monthlyQuota: 50000,
        rateLimitPerMin: 120,
        overageCost: 0.02,
        description: "Life/Lucky/Benefic gemstone recommendations with Maraka cautions, 1-14 Mukhi Rudraksha prescription, and Beej Mantras.",
        features: ["50,000 Calculations / mo", "Life, Lucky & Benefic Gems", "1-14 Mukhi Rudraksha Matrix", "Vedic & Tantrik Beej Mantras"],
        icon: "Sparkles",
        isActive: true
      }
    ];

    for (const addon of addonPackages) {
      await (prisma as any).addonPackage.upsert({
        where: { id: addon.id },
        update: {
          name: addon.name,
          category: addon.category,
          priceMonthly: addon.priceMonthly,
          monthlyQuota: addon.monthlyQuota,
          rateLimitPerMin: addon.rateLimitPerMin,
          overageCost: addon.overageCost,
          description: addon.description,
          features: addon.features,
          icon: addon.icon,
          isActive: addon.isActive
        },
        create: addon
      });
    }

    // Remove obsolete or discontinued addon ids (e.g. dasha, dosha_matching)
    await (prisma as any).addonPackage.deleteMany({
      where: {
        id: { in: ["dasha", "dosha_matching"] }
      }
    });

    return NextResponse.json({
      status: "success",
      message: "Admin account, Subscription Plans, Addon Packages, and SystemSettings successfully synced into MySQL!",
      masterApiKey: masterKey,
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

// Support browser GET request to trigger seed directly
export async function GET() {
  return POST();
}
