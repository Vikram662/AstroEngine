"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Check, Zap, Sparkles, Layers, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

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

export interface AddonItem {
  id: string;
  name: string;
  category: string;
  priceMonthly: number;
  monthlyQuota: number;
  rateLimitPerMin: number;
  overageCost: number;
  description: string;
  features: string[];
  icon: string;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [addons, setAddons] = useState<AddonItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch live plans and addons dynamically from MySQL API
    Promise.all([
      axios.get("/api/plans"),
      axios.get("/api/user/addons")
    ])
      .then(([plansRes, addonsRes]) => {
        if (plansRes.data?.data) {
          setPlans(plansRes.data.data);
        }
        if (addonsRes.data?.catalog) {
          setAddons(addonsRes.data.catalog);
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
          <>
            {/* Core Subscription Plans Grid */}
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

            {/* Modular Engine Add-ons Showcase (Model 3) */}
            {addons.length > 0 && (
              <div className="mt-20 pt-16 border-t border-zinc-200">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-xs font-mono text-purple-800 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Modular Power-Ups</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                    Standalone Engine Add-ons
                  </h2>
                  <p className="text-zinc-600 text-xs sm:text-sm mt-2">
                    Need only specific engines like Western, Lal Kitab, or PDF Reports? Attach them as individual add-ons to your Starter or Pro plan without purchasing full Enterprise.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {addons.map((addon) => (
                    <div
                      key={addon.id}
                      className="p-5 rounded-xl border border-zinc-200 bg-white shadow-xs flex flex-col justify-between hover:border-zinc-300 hover:shadow-sm transition"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-sm text-zinc-900">{addon.name}</h3>
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
                              {addon.category}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-black font-mono text-zinc-900">₹{addon.priceMonthly}</span>
                            <span className="text-[10px] text-zinc-400 block">/ month</span>
                          </div>
                        </div>

                        <p className="mt-2.5 text-xs text-zinc-600 leading-relaxed line-clamp-2">
                          {addon.description}
                        </p>

                        {/* Quota & Limits Badge */}
                        <div className="mt-3 py-1.5 px-2.5 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-between text-[10px] font-mono text-zinc-600">
                          <span>
                            Limit: <strong className="text-zinc-900">{(addon.monthlyQuota || 1000).toLocaleString()} {addon.category === "REPORTS" ? "PDFs" : "calls"}</strong>
                          </span>
                          <span>
                            Speed: <strong className="text-zinc-900">{addon.rateLimitPerMin || 60} RPM</strong>
                          </span>
                        </div>

                        <div className="mt-3 space-y-1.5">
                          {(Array.isArray(addon.features) ? addon.features : []).map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-center gap-1.5 text-[11px] text-zinc-700">
                              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-zinc-100">
                        <Link
                          href="/billing#addons"
                          className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>Activate in Dashboard</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
