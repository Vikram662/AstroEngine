import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";
import { requireAdminSession } from "@/lib/authGuard";

const INTERNAL_SECRET = process.env.ASTRO_INTERNAL_SECRET;

// Event types based on §14:
// 'LOW_BALANCE' | 'QUOTA_80' | 'QUOTA_100' | 'ERROR_SPIKE' | 'PDF_READY' | 'PDF_FAILED'
export async function POST(req: NextRequest) {
  try {
    // Strict Internal/Admin Authorization Guard:
    const authHeader = req.headers.get("x-internal-secret");
    const isInternalAuth = INTERNAL_SECRET && authHeader === INTERNAL_SECRET;
    
    if (!isInternalAuth) {
      const admin = await requireAdminSession();
      if (!admin) {
        return NextResponse.json(
          { status: "error", message: "Forbidden: Internal engine secret or admin session required." },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { userId, eventType, data } = body;

    if (!userId || !eventType) {
      return NextResponse.json(
        { status: "error", message: "userId and eventType are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.email) {
      return NextResponse.json(
        { status: "error", message: "User not found." },
        { status: 404 }
      );
    }

    const prefs = (user.notificationPrefs as {
      emailLowBalance?: boolean;
      emailQuotaWarning?: boolean;
      emailSpikeAlert?: boolean;
      emailPdfReady?: boolean;
    }) || {
      emailLowBalance: true,
      emailQuotaWarning: true,
      emailSpikeAlert: true,
      emailPdfReady: false
    };

    let subject = "";
    let html = "";
    let shouldSendEmail = true;

    if (eventType === "LOW_BALANCE") {
      if (!prefs.emailLowBalance) shouldSendEmail = false;
      subject = "⚠️ Your AstroEngine wallet is running low";
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
          <h2 style="color: #0f172a;">AstroEngine Wallet Warning</h2>
          <p>Hi ${user.name || "Developer"},</p>
          <p>Your wallet balance is currently <strong>₹${data?.balance || user.walletBalance.toFixed(2)}</strong>.</p>
          <p>To prevent sudden interruption of your live API integrations, please top up your prepaid balance.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/billing" style="display: inline-block; background: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Recharge Wallet</a>
        </div>
      `;
    } else if (eventType === "QUOTA_80") {
      if (!prefs.emailQuotaWarning) shouldSendEmail = false;
      subject = `You've used 80% of your ${user.planTier} plan's monthly calls`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a;">Monthly Quota Warning (80%)</h2>
          <p>${user.monthlyUsage} of ${user.monthlyQuota} included calls used this cycle.</p>
          <p>Once you hit 100%, calls will continue automatically from your wallet balance at standard rates without service disruption.</p>
        </div>
      `;
    } else if (eventType === "ERROR_SPIKE") {
      if (!prefs.emailSpikeAlert) shouldSendEmail = false;
      subject = "We're seeing a higher-than-usual error rate on your account";
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0;">
          <h2 style="color: #e11d48;">Anomaly Detected</h2>
          <p>Unusual spike in 4xx/5xx responses detected on your API key within the last 15 minutes.</p>
          <p>Please review your telemetry logs in the Developer Console to ensure payload formats match specifications.</p>
        </div>
      `;
    } else if (eventType === "PDF_READY") {
      if (!prefs.emailPdfReady) shouldSendEmail = false;
      subject = `Your ${data?.reportType || "Brihat Kundli"} report is ready`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0;">
          <h2 style="color: #10b981;">PDF Compilation Complete</h2>
          <p>Your report has finished rendering.</p>
          <a href="${data?.downloadUrl || "#"}" style="display: inline-block; background: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Download PDF</a>
          <p style="font-size: 11px; color: #64748b; margin-top: 10px;">Link expires in 24 hours per Cloudflare R2 auto-expiry policy.</p>
        </div>
      `;
    }

    // 1. Send Email if user has opted-in
    let emailResult = null;
    if (shouldSendEmail) {
      emailResult = await sendNotificationEmail({
        to: user.email,
        subject,
        html
      });
    }

    // 2. Dispatch to Account-Level Webhook if configured (§8.2.7)
    let webhookResult = null;
    if (user.accountWebhookUrl) {
      try {
        const { validateSafeWebhookUrl } = await import("@/lib/ssrf");
        const safetyCheck = await validateSafeWebhookUrl(user.accountWebhookUrl);

        if (!safetyCheck.valid) {
          webhookResult = { delivered: false, error: `SSRF Blocked: ${safetyCheck.reason}` };
        } else {
          const crypto = await import("crypto");
          const payload = JSON.stringify({
            event: eventType,
            userId: user.id,
            timestamp: new Date().toISOString(),
            data
          });
          const signature = user.accountWebhookSecret 
            ? crypto.createHmac("sha256", user.accountWebhookSecret).update(payload).digest("hex")
            : "";

          const whRes = await fetch(user.accountWebhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-astroengine-signature": signature
            },
            body: payload,
            signal: AbortSignal.timeout(5000)
          });
          webhookResult = { delivered: whRes.ok, status: whRes.status };
        }
      } catch (err: unknown) {
        const error = err as { message?: string };
        webhookResult = { delivered: false, error: error.message };
      }
    }

    return NextResponse.json({
      status: "success",
      emailSent: shouldSendEmail,
      emailResult,
      webhookResult
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
