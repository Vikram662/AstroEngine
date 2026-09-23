"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LivePlayground } from "@/components/LivePlayground";
import { HeroSection } from "@/components/HeroSection";
import { CalculatorsSection } from "@/components/CalculatorsSection";
import { PanchangWidget } from "@/components/PanchangWidget";
import { HoroscopeSection } from "@/components/HoroscopeSection";
import { 
  Download, 
  ArrowRight, 
  Check, 
  Terminal, 
  Cpu, 
  FileText, 
  Code2,
  Loader2,
  Sparkles
} from "lucide-react";

interface PlanItem {
  tier: string;
  name: string;
  priceMonthly: number;
  includedQuota: number;
  rateLimitPerMin: number;
  overageCost: number;
  features: string[];
  isPopular: boolean;
}

export default function HomePage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<Record<string, string>>({});

  useEffect(() => {
    // Dynamic query from MySQL via /api/plans, /api/user/addons and /api/settings/public
    Promise.all([
      axios.get("/api/plans"),
      axios.get("/api/user/addons"),
      axios.get("/api/settings/public")
    ])
      .then(([plansRes, addonsRes, settingsRes]) => {
        if (plansRes.data?.data) {
          setPlans(plansRes.data.data);
        }
        if (addonsRes.data?.catalog) {
          setAddons(addonsRes.data.catalog);
        }
        if (settingsRes.data?.data) {
          setCompanyInfo(settingsRes.data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPlans(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-zinc-900 selection:bg-zinc-200 selection:text-zinc-900">
      <Navbar />

      {/* Consumer Vedic Hero Section (Phase 3) */}
      <HeroSection />

      {/* Free 24 Vedic Calculators Grid (Phase 4) */}
      <CalculatorsSection />

      {/* Today's Panchang & Muhurat Widget (Phase 5) */}
      <PanchangWidget />

      {/* 12 Zodiac Rashis Horoscope Section (Phase 6) */}
      <HoroscopeSection />

      {/* Live Interactive Playground Section */}
      <LivePlayground />

      {/* Architecture Pillars */}
      <section className="py-20 border-t border-zinc-200 bg-[#fafafa]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl mb-12">
            <span className="text-xs font-mono uppercase text-zinc-500 font-semibold tracking-wider">
              Architecture Overview
            </span>
            <h2 className="text-2xl font-bold text-zinc-900 mt-1">
              Built for High-Throughput Production
            </h2>
            <p className="text-zinc-600 text-xs sm:text-sm mt-1">
              Engineered with clean architectural boundaries and complete typing across all endpoints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-zinc-200 bg-white shadow-xs">
              <Cpu className="w-5 h-5 text-zinc-800 mb-3" />
              <h3 className="text-sm font-bold text-zinc-900 mb-1.5">Deterministic Calculations</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Julian Day UTC conversions and mathematical planetary coordinates computed natively via Swiss Ephemeris C libraries with Lahiri, Raman, and KP ayanamsa support.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-zinc-200 bg-white shadow-xs">
              <FileText className="w-5 h-5 text-zinc-800 mb-3" />
              <h3 className="text-sm font-bold text-zinc-900 mb-1.5">Asynchronous White-Label PDF</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Background worker pipeline rendering 20–100 page custom reports with embedded vector SVG charts, brand headers, and auto-expiring Cloudflare R2 delivery links.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-zinc-200 bg-white shadow-xs">
              <Code2 className="w-5 h-5 text-zinc-800 mb-3" />
              <h3 className="text-sm font-bold text-zinc-900 mb-1.5">Dual-Key Machine Stability</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Every calculation response provides stable English enumeration identifiers alongside localized human translations for English, Hindi, Gujarati, Marathi, Tamil, and Telugu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Pricing Section */}
      <section className="py-20 border-t border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-lg mx-auto mb-14">
            <span className="text-xs font-mono uppercase text-zinc-500 font-semibold tracking-wider">
              Transparent Pricing
            </span>
            <h2 className="text-2xl font-bold text-zinc-900 mt-1">
              Predictable Developer Plans
            </h2>
            <p className="text-zinc-600 text-xs sm:text-sm mt-1">
              Start prototyping with ₹100 free test credits. Scale seamlessly as your platform grows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div 
                key={p.tier} 
                className={`p-6 rounded-xl border flex flex-col justify-between relative shadow-xs ${
                  p.isPopular 
                    ? "bg-white border-2 border-zinc-900 shadow-md ring-1 ring-zinc-900" 
                    : "bg-white border-zinc-200"
                }`}
              >
                {p.isPopular && (
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded bg-zinc-900 text-white font-mono text-[10px] font-medium uppercase">
                    Recommended
                  </div>
                )}
                <div>
                  <div className="text-xs font-mono uppercase font-semibold text-zinc-500">{p.name}</div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono text-zinc-900">₹{p.priceMonthly.toLocaleString()}</span>
                    <span className="text-xs text-zinc-500">/ mo</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    {p.includedQuota.toLocaleString()} calls included • ₹{p.overageCost.toFixed(2)} overage
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-zinc-700 border-t border-zinc-100 pt-6">
                    {p.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-zinc-900 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/dashboard"
                  className={`mt-8 w-full py-2 text-center rounded-md font-medium text-xs transition ${
                    p.isPopular
                      ? "bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
                      : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                  }`}
                >
                  {p.tier === "ENTERPRISE" ? "Contact Sales" : "Choose " + p.name}
                </Link>
              </div>
            ))}
          </div>

          {/* Modular Add-ons Showcase */}
          {addons.length > 0 && (
            <div className="mt-16 pt-14 border-t border-zinc-200">
              <div className="text-center max-w-lg mx-auto mb-10">
                <span className="text-xs font-mono uppercase text-purple-700 font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200">
                  Modular Power-Ups
                </span>
                <h3 className="text-xl font-bold text-zinc-900 mt-2">
                  Standalone Engine Add-ons
                </h3>
                <p className="text-zinc-600 text-xs mt-1">
                  Attach specific engines directly to your Starter or Pro plan without purchasing full Enterprise.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {addons.map((addon) => (
                  <div
                    key={addon.id}
                    className="p-5 rounded-xl border border-zinc-200 bg-white shadow-xs flex flex-col justify-between hover:border-zinc-300 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-zinc-900">{addon.name}</h4>
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-zinc-100 text-zinc-600 border border-zinc-200">
                            {addon.category}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black font-mono text-zinc-900">₹{addon.priceMonthly}</span>
                          <span className="text-[10px] text-zinc-400 block">/ mo</span>
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-zinc-600 leading-relaxed line-clamp-2">
                        {addon.description}
                      </p>

                      <div className="mt-2.5 py-1 px-2 rounded bg-zinc-50 border border-zinc-100 text-[10px] font-mono text-zinc-600 flex justify-between">
                        <span>Limit: <strong className="text-zinc-900">{(addon.monthlyQuota || 1000).toLocaleString()} {addon.category === "REPORTS" ? "PDFs" : "calls"}</strong></span>
                        <span>Rate: <strong className="text-zinc-900">{addon.rateLimitPerMin || 60} RPM</strong></span>
                      </div>

                      <div className="mt-3 space-y-1">
                        {(Array.isArray(addon.features) ? addon.features : []).slice(0, 3).map((feat: string, fIdx: number) => (
                          <div key={fIdx} className="flex items-center gap-1.5 text-[11px] text-zinc-700">
                            <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-100">
                      <Link
                        href="/billing#addons"
                        className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                      >
                        <span>Activate in Dashboard</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Dedicated Global Dynamic Footer */}
      <Footer />
    </div>
  );
}
