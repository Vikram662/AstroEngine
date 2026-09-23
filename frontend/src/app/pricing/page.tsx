"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Check, Zap, Sparkles, ShieldCheck, ArrowRight, Loader2, Compass } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-surface text-ink">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 w-full flex-1">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-accent-soft border border-line text-xs font-semibold text-accent mb-4">
            <Compass className="w-3.5 h-3.5" />
            <span>पारदर्शी मूल्य निर्धारण • Real-time Quota & Billing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">
            डेवलपर एवं एंटरप्राइज <span className="font-display italic text-accent font-normal">सब्सक्रिप्शन प्लान्स</span>
          </h1>
          <p className="text-ink-soft text-xs sm:text-sm mt-3 leading-relaxed">
            सभी प्लान्स में ₹100 फ्री टेस्ट क्रेडिट्स, स्विस एफिमेरिस C-कोर गति, और 6 भारतीय भाषाओं में द्वैत-कुंजी JSON सपोर्ट शामिल है।
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-ink-muted gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
            <span className="text-xs font-medium">प्लान्स लोड हो रहे हैं...</span>
          </div>
        ) : (
          <>
            {/* Core Subscription Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((p) => (
                <div
                  key={p.id || p.tier}
                  className={`p-6 sm:p-7 rounded-2xl border flex flex-col justify-between relative transition shadow-xs ${
                    p.isPopular
                      ? "bg-card border-2 border-accent shadow-md ring-2 ring-accent/20"
                      : "bg-card border-line hover:border-accent/40"
                  }`}
                >
                  {p.isPopular && (
                    <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                      सर्वाधिक लोकप्रिय (Recommended)
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-bold text-accent uppercase tracking-wider">{p.name}</div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black font-mono text-ink">₹{p.priceMonthly.toLocaleString()}</span>
                      <span className="text-xs text-ink-muted">/ महीना</span>
                    </div>

                    <div className="mt-4 py-3 border-y border-line text-[11px] text-ink-soft space-y-1.5">
                      <div className="flex justify-between">
                        <span>मासिक कोटा:</span>
                        <strong className="text-ink font-mono">{p.includedQuota.toLocaleString()} कॉल्स</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>रेट लिमिट:</span>
                        <strong className="text-ink font-mono">{p.rateLimitPerMin} req / min</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>अतिरिक्त कॉल (Overage):</span>
                        <strong className="text-ink font-mono">₹{p.overageCost.toFixed(2)} / call</strong>
                      </div>
                    </div>

                    <ul className="mt-6 space-y-2.5 text-xs text-ink-soft">
                      {(Array.isArray(p.features) ? p.features : []).map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-6 border-t border-line">
                    <Link
                      href="/dashboard"
                      className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                        p.isPopular
                          ? "bg-accent hover:bg-accent-hover text-white shadow-md shadow-accent/20"
                          : "bg-surface-alt hover:bg-line text-ink"
                      }`}
                    >
                      <span>{p.tier === "ENTERPRISE" ? "एंटरप्राइज संपर्क करें" : `${p.name} चुनें`}</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Modular Engine Add-ons Showcase */}
            {addons.length > 0 && (
              <div className="mt-20 pt-16 border-t border-line">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-line text-xs font-semibold text-accent mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>मॉड्यूलर पावर-अप्स</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                    स्टैंडअलोन इंजन ऐड-ऑन्स <span className="font-display italic text-accent font-normal">(Add-ons)</span>
                  </h2>
                  <p className="text-ink-soft text-xs sm:text-sm mt-2">
                    वेस्टर्न, लाल किताब या पीडीएफ रिपोर्ट जैसे विशिष्ट इंजन अलग से एक्टिवेट करें — पूरे एंटरप्राइज प्लान के बिना।
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {addons.map((addon) => (
                    <div
                      key={addon.id}
                      className="p-5 rounded-2xl border border-line bg-card shadow-xs flex flex-col justify-between hover:border-accent/40 hover:shadow-md transition"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-sm text-ink">{addon.name}</h3>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-surface-alt text-ink-soft border border-line">
                              {addon.category}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-black font-mono text-ink">₹{addon.priceMonthly}</span>
                            <span className="text-[10px] text-ink-muted block">/ महीना</span>
                          </div>
                        </div>

                        <p className="mt-2.5 text-xs text-ink-soft leading-relaxed line-clamp-2">
                          {addon.description}
                        </p>

                        {/* Quota & Limits Badge */}
                        <div className="mt-3 py-2 px-3 rounded-xl bg-surface border border-line flex items-center justify-between text-[10px] font-mono text-ink-soft">
                          <span>
                            लिमिट: <strong className="text-ink">{(addon.monthlyQuota || 1000).toLocaleString()} {addon.category === "REPORTS" ? "PDFs" : "कॉल्स"}</strong>
                          </span>
                          <span>
                            स्पीड: <strong className="text-ink">{addon.rateLimitPerMin || 60} RPM</strong>
                          </span>
                        </div>

                        <div className="mt-3.5 space-y-1.5">
                          {(Array.isArray(addon.features) ? addon.features : []).map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-center gap-1.5 text-[11px] text-ink-soft">
                              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-line">
                        <Link
                          href="/billing#addons"
                          className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-200" />
                          <span>डैशबोर्ड में एक्टिवेट करें</span>
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
