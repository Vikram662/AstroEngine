import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/settings - Read ALL dynamic system settings directly from MySQL table
export async function GET() {
  try {
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
      { key: "SMTP_FROM_NAME", value: "AstroEngine Cloud Notifications", category: "EMAIL", description: "Sender Display Name" }
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

    const settingsMap: Record<string, string> = {};
    for (const s of existing) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({
      status: "success",
      data: settingsMap,
      raw: existing
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}

// POST /api/admin/settings - Save or Add any dynamic setting from Admin panel
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionRole = cookieStore.get("astro_session_role")?.value;

    if (sessionRole !== "ADMIN" && sessionRole !== "SUPER_ADMIN") {
      return NextResponse.json({ status: "error", message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updates: Array<{ key: string; value: string; category?: string; description?: string }> = body.settings || [];

    for (const item of updates) {
      if (!item.key) continue;
      await prisma.systemSetting.upsert({
        where: { key: item.key },
        update: { 
          value: String(item.value ?? "") 
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
    const cookieStore = await cookies();
    const sessionRole = cookieStore.get("astro_session_role")?.value;

    if (sessionRole !== "ADMIN" && sessionRole !== "SUPER_ADMIN") {
      return NextResponse.json({ status: "error", message: "Forbidden" }, { status: 403 });
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
