"use client";

import React, { useEffect, useState } from "react";
import { Webhook, Mail, CheckCircle2, Save, Loader2, ShieldCheck } from "lucide-react";

// Cryptographically secure signing secret (256 bits).
function generateWebhookSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return "whsec_" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// One switch per event group. Keys match src/lib/notificationPrefs.ts, which is also what the
// notification queue checks before it queues or sends anything.
type PrefKey =
  | "emailLowBalance" | "emailQuotaWarning" | "emailPayments" | "emailInvoices" | "emailRefunds"
  | "emailPdfReady" | "emailPdfFailed" | "emailSpikeAlert";

const DEFAULTS: Record<PrefKey, boolean> = {
  emailLowBalance: true, emailQuotaWarning: true, emailPayments: true, emailInvoices: true, emailRefunds: true,
  emailPdfReady: false, emailPdfFailed: true, emailSpikeAlert: true,
};

const GROUPS: Array<{ title: string; items: Array<{ key: PrefKey; label: string; help: string }> }> = [
  {
    title: "Billing & wallet",
    items: [
      { key: "emailLowBalance", label: "Low Prepaid Balance Alert", help: "When your wallet falls below ₹50, so calls and reports are not interrupted (at most once a day)." },
      { key: "emailQuotaWarning", label: "Monthly Quota Consumption (80% & 100%)", help: "When your monthly included calls cross 80% and 100%." },
      { key: "emailPayments", label: "Payment received", help: "Wallet top-ups, plan purchases and add-on purchases." },
      { key: "emailInvoices", label: "Tax invoice issued", help: "Each purchase invoice and the consolidated invoice at the end of every month." },
      { key: "emailRefunds", label: "Refund issued", help: "When money is returned to your wallet because a call or report failed." },
    ],
  },
  {
    title: "PDF reports",
    items: [
      { key: "emailPdfReady", label: "Report ready", help: "An email with the download link whenever a report finishes rendering." },
      { key: "emailPdfFailed", label: "Report failed", help: "When a report could not be generated (and whether it was refunded)." },
    ],
  },
  {
    title: "Reliability",
    items: [
      { key: "emailSpikeAlert", label: "Unusual Error Spike (4xx/5xx) Alert", help: "If more than 5% of your calls fail within 10 minutes." },
    ],
  },
];

interface QueueRow { id: string; event: string; channel: string; status: string; attempts: number; createdAt: string; sentAt: string | null }

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>(DEFAULTS);
  const [accountWebhookUrl, setAccountWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [recent, setRecent] = useState<QueueRow[]>([]);

  const loadRecent = () =>
    fetch("/api/user/notifications")
      .then((r) => r.json())
      .then((j) => setRecent(j.notifications || []))
      .catch(() => undefined);

  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "success" && json.data) {
          const u = json.data;
          setAccountWebhookUrl(u.accountWebhookUrl || "");
          setWebhookSecret(u.accountWebhookSecret || generateWebhookSecret());
          if (u.notificationPrefs) {
            setPrefs((p) => {
              const next = { ...p };
              for (const k of Object.keys(DEFAULTS) as PrefKey[]) {
                if (typeof u.notificationPrefs[k] === "boolean") next[k] = u.notificationPrefs[k];
              }
              return next;
            });
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    void loadRecent();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountWebhookUrl, accountWebhookSecret: webhookSecret, notificationPrefs: prefs }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    setTestMsg(null);
    try {
      const res = await fetch("/api/user/notifications/test", { method: "POST" });
      const j = await res.json();
      setTestMsg(
        j.status !== "success"
          ? j.message || "Could not send the test."
          : j.delivered > 0
            ? "Test notification sent. Check your inbox."
            : "Test queued. It will be delivered shortly (check again in a minute)."
      );
      void loadRecent();
    } catch {
      setTestMsg("Could not send the test.");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <Loader2 className="w-5 h-5 animate-spin text-ink-muted" />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Notifications & Webhooks</h1>
        <p className="text-xs text-ink-soft mt-1">
          Choose which events you want to hear about. Only the events you switch on are queued and sent: by email, and
          to your account webhook if you set one below.
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Notification rules and account webhook saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {GROUPS.map((group) => (
          <div key={group.title} className="bg-white rounded-md border border-line shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-line">
              <Mail className="w-4 h-4 text-ink-soft" />
              <h2 className="text-sm font-bold text-ink">{group.title}</h2>
            </div>
            <div className="space-y-3.5 pt-1">
              {group.items.map((item) => (
                <label key={item.key} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs[item.key]}
                    onChange={(e) => setPrefs((p) => ({ ...p, [item.key]: e.target.checked }))}
                    className="mt-1 w-4 h-4 rounded border-line text-ink focus:ring-ink"
                  />
                  <div>
                    <span className="text-xs font-bold text-ink block">{item.label}</span>
                    <span className="text-[11px] text-ink-soft">{item.help}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-white rounded-md border border-line shadow-xs p-6">
          <div className="flex items-center gap-2 pb-3 border-b border-line">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-ink">Security alerts (always on)</h2>
          </div>
          <p className="text-[11px] text-ink-soft pt-3">
            Password changed or reset, and two-factor authentication turned on or off are always emailed to you.
            They cannot be switched off, so a takeover of your account never goes unnoticed.
          </p>
        </div>

        {/* Global Account Webhook */}
        <div className="bg-white rounded-md border border-line shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-line">
            <Webhook className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-bold text-ink">Account-Level Event Webhook</h2>
          </div>

          <p className="text-xs text-ink-soft">
            The events you switched on above are also POSTed to this HTTPS endpoint (signed with the secret below), with
            retries if your server is down. Security alerts are never sent to webhooks.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Webhook Payload Endpoint (HTTPS only)</label>
              <input
                type="url"
                value={accountWebhookUrl}
                onChange={(e) => setAccountWebhookUrl(e.target.value)}
                placeholder="https://yourserver.com/api/webhooks/astroengine"
                className="w-full px-3 py-2 text-xs font-mono border border-line rounded-lg focus:outline-hidden focus:border-ink-muted"
              />
              <p className="text-[11px] text-ink-muted mt-1">Leave empty to receive emails only.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">HMAC SHA-256 Signing Secret</label>
              <div className="flex items-center gap-2">
                <input type="text" readOnly value={webhookSecret} className="w-full px-3 py-2 text-xs font-mono bg-surface border border-line rounded-lg text-ink-soft" />
                <button
                  type="button"
                  onClick={() => setWebhookSecret(generateWebhookSecret())}
                  className="px-3 py-2 text-xs font-semibold bg-white hover:bg-surface border border-line text-ink rounded-lg whitespace-nowrap shadow-xs transition"
                >
                  Rotate Secret
                </button>
              </div>
              <p className="text-[11px] text-ink-muted mt-1">
                Verify the <code>x-astroengine-signature</code> HTTP header in your backend using this secret key.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={sendTest}
              disabled={testing}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-surface-alt hover:bg-line text-ink text-xs font-semibold flex items-center justify-center gap-2 border border-line transition disabled:opacity-50"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5 text-ink-soft" />}
              <span>Send Test Notification</span>
            </button>
            {testMsg && <span className="text-[11px] text-ink-soft">{testMsg}</span>}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-console hover:bg-console-line text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? "Saving..." : "Save Preferences"}</span>
          </button>
        </div>
      </form>

      <div className="bg-white rounded-md border border-line shadow-xs">
        <div className="px-6 py-4 border-b border-line">
          <h2 className="text-sm font-bold text-ink">Recent notifications</h2>
          <p className="text-[11px] text-ink-soft mt-0.5">Delivery status of the latest alerts sent to you.</p>
        </div>
        {recent.length === 0 ? (
          <div className="p-6 text-xs text-ink-muted">Nothing sent yet.</div>
        ) : (
          <div className="divide-y divide-line">
            {recent.map((n) => (
              <div key={n.id} className="px-6 py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-semibold text-ink">{n.event}</span>
                  <span className="text-ink-muted"> · {n.channel === "WEBHOOK" ? "webhook" : "email"} · {new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    n.status === "SENT" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : n.status === "FAILED" ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {n.status === "PENDING" && n.attempts > 0 ? "retrying" : n.status.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
