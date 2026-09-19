import nodemailer from "nodemailer";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendNotificationEmail({ to, subject, html }: EmailPayload) {
  // Check if SMTP environment variables are configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM || "alerts@astroengine.io";

  if (!smtpHost || !smtpUser || !smtpPass) {
    // Log to console in dev mode with formatting
    console.log("==================== [DISPATCH EMAIL (DEV LOG)] ====================");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("Content:");
    console.log(html.replace(/<[^>]*>?/gm, "")); // strip tags for clean terminal inspection
    console.log("====================================================================");
    return { success: true, mode: "dev_logged" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const info = await transporter.sendMail({
      from: `"AstroEngine Notifications" <${fromEmail}>`,
      to,
      subject,
      html
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send notification email:", error);
    return { success: false, error };
  }
}
