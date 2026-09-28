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
  Check,
  Terminal,
  Cpu,
  FileText,
  Code2,
  Loader2
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

export default function HomeClient() {
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
    <div className="min-h-screen flex flex-col bg-surface text-ink font-brand selection:bg-accent-soft selection:text-accent">
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
      <section className="py-20 border-t border-line bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft border border-line text-accent text-xs font-semibold mb-3">
                <Cpu className="w-3.5 h-3.5" />
                <span>Architecture Overview</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                Built for high-throughput production
              </h2>
              <p className="text-ink-soft text-xs sm:text-sm mt-3 leading-relaxed">
                Engineered with clean architectural boundaries and complete typing across all 135 endpoints — nothing here is a mocked response.
              </p>
            </div>

            <div className="lg:col-span-8 divide-y divide-line border-t border-line lg:border-t-0">
              {[
                {
                  n: "01",
                  icon: Cpu,
                  title: "Deterministic calculations",
                  body: "Julian Day UTC conversions and planetary coordinates computed natively via Swiss Ephemeris C libraries, with Lahiri, Raman, and KP ayanamsa support.",
                },
                {
                  n: "02",
                  icon: FileText,
                  title: "Asynchronous white-label PDF",
                  body: "A background worker pipeline renders 12–60 page custom reports with embedded vector SVG charts, brand headers, and auto-expiring Cloudflare R2 delivery links.",
                },
                {
                  n: "03",
                  icon: Code2,
                  title: "Dual-key machine stability",
                  body: "Every response carries a stable English enum identifier alongside a localized human translation, across English, Hindi, Gujarati, Marathi, Tamil, and Telugu.",
                },
              ].map((item) => (
                <div key={item.n} className="flex items-start gap-4 py-6 first:pt-0 last:pb-0">
                  <span className="font-mono text-xs text-ink-muted pt-1 w-6 shrink-0">{item.n}</span>
                  <item.icon className="w-4 h-4 text-accent mt-1 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-ink mb-1">{item.title}</h3>
                    <p className="text-xs text-ink-soft leading-relaxed max-w-xl">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Pricing Section */}
      <section className="py-20 border-t border-line bg-surface-alt/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-lg mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft border border-line text-accent text-xs font-semibold mb-3">
              <Terminal className="w-3.5 h-3.5" />
              <span>Transparent Pricing</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              Predictable developer plans
            </h2>
            <p className="text-ink-soft text-xs sm:text-sm mt-2 leading-relaxed">
              Start prototyping with ₹100 free test credits. Overage is billed per call, not by surprise.
            </p>
          </div>

          {loadingPlans && plans.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-16 text-ink-muted text-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading plans...</span>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div
                key={p.tier}
                className={`rounded-2xl border flex flex-col justify-between relative overflow-hidden ${
                  p.isPopular
                    ? "bg-card border-accent shadow-md"
                    : "bg-card border-line shadow-xs"
                }`}
              >
                {p.isPopular && (
                  <div className="px-5 py-1.5 bg-accent text-accent-foreground font-bold text-[10px] uppercase tracking-wider">
                    Most teams pick this
                  </div>
                )}
                <div className="p-6 flex-1">
                  <div className="text-xs font-mono uppercase font-semibold text-ink-muted">{p.name}</div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono text-ink">₹{p.priceMonthly.toLocaleString()}</span>
                    <span className="text-xs text-ink-muted">/ mo</span>
                  </div>
                  <div className="text-[11px] text-ink-soft mt-1">
                    {p.includedQuota.toLocaleString()} calls included • ₹{p.overageCost.toFixed(2)} overage
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-ink-soft border-t border-line pt-6">
                    {p.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 pt-0">
                  <Link
                    href="/dashboard"
                    className={`block w-full py-2.5 text-center rounded-lg font-semibold text-xs transition ${
                      p.isPopular
                        ? "bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm"
                        : "bg-surface-alt hover:bg-line/60 text-ink border border-line"
                    }`}
                  >
                    {p.tier === "ENTERPRISE" ? "Contact Sales" : "Choose " + p.name}
                  </Link>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Modular Add-ons Showcase */}
          {addons.length > 0 && (
            <div className="mt-16 pt-14 border-t border-line">
              <div className="text-center max-w-lg mx-auto mb-10">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-accent-soft border border-line text-accent text-xs font-bold tracking-wider uppercase">
                  Modular power-ups
                </span>
                <h3 className="text-xl font-bold text-ink mt-3">
                  Standalone engine add-ons
                </h3>
                <p className="text-ink-soft text-xs mt-1.5 leading-relaxed">
                  Attach a specific engine directly to your Starter or Pro plan without purchasing full Enterprise.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {addons.map((addon) => (
                  <div
                    key={addon.id}
                    className="p-5 rounded-2xl border border-line bg-card shadow-xs flex flex-col justify-between hover:border-accent/50 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-ink">{addon.name}</h4>
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-surface-alt text-ink-muted border border-line">
                            {addon.category}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black font-mono text-ink">₹{addon.priceMonthly}</span>
                          <span className="text-[10px] text-ink-muted block">/ mo</span>
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-ink-soft leading-relaxed line-clamp-2">
                        {addon.description}
                      </p>

                      <div className="mt-2.5 py-1 px-2 rounded-lg bg-surface-alt border border-line text-[10px] font-mono text-ink-soft flex justify-between">
                        <span>Limit: <strong className="text-ink">{(addon.monthlyQuota || 1000).toLocaleString()} {addon.category === "REPORTS" ? "PDFs" : "calls"}</strong></span>
                        <span>Rate: <strong className="text-ink">{addon.rateLimitPerMin || 60} RPM</strong></span>
                      </div>

                      <div className="mt-3 space-y-1">
                        {(Array.isArray(addon.features) ? addon.features : []).slice(0, 3).map((feat: string, fIdx: number) => (
                          <div key={fIdx} className="flex items-center gap-1.5 text-[11px] text-ink-soft">
                            <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-line">
                      <Link
                        href="/billing#addons"
                        className="w-full py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
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
