"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { Navbar } from "@/components/Navbar";
import { LivePlayground } from "@/components/LivePlayground";
import { 
  Download, 
  ArrowRight, 
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

export default function HomePage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    // Dynamic query from MySQL via /api/plans
    axios.get("/api/plans")
      .then(res => {
        if (res.data?.data) {
          setPlans(res.data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPlans(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-zinc-900 selection:bg-zinc-200 selection:text-zinc-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-24 border-b border-zinc-200 bg-white clean-grid">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-700 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>Swiss Ephemeris Native C Core • 117 Production APIs</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 max-w-3xl mx-auto leading-tight">
            Deterministic, Sub-50ms Vedic Astrology API
          </h1>

          <p className="mt-5 text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            High-precision planetary math, 120-year Vimshottari dasha trees, and white-label PDF generation for modern engineering teams.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/#playground"
              className="px-4 py-2.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition flex items-center gap-2 shadow-sm"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Try Live Playground</span>
            </Link>
            
            <a
              href="https://cdn.astroengine.io/sample_brihat_kundli.pdf"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-md bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 font-medium text-xs transition flex items-center gap-2 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span>Download Sample 80-Page Kundli (PDF)</span>
            </a>

            <Link
              href="/docs"
              className="px-4 py-2.5 rounded-md text-zinc-600 hover:text-zinc-900 text-xs font-medium transition"
            >
              API Reference →
            </Link>
          </div>

          {/* Precision Metrics Bar */}
          <div className="mt-14 pt-8 border-t border-zinc-100 grid grid-cols-2 sm:grid-cols-4 gap-6 text-left max-w-3xl mx-auto">
            <div>
              <div className="text-2xl font-bold font-mono text-zinc-900">&lt; 15 ms</div>
              <div className="text-xs text-zinc-500 mt-0.5">Average P95 Latency</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-zinc-900">117</div>
              <div className="text-xs text-zinc-500 mt-0.5">Production Endpoints</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-zinc-900">6 Languages</div>
              <div className="text-xs text-zinc-500 mt-0.5">Dual-Key i18n JSON</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-zinc-900">100% C-Core</div>
              <div className="text-xs text-zinc-500 mt-0.5">Swiss Ephemeris Precision</div>
            </div>
          </div>

        </div>
      </section>

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
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-10 bg-white text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © 2026 AstroEngine Inc. High-Precision Swiss Ephemeris Astrological Engine.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/docs" className="hover:text-zinc-800 transition">API Documentation</Link>
            <Link href="/#playground" className="hover:text-zinc-800 transition">Playground</Link>
            <Link href="/dashboard" className="hover:text-zinc-800 transition">Console</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
