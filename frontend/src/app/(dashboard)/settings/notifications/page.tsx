"use client";

import React, { useEffect, useState } from "react";
import { 
  Bell, 
  Webhook, 
  Mail, 
  ShieldAlert, 
  CheckCircle2, 
  Save, 
  AlertTriangle,
  Loader2
} from "lucide-react";

export default function NotificationsSettingsPage() {
  const [emailLowBalance, setEmailLowBalance] = useState(true);
  const [emailQuotaWarning, setEmailQuotaWarning] = useState(true);
  const [emailPdfReady, setEmailPdfReady] = useState(false);
  const [emailSpikeAlert, setEmailSpikeAlert] = useState(true);
  
  const [accountWebhookUrl, setAccountWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/user/me")
      .then(res => res.json())
      .then(json => {
        if (json.status === "success" && json.data) {
          const u = json.data;
          setAccountWebhookUrl(u.accountWebhookUrl || "");
          setWebhookSecret(u.accountWebhookSecret || `whsec_live_${Math.random().toString(36).substring(2, 12)}`);
          if (u.notificationPrefs) {
            setEmailLowBalance(u.notificationPrefs.emailLowBalance ?? true);
            setEmailQuotaWarning(u.notificationPrefs.emailQuotaWarning ?? true);
            setEmailPdfReady(u.notificationPrefs.emailPdfReady ?? false);
            setEmailSpikeAlert(u.notificationPrefs.emailSpikeAlert ?? true);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountWebhookUrl,
          accountWebhookSecret: webhookSecret,
          notificationPrefs: {
            emailLowBalance,
            emailQuotaWarning,
            emailPdfReady,
            emailSpikeAlert
          }
        })
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

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Alerts & Webhooks Configuration (§8.2.7)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure real-time email warnings and global account webhook endpoints for quota threshold notifications.
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Notification rules and account webhook saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Email Alerts Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Mail className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-900">Email Notification Triggers</h2>
          </div>

          <div className="space-y-3.5 pt-1">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailLowBalance}
                onChange={(e) => setEmailLowBalance(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Low Prepaid Balance Alert</span>
                <span className="text-[11px] text-slate-500">
                  Notify developer when wallet balance falls below ₹50 to prevent sudden call drops.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailQuotaWarning}
                onChange={(e) => setEmailQuotaWarning(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Monthly Quota Consumption (80% & 100%)</span>
                <span className="text-[11px] text-slate-500">
                  Send proactive alert when monthly tier consumption crosses 80% and 100% of included API quota.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailSpikeAlert}
                onChange={(e) => setEmailSpikeAlert(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Unusual Error Spike (5xx) Alert</span>
                <span className="text-[11px] text-slate-500">
                  Instantly trigger an alert if 4xx/5xx responses spike past 5% of normal traffic within 10 minutes.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailPdfReady}
                onChange={(e) => setEmailPdfReady(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">PDF Compilation Completed</span>
                <span className="text-[11px] text-slate-500">
                  Receive an email with direct presigned download link whenever an 80+ page Brihat Kundli finishes rendering.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Global Account Webhook */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Webhook className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-bold text-slate-900">Account-Level Event Webhook (§8.2.7)</h2>
          </div>

          <p className="text-xs text-slate-500">
            Unlike per-job PDF callbacks, this global webhook receives account lifecycle events like <code>account.low_balance</code>, <code>quota.threshold_reached</code>, and <code>billing.subscription_renewed</code>.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Webhook Payload Endpoint (HTTPS only)
              </label>
              <input
                type="url"
                required
                value={accountWebhookUrl}
                onChange={(e) => setAccountWebhookUrl(e.target.value)}
                placeholder="https://yourserver.com/api/webhooks/astroengine"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                HMAC SHA-256 Signing Secret
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookSecret}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setWebhookSecret(`whsec_live_${Math.random().toString(36).substring(2, 12)}`)}
                  className="px-3 py-2 text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg whitespace-nowrap shadow-xs transition"
                >
                  Rotate Secret
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Verify the <code>x-astroengine-signature</code> HTTP header in your backend using this secret key.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={async () => {
              const res = await fetch("/api/user/me");
              const json = await res.json();
              if (json.data?.id) {
                await fetch("/api/notifications/dispatch", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId: json.data.id,
                    eventType: "LOW_BALANCE",
                    data: { balance: json.data.walletBalance }
                  })
                });
                alert(`Test alert dispatched to ${json.data.email}! Check your inbox or terminal console.`);
              }
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 transition"
          >
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>Send Test Alert Email</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? "Saving to Database..." : "Save Preferences"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
