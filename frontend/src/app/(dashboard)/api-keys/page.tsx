"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Key, 
  Copy, 
  Check, 
  RotateCw, 
  ShieldAlert, 
  Clock, 
  AlertTriangle,
  Loader2
} from "lucide-react";

export default function ApiKeysPage() {
  const [apiKeyPrefix, setApiKeyPrefix] = useState("");
  const [apiKeyCreatedAt, setApiKeyCreatedAt] = useState<string | null>(null);
  const [apiKeyLastUsedAt, setApiKeyLastUsedAt] = useState<string | null>(null);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Fetch live user key prefix from /api/user/me
    axios.get("/api/user/me")
      .then(res => {
        if (res.data?.data?.apiKeyPrefix) {
          setApiKeyPrefix(res.data.data.apiKeyPrefix);
        }
        if (res.data?.data?.apiKeyCreatedAt) {
          setApiKeyCreatedAt(res.data.data.apiKeyCreatedAt);
        }
        if (res.data?.data?.apiKeyLastUsedAt) {
          setApiKeyLastUsedAt(res.data.data.apiKeyLastUsedAt);
        }
      })
      .catch(() => {});
  }, []);

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatRelativeTime = (iso: string | null) => {
    if (!iso) return "Never";
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Active now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleRegenerateKey = async () => {
    setIsGenerating(true);
    try {
      const res = await axios.post("/api/user/keys");
      if (res.data?.rawKey) {
        setNewRawKey(res.data.rawKey);
        setApiKeyPrefix(res.data.apiKeyPrefix);
        setApiKeyCreatedAt(new Date().toISOString());
        setApiKeyLastUsedAt(null);
      }
    } catch (err) {
      // Fallback
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">API Key Credentials</h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-1">
          Authenticate requests to all 135 AstroEngine endpoints via the <code className="bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded font-mono font-bold border border-slate-200">x-api-key</code> header.
        </p>
      </div>

      {/* Security Architecture Notice (§12.1) */}
      <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-sm">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-amber-950">Zero Plaintext Storage Standard:</span> We store only a cryptographic SHA-256 hash of your API key in the database. For your security, the raw secret token is displayed exactly once upon generation. Store it securely in your server environment variables.
        </div>
      </div>

      {/* New Key Alert Banner */}
      {newRawKey && (
        <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-300 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-emerald-700" /> Save Your New Secret API Key
          </div>
          <p className="text-xs text-emerald-800">
            Copy this secret token now. You will not be able to view it again once this window closes!
          </p>
          <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 shadow-inner">
            <span className="flex-1 select-all break-all">{newRawKey}</span>
            <button
              onClick={() => handleCopy(newRawKey)}
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-semibold transition flex items-center gap-1.5 flex-shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Key Box */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-slate-900">Active Production Key</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {apiKeyCreatedAt ? `Created on ${formatDate(apiKeyCreatedAt)}` : "Created date unavailable"} • Environment: Live Production
            </div>
          </div>
          <button
            onClick={handleRegenerateKey}
            disabled={isGenerating}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white flex items-center gap-2 transition disabled:opacity-50 shadow-sm"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCw className="w-3.5 h-3.5" />
            )}
            <span>Roll / Regenerate Key</span>
          </button>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center justify-between font-mono text-xs shadow-inner">
          <div className="flex items-center gap-2.5 text-slate-200">
            <Key className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-100">{apiKeyPrefix}</span>
            <span className="text-slate-500">••••••••••••••••••••••••••••••••</span>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded bg-emerald-900/40 text-emerald-400 border border-emerald-800 font-sans font-semibold">
            Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Last used: <strong className="text-slate-900">{formatRelativeTime(apiKeyLastUsedAt)}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-slate-400" />
            <span>Allowed Header: <code className="bg-slate-100 text-slate-900 px-1 py-0.5 rounded font-mono font-semibold border border-slate-200">x-api-key</code></span>
          </div>
        </div>
      </div>
    </div>
  );
}
