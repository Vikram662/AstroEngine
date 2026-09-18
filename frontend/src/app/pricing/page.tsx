"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { Navbar } from "@/components/Navbar";
import { Check, Zap, Sparkles, Loader2 } from "lucide-react";

interface PlanItem {
  id: string;
  tier: string;
  name: string;
  priceMonthly: number;
  includedQuota: number;
  rateLimitPerMin: number;
  overageCost: number;
  features: string[];
  isPopular: boolean;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch live plans dynamically from API / Database
    axios.get("/api/plans")
      .then(res => {
        if (res.data?.data) {
          setPlans(res.data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-zinc-900">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 w-full flex-1">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-700 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>Real-time Dynamic Quota & Billing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
            Predictable Developer & Enterprise Plans
          </h1>
          <p className="text-zinc-600 text-xs sm:text-sm mt-2">
            All plans include ₹100 free test credits, Swiss Ephemeris C-core calculation speeds, and multi-lingual i18n support.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-zinc-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-mono">Loading Dynamic Plans from Database...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div
                key={p.id || p.tier}
                className={`p-6 rounded-xl border flex flex-col justify-between relative transition shadow-xs ${
                  p.isPopular
                    ? "bg-white border-2 border-zinc-900 shadow-md ring-1 ring-zinc-900"
                    : "bg-white border-zinc-200"
                }`}
              >
                {p.isPopular && (
                  <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded bg-zinc-900 text-white font-mono text-[10px] font-bold uppercase">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">{p.name}</div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold font-mono text-zinc-900">₹{p.priceMonthly.toLocaleString()}</span>
                    <span className="text-xs text-zinc-500">/ month</span>
                  </div>

                  <div className="mt-3 py-3 border-y border-zinc-100 text-[11px] text-zinc-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Monthly Quota:</span>
                      <strong className="text-zinc-900 font-mono">{p.includedQuota.toLocaleString()} calls</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate Limit:</span>
                      <strong className="text-zinc-900 font-mono">{p.rateLimitPerMin} req / min</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Overage:</span>
                      <strong className="text-zinc-900 font-mono">₹{p.overageCost.toFixed(2)} / call</strong>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-zinc-700">
                    {(Array.isArray(p.features) ? p.features : []).map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-zinc-900 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-100">
                  <Link
                    href="/dashboard"
                    className={`w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      p.isPopular
                        ? "bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                    }`}
                  >
                    <span>{p.tier === "ENTERPRISE" ? "Contact Enterprise Sales" : "Choose " + p.name}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
