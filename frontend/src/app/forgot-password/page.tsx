"use client";

import React, { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Lock, Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const messageFrom = (err: unknown, fallback: string) => {
    const e = err as { response?: { data?: { message?: string } } };
    return e.response?.data?.message || fallback;
  };

  const requestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/reset", { email });
      setCodeSent(true);
      setInfo(res.data?.message || "If an account exists, a reset code has been sent.");
    } catch (err: unknown) {
      setError(messageFrom(err, "Could not send the reset code."));
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (otp.trim().length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setLoading(true);
    try {
      await axios.put("/api/auth/reset", { email, otp: otp.trim(), newPassword });
      setDone(true);
    } catch (err: unknown) {
      setError(messageFrom(err, "Could not reset the password."));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-surface-alt border border-line rounded-lg pl-9 pr-3 py-2.5 text-sm text-ink focus:outline-none focus:bg-card focus:border-accent";

  return (
    <div className="min-h-screen flex flex-col bg-surface text-ink">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card p-8 rounded-lg border border-line shadow-sm space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink">
              Reset <span className="font-display italic text-accent font-normal">password</span>
            </h1>
            <p className="text-sm text-ink-soft mt-1">
              {codeSent ? "Enter the code we emailed you and choose a new password." : "We will email you a 6-digit reset code."}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {info && !done && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{info}</span>
            </div>
          )}

          {done ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Your password has been updated.</span>
              </div>
              <Link href="/login" className="block text-center font-bold text-accent hover:underline text-sm">
                Back to sign in
              </Link>
            </div>
          ) : !codeSent ? (
            <form onSubmit={requestCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Send reset code</span><ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={submitReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1">Reset code</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className={`${inputClass} tracking-widest font-mono`}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1">New password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={8}
                    maxLength={128}
                    className={inputClass}
                    required
                  />
                </div>
                <p className="text-xs text-ink-muted mt-1">At least 8 characters.</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Update password</span><ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
              <button type="button" onClick={() => requestCode()} disabled={loading} className="w-full text-xs font-semibold text-accent hover:underline disabled:opacity-50">
                Resend code
              </button>
            </form>
          )}

          {!done && (
            <div className="text-center text-sm text-ink-muted pt-2 border-t border-line">
              <Link href="/login" className="font-bold text-accent hover:underline">
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
