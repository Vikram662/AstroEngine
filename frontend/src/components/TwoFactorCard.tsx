"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { ShieldCheck, ShieldOff, Copy, Loader2 } from "lucide-react";

type Phase = "loading" | "off" | "setup" | "on";

export function TwoFactorCard() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    axios
      .get("/api/user/2fa")
      .then((res) => setPhase(res.data?.enabled ? "on" : "off"))
      .catch(() => setPhase("off"));
  }, []);

  const call = async (body: object, onOk: (data: Record<string, string>) => void) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await axios.post("/api/user/2fa", body);
      onOk(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({ text: e.response?.data?.message || "Request failed.", ok: false });
    } finally {
      setBusy(false);
    }
  };

  const startSetup = () =>
    call({ action: "setup" }, (d) => {
      setSecret(d.secret);
      setUri(d.uri);
      setCode("");
      setPhase("setup");
    });

  const enable = (e: React.FormEvent) => {
    e.preventDefault();
    call({ action: "enable", code }, (d) => {
      setPhase("on");
      setCode("");
      setSecret("");
      setMsg({ text: d.message || "Two-factor authentication enabled.", ok: true });
    });
  };

  const disable = (e: React.FormEvent) => {
    e.preventDefault();
    call({ action: "disable", code, password }, (d) => {
      setPhase("off");
      setCode("");
      setPassword("");
      setMsg({ text: d.message || "Two-factor authentication disabled.", ok: true });
    });
  };

  const input = "w-full px-3 py-2 text-xs border border-line rounded-lg focus:outline-hidden";

  return (
    <div className="bg-white rounded-md border border-line shadow-xs p-6 space-y-4">
      <div className="flex items-center gap-2">
        {phase === "on" ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <ShieldOff className="w-4 h-4 text-ink-muted" />}
        <h2 className="text-sm font-bold text-ink">Two-factor authentication</h2>
        {phase === "on" && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Enabled
          </span>
        )}
      </div>
      <p className="text-xs text-ink-soft">
        Protect your account with a 6-digit code from an authenticator app (Google Authenticator, Authy, 1Password).
        Strongly recommended for admin accounts.
      </p>

      {msg && (
        <div className={`text-xs font-semibold ${msg.ok ? "text-emerald-700" : "text-rose-700"}`}>{msg.text}</div>
      )}

      {phase === "loading" && <Loader2 className="w-4 h-4 animate-spin text-ink-muted" />}

      {phase === "off" && (
        <button
          type="button"
          onClick={startSetup}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-console hover:bg-console-line text-white text-xs font-semibold disabled:opacity-50"
        >
          {busy ? "Preparing..." : "Enable two-factor authentication"}
        </button>
      )}

      {phase === "setup" && (
        <form onSubmit={enable} className="space-y-3">
          <p className="text-xs text-ink-soft">
            1. In your authenticator app choose <strong>Add account → Enter a setup key</strong> and type this key
            (or open the link on your phone):
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 text-xs font-mono bg-surface-alt border border-line rounded-lg break-all select-all">
              {secret}
            </code>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(secret)}
              className="p-2 border border-line rounded-lg hover:bg-surface-alt"
              aria-label="Copy setup key"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <a href={uri} className="text-xs font-semibold text-accent hover:underline">
            Open in authenticator app
          </a>
          <p className="text-xs text-ink-soft">2. Enter the 6-digit code it shows to confirm:</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className={`${input} font-mono tracking-widest max-w-[160px]`}
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="px-4 py-2 rounded-lg bg-console hover:bg-console-line text-white text-xs font-semibold disabled:opacity-50"
            >
              {busy ? "Verifying..." : "Verify & enable"}
            </button>
            <button type="button" onClick={() => setPhase("off")} className="px-4 py-2 rounded-lg border border-line text-xs font-semibold">
              Cancel
            </button>
          </div>
        </form>
      )}

      {phase === "on" && (
        <form onSubmit={disable} className="space-y-3">
          <p className="text-xs text-ink-soft">To turn it off, confirm with your password and a current code.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Current password"
              className={input}
              required
            />
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="6-digit code"
              className={`${input} font-mono tracking-widest`}
              required
            />
          </div>
          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="px-4 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold disabled:opacity-50"
          >
            {busy ? "Disabling..." : "Disable two-factor authentication"}
          </button>
        </form>
      )}
    </div>
  );
}
