import { escapeHtml, safeHttpUrl } from "@/lib/html";
import type { NotificationEvent } from "@/lib/notificationPrefs";

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const e = (v: unknown) => escapeHtml(v == null ? "" : String(v));
const inr = (n: unknown) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const clean = (v: unknown) => Array.from(String(v ?? "")).map((c) => (c.charCodeAt(0) < 32 ? " " : c)).join("").slice(0, 80);

function frame(title: string, body: string, accent = "#0f172a", cta?: { label: string; href: string }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0;">
      <h2 style="color: ${accent}; margin: 0 0 12px;">${e(title)}</h2>
      ${body}
      ${cta ? `<a href="${e(safeHttpUrl(cta.href))}" style="display: inline-block; background: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 14px;">${e(cta.label)}</a>` : ""}
      <p style="font-size: 11px; color: #94a3b8; margin-top: 18px;">You can change which alerts you receive under Dashboard &gt; Settings &gt; Notifications.</p>
    </div>`;
}

export interface RenderedNotification {
  subject: string;
  html: string;
}

export function renderNotification(
  event: NotificationEvent,
  user: { name: string | null },
  data: Record<string, unknown>
): RenderedNotification {
  const hi = `<p>Hi ${e(user.name || "Developer")},</p>`;
  const billing = `${APP_URL()}/billing`;

  switch (event) {
    case "LOW_BALANCE":
      return {
        subject: "⚠️ Your AstroEngine wallet is running low",
        html: frame("Wallet balance is low", `${hi}<p>Your wallet balance is <strong>${inr(data.balance)}</strong>. Top up to avoid interruption of your live API calls and report generation.</p>`, "#0f172a", { label: "Recharge Wallet", href: billing }),
      };
    case "QUOTA_80":
      return {
        subject: "You've used 80% of this month's included API calls",
        html: frame("Monthly quota: 80% used", `${hi}<p>${e(data.used)} of ${e(data.quota)} included calls used this cycle on the ${e(data.plan)} plan. Calls beyond 100% are charged per call from your wallet.</p>`),
      };
    case "QUOTA_100":
      return {
        subject: "You've used all of this month's included API calls",
        html: frame("Monthly quota: 100% used", `${hi}<p>Your included calls (${e(data.quota)}) are used up. From now on each call is charged to your wallet at the overage rate and invoiced once at the end of the month.</p>`, "#b45309", { label: "Check wallet", href: billing }),
      };
    case "ERROR_SPIKE":
      return {
        subject: "We're seeing a higher-than-usual error rate on your account",
        html: frame("Anomaly detected", `${hi}<p>${e(data.errors)} of your last ${e(data.calls)} calls (${e(data.rate)}%) failed in the last 10 minutes. Please review your usage logs and request payloads.</p>`, "#e11d48"),
      };
    case "PDF_READY":
      return {
        subject: `Your ${clean(data.reportType || "Kundli")} report is ready`,
        html: frame("PDF report ready", `${hi}<p>Your report has finished rendering.</p>`, "#10b981", data.downloadUrl ? { label: "Download PDF", href: String(data.downloadUrl) } : { label: "Open Reports", href: `${APP_URL()}/pdf-reports` }),
      };
    case "PDF_FAILED":
      return {
        subject: `Your ${clean(data.reportType || "Kundli")} report could not be generated`,
        html: frame("PDF report failed", `${hi}<p>We could not generate your report.${data.refunded ? " The amount was refunded to your wallet." : ""} Please try again; if it keeps failing contact support.</p>`, "#e11d48", { label: "Open Reports", href: `${APP_URL()}/pdf-reports` }),
      };
    case "PAYMENT_RECEIVED":
      return {
        subject: `Payment received: ${inr(data.amount)}`,
        html: frame("Payment received", `${hi}<p>We received <strong>${inr(data.amount)}</strong> for <strong>${e(data.description || "your payment")}</strong>.${data.creditsAdded ? ` ${inr(data.creditsAdded)} was added to your wallet.` : ""}</p>`, "#10b981", { label: "View invoices", href: `${APP_URL()}/invoices` }),
      };
    case "INVOICE_ISSUED":
      return {
        subject: `Tax invoice ${clean(data.number)} issued`,
        html: frame("Tax invoice issued", `${hi}<p>Invoice <strong>${e(data.number)}</strong> for <strong>${inr(data.gross)}</strong> (GST included) has been issued${data.period ? ` for ${e(data.period)}` : ""}.</p>`, "#0f172a", { label: "View invoice", href: data.invoiceId ? `${APP_URL()}/api/billing/invoice/${encodeURIComponent(String(data.invoiceId))}` : `${APP_URL()}/invoices` }),
      };
    case "REFUND_ISSUED":
      return {
        subject: `Refund issued: ${inr(data.amount)}`,
        html: frame("Refund issued", `${hi}<p>${inr(data.amount)} was returned to your wallet because ${e(data.reason || "a request did not complete")}.</p>`, "#10b981", { label: "Open billing", href: billing }),
      };
    case "PASSWORD_CHANGED":
      return {
        subject: "Your AstroEngine password was changed",
        html: frame("Password changed", `${hi}<p>The password of your account was just changed${data.via ? ` (${e(data.via)})` : ""}. All other devices were signed out.</p><p><strong>If this was not you,</strong> reset your password immediately and contact support.</p>`, "#e11d48"),
      };
    case "TWO_FA_CHANGED":
      return {
        subject: data.enabled ? "Two-factor authentication was enabled" : "Two-factor authentication was disabled",
        html: frame(data.enabled ? "Two-factor authentication enabled" : "Two-factor authentication disabled", `${hi}<p>Two-factor authentication on your account was ${data.enabled ? "turned on" : "turned off"}.</p><p><strong>If this was not you,</strong> change your password immediately and contact support.</p>`, data.enabled ? "#10b981" : "#e11d48"),
      };
    case "TEST":
    default:
      return { subject: "AstroEngine test notification", html: frame("Test notification", `${hi}<p>Your notification settings work: this e-mail was delivered through the queue.</p>`) };
  }
}
