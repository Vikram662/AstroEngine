import nodemailer from "nodemailer";
import { prisma } from "./prisma";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function getSmtpConfig() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM_NAME"]
        }
      }
    });

    const configMap: Record<string, string> = {};
    for (const s of settings) {
      configMap[s.key] = s.value;
    }

    return {
      host: configMap["SMTP_HOST"] || process.env.SMTP_HOST,
      port: Number(configMap["SMTP_PORT"] || process.env.SMTP_PORT) || 587,
      user: configMap["SMTP_USER"] || process.env.SMTP_USER,
      pass: configMap["SMTP_PASSWORD"] || process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
      fromName: configMap["SMTP_FROM_NAME"] || process.env.SMTP_FROM_NAME || "AstroEngine Security",
      fromEmail: configMap["SMTP_USER"] || process.env.SMTP_FROM || "no-reply@astroengine.io"
    };
  } catch {
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
      fromName: "AstroEngine Security",
      fromEmail: process.env.SMTP_FROM || "no-reply@astroengine.io"
    };
  }
}

export async function sendNotificationEmail({ to, subject, html }: EmailPayload) {
  const config = await getSmtpConfig();

  if (!config.host || !config.user || !config.pass || config.pass.includes("placeholder")) {
    // In dev mode or unconfigured SMTP, cleanly log OTP/Content to console
    console.log("\n==================== [DISPATCH EMAIL (DEV / LOCAL LOG)] ====================");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("Content:");
    console.log(html.replace(/<[^>]*>?/gm, "").trim());
    console.log("===========================================================================\n");
    return { success: true, mode: "dev_logged" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass
      }
    });

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      html
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email via SMTP:", error);
    return { success: false, error };
  }
}

export async function sendVerificationOtpEmail(to: string, otp: string) {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 30px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 700;">AstroEngine Developer Portal</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 6px;">Email Verification Code</p>
      </div>
      
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">
        Welcome to AstroEngine! To complete your developer registration and activate your ₹100 free test credits, please use the 6-digit verification code below:
      </p>

      <div style="margin: 28px 0; text-align: center;">
        <div style="display: inline-block; padding: 14px 28px; background: #f8fafc; border: 2px dashed #6366f1; border-radius: 8px; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4338ca; font-family: monospace;">
          ${otp}
        </div>
      </div>

      <p style="color: #64748b; font-size: 12px; line-height: 1.5; text-align: center;">
        This code is valid for <strong>10 minutes</strong>. If you did not initiate this request, please ignore this email.
      </p>

      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
        &copy; ${new Date().getFullYear()} AstroEngine Enterprise. High-Precision Astrological Calculations.
      </p>
    </div>
  `;

  return sendNotificationEmail({
    to,
    subject: `Your AstroEngine Verification Code: ${otp}`,
    html
  });
}
