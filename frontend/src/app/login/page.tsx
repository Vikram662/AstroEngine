"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Lock, Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address first.");
      return;
    }

    setSendingOtp(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await axios.post("/api/auth/otp", { email });
      if (res.data?.status === "success") {
        setOtpSent(true);
        setSuccessMsg(`Verification code sent to ${email}. Check your inbox!`);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errorObj.response?.data?.message || errorObj.message || "Failed to send verification code.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If registering and OTP not yet sent, trigger OTP first
    if (isRegistering && !otpSent) {
      await handleSendOtp();
      return;
    }

    if (isRegistering && (!otp || otp.trim().length !== 6)) {
      setError("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    setLoading(true);

    try {
      const payload: { email: string; password: string; action: string; otp?: string } = {
        email,
        password,
        action: isRegistering ? "register" : "login"
      };

      if (isRegistering) {
        payload.otp = otp.trim();
      }

      const res = await axios.post("/api/auth/session", payload);

      if (res.data?.status === "success") {
        if (res.data?.role === "ADMIN" || res.data?.role === "SUPER_ADMIN") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/dashboard";
        }
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errorObj.response?.data?.message || errorObj.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (registerMode: boolean) => {
    setIsRegistering(registerMode);
    setError(null);
    setSuccessMsg(null);
    setOtpSent(false);
    setOtp("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-zinc-900">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs mb-3 font-mono">
              AE
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isRegistering ? "Create Developer Account" : "Sign in to AstroEngine"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isRegistering 
                ? "Verify your email with a 6-digit OTP to get ₹100 free test credits."
                : "Enter your account email and password to access the console."}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@company.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900"
                  required
                />
              </div>
            </div>

            {/* OTP Input Block (Shown during registration once OTP is requested) */}
            {isRegistering && otpSent && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Email Verification Code (OTP)
                  </label>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline disabled:opacity-50"
                  >
                    {sendingOtp ? "Resending..." : "Resend Code"}
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm tracking-widest font-mono text-slate-900 focus:outline-none focus:border-slate-900"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Please enter the 6 digits received at {email}. Valid for 10 minutes.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || sendingOtp}
              className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading || sendingOtp ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isRegistering && !otpSent ? (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>{isRegistering ? "Verify & Create Account" : "Sign In"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            {isRegistering ? (
              <div>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode(false)}
                  className="font-bold text-slate-900 hover:underline"
                >
                  Sign in
                </button>
              </div>
            ) : (
              <div>
                Need a developer account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode(true)}
                  className="font-bold text-slate-900 hover:underline"
                >
                  Sign up with Email OTP
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
