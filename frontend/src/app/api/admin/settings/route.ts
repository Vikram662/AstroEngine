import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/authGuard";

// GET /api/admin/settings - Read ALL dynamic system settings directly from MySQL table (Admin Only)
export async function GET() {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ status: "error", message: "Forbidden: Admin authorization required." }, { status: 403 });
    }

    // Default system keys definitions
    const standardKeys = [
      { key: "RAZORPAY_KEY_ID", value: "rzp_test_1DP5mmOlF5G5ag", category: "PAYMENTS", description: "Razorpay Standard Test Key ID" },
      { key: "RAZORPAY_KEY_SECRET", value: "s8e8w9f0a1b2c3d4e5f6g7h8", category: "PAYMENTS", description: "Razorpay Secret Key for HMAC signature verification" },
      { key: "RAZORPAY_WEBHOOK_SECRET", value: "whsec_astro_enterprise_live2026", category: "PAYMENTS", description: "Razorpay Webhook secret for auto-verification" },
      { key: "R2_ACCOUNT_ID", value: "cf_acc_9012a3b4c5d6e7f8", category: "STORAGE", description: "Cloudflare Account ID for PDF Object Storage" },
      { key: "R2_ACCESS_KEY_ID", value: "r2_key_817291a0b2c3", category: "STORAGE", description: "Cloudflare R2 Access Key ID" },
      { key: "R2_SECRET_ACCESS_KEY", value: "r2_sec_99182736450192837465", category: "STORAGE", description: "Cloudflare R2 Secret Access Key" },
      { key: "R2_BUCKET_NAME", value: "astro-pdf-reports", category: "STORAGE", description: "Cloudflare R2 Storage Bucket Name" },
      { key: "R2_PUBLIC_DOMAIN", value: "https://cdn.astroengine.io", category: "STORAGE", description: "Public CDN domain or custom domain for PDF downloads" },
      { key: "SMTP_HOST", value: "smtp.gmail.com", category: "EMAIL", description: "Outgoing Mail Server Host" },
      { key: "SMTP_PORT", value: "587", category: "EMAIL", description: "SMTP Port (587 for TLS, 465 for SSL)" },
      { key: "SMTP_USER", value: "notifications@astroengine.io", category: "EMAIL", description: "SMTP Username / Sender Email Address" },
      { key: "SMTP_PASSWORD", value: "abcd efgh ijkl mnop", category: "EMAIL", description: "SMTP App Password" },
      { key: "SMTP_FROM_NAME", value: "AstroEngine Cloud Notifications", category: "EMAIL", description: "Sender Display Name" },
      
      // Company & Legal Invoicing Profile
      { key: "COMPANY_NAME", value: "AstroEngine Technologies Pvt. Ltd.", category: "COMPANY", description: "Official Registered Company Display Name" },
      { key: "COMPANY_LOGO_URL", value: "", category: "COMPANY", description: "Company Brand Logo URL (PNG/SVG/WebP)" },
      { key: "COMPANY_LEGAL_NAME", value: "AstroEngine Cloud Services", category: "COMPANY", description: "Legal Trade / Operating Name for Invoices" },
      { key: "COMPANY_TAGLINE", value: "Enterprise Vedic & Western Astrology API Infrastructure", category: "COMPANY", description: "Company Tagline / Subtitle" },
      { key: "COMPANY_GSTIN", value: "27AABCA1234F1Z8", category: "COMPANY", description: "Company GSTIN Number for Invoices" },
      { key: "COMPANY_PAN", value: "AABCA1234F", category: "COMPANY", description: "Company PAN Number" },
      { key: "COMPANY_SAC_CODE", value: "998313", category: "COMPANY", description: "GST SAC / HSN Service Code" },
      { key: "COMPANY_ADDRESS_LINE1", value: "Level 4, Tech Park, Bandra Kurla Complex", category: "COMPANY", description: "Registered Office Address Line 1" },
      { key: "COMPANY_CITY", value: "Mumbai", category: "COMPANY", description: "City" },
      { key: "COMPANY_STATE", value: "Maharashtra", category: "COMPANY", description: "State" },
      { key: "COMPANY_STATE_CODE", value: "27", category: "COMPANY", description: "GST State Code (e.g. 27 for Maharashtra)" },
      { key: "COMPANY_PINCODE", value: "400051", category: "COMPANY", description: "Postal Pincode" },
      { key: "COMPANY_COUNTRY", value: "India", category: "COMPANY", description: "Country" },
      { key: "COMPANY_PHONE", value: "+91 22 4910 8800", category: "COMPANY", description: "Official Support & Billing Phone Number" },
      { key: "COMPANY_EMAIL", value: "billing@astroengine.io", category: "COMPANY", description: "Official Billing Email Address" },
      { key: "COMPANY_SUPPORT_EMAIL", value: "support@astroengine.io", category: "COMPANY", description: "Customer Support Email Address" },
      { key: "COMPANY_WEBSITE", value: "https://astroengine.io", category: "COMPANY", description: "Official Website URL" },
      
      // Social Media Handles
      { key: "SOCIAL_TWITTER", value: "https://x.com/astroengine", category: "SOCIAL", description: "Twitter / X Profile URL" },
      { key: "SOCIAL_LINKEDIN", value: "https://linkedin.com/company/astroengine", category: "SOCIAL", description: "LinkedIn Organization URL" },
      { key: "SOCIAL_YOUTUBE", value: "https://youtube.com/@astroengine", category: "SOCIAL", description: "YouTube Channel URL" },
      { key: "SOCIAL_GITHUB", value: "https://github.com/Vikram662/AstroEngine", category: "SOCIAL", description: "GitHub Repository URL" }
    ];

    // Ensure all standard keys exist
    for (const item of standardKeys) {
      const exists = await prisma.systemSetting.findUnique({ where: { key: item.key } });
      if (!exists) {
        await prisma.systemSetting.create({ data: item });
      }
    }

    const existing = await prisma.systemSetting.findMany({
      orderBy: { key: "asc" }
    });

    const SENSITIVE_KEYS = [
      "RAZORPAY_KEY_SECRET",
      "RAZORPAY_WEBHOOK_SECRET",
      "R2_SECRET_ACCESS_KEY",
      "SMTP_PASSWORD",
      "INTERNAL_SECRET_KEY",
      "ASTRO_INTERNAL_SECRET"
    ];

    const settingsMap: Record<string, string> = {};
    for (const s of existing) {
      if (SENSITIVE_KEYS.includes(s.key) && s.value && s.value.length > 4) {
        settingsMap[s.key] = `${s.value.slice(0, 3)}••••••••${s.value.slice(-3)}`;
      } else {
        settingsMap[s.key] = s.value;
      }
    }

    const maskedRaw = existing.map((s: { key: string; value: string; [k: string]: unknown }) => {
      if (SENSITIVE_KEYS.includes(s.key) && s.value && s.value.length > 4) {
        return {
          ...s,
          value: `${s.value.slice(0, 3)}••••••••${s.value.slice(-3)}`
        };
      }
      return s;
    });

    return NextResponse.json({
      status: "success",
      data: settingsMap,
      raw: maskedRaw
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}

// POST /api/admin/settings - Save or Add any dynamic setting from Admin panel
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ status: "error", message: "Forbidden: Admin authorization required." }, { status: 403 });
    }

    const body = await req.json();
    const updates: Array<{ key: string; value: string; category?: string; description?: string }> = body.settings || [];

    for (const item of updates) {
      if (!item.key) continue;
      const strVal = String(item.value ?? "");
      // Skip updating if value was left masked
      if (strVal.includes("••••••••")) continue;

      await prisma.systemSetting.upsert({
        where: { key: item.key },
        update: { 
          value: strVal
        },
        create: {
          key: item.key,
          value: String(item.value ?? ""),
          category: item.category || "GENERAL",
          description: item.description || null
        }
      });
    }

    return NextResponse.json({
      status: "success",
      message: "Database settings updated successfully"
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/settings - Delete a custom setting key dynamically
export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ status: "error", message: "Forbidden: Admin authorization required." }, { status: 403 });
    }

    const { key } = await req.json();
    if (!key) {
      return NextResponse.json({ status: "error", message: "Key required" }, { status: 400 });
    }

    await prisma.systemSetting.delete({
      where: { key }
    });

    return NextResponse.json({
      status: "success",
      message: `Setting ${key} deleted`
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
