"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Lock, Mail, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post("/api/auth/session", {
        email,
        password,
        action: isRegistering ? "register" : "login"
      });

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
                ? "Get ₹100 free test credits and instant API keys."
                : "Enter your account email and password to access the console."}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isRegistering ? "Create Free Account" : "Sign In"}</span>
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
                  onClick={() => setIsRegistering(false)}
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
                  onClick={() => setIsRegistering(true)}
                  className="font-bold text-slate-900 hover:underline"
                >
                  Sign up for free
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
