"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Check, Zap, Sparkles, Loader2, Compass } from "lucide-react";
import type { Locale } from "@/lib/locale";

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

interface OfferItem {
  code: string;
  title: string;
  description?: string | null;
  scope: "GLOBAL" | "PERSONALIZED";
  targetType: "PLAN" | "ADDON";
  targetId?: string | null;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  maxDiscount?: number | null;
  minimumAmount: number;
  endsAt: string;
}

interface DisplayOffer extends OfferItem {
  discountAmount: number;
  finalAmount: number;
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

const STRINGS = {
  hi: {
    badge: "पारदर्शी मूल्य निर्धारण • Real-time Quota & Billing",
    headingPrefix: "डेवलपर एवं एंटरप्राइज",
    headingAccent: "सब्सक्रिप्शन प्लान्स",
    subtitle: "सभी प्लान्स में ₹100 फ्री टेस्ट क्रेडिट्स, स्विस एफिमेरिस C-कोर गति, और 6 भारतीय भाषाओं में द्वैत-कुंजी JSON सपोर्ट शामिल है।",
    loadingPlans: "प्लान्स लोड हो रहे हैं...",
    perMonth: "/ महीना",
    monthlyQuota: "मासिक कोटा:",
    calls: "कॉल्स",
    rateLimit: "रेट लिमिट:",
    overage: "अतिरिक्त कॉल (Overage):",
    perCall: "/ call",
    mostPopular: "सर्वाधिक लोकप्रिय",
    enterpriseContact: "एंटरप्राइज संपर्क करें",
    choosePlan: (name: string) => `${name} चुनें`,
    included: "शामिल सुविधाएं",
    addonsBadge: "मॉड्यूलर पावर-अप्स",
    addonsTitle: "स्टैंडअलोन इंजन",
    addonsTitleAccent: "ऐड-ऑन्स (Add-ons)",
    addonsSubtitle: "वेस्टर्न, लाल किताब या पीडीएफ रिपोर्ट जैसे विशिष्ट इंजन अलग से एक्टिवेट करें — पूरे एंटरप्राइज प्लान के बिना।",
    limit: "लिमिट:",
    pdfs: "PDFs",
    speed: "स्पीड:",
    activateInDashboard: "डैशबोर्ड में एक्टिवेट करें",
    offer: "एक बार का ऑफर",
    useCode: "कोड",
    save: "बचत",
  },
  en: {
    badge: "Transparent Pricing • Real-time Quota & Billing",
    headingPrefix: "Developer & Enterprise",
    headingAccent: "Subscription Plans",
    subtitle: "Every plan includes ₹100 free test credits, Swiss Ephemeris C-core speed, and dual-key JSON support across 6 Indian languages.",
    loadingPlans: "Loading plans...",
    perMonth: "/ month",
    monthlyQuota: "Monthly quota:",
    calls: "calls",
    rateLimit: "Rate limit:",
    overage: "Overage:",
    perCall: "/ call",
    mostPopular: "Most Popular",
    enterpriseContact: "Contact Enterprise",
    choosePlan: (name: string) => `Choose ${name}`,
    included: "What's included",
    addonsBadge: "Modular Power-ups",
    addonsTitle: "Standalone Engine",
    addonsTitleAccent: "Add-ons",
    addonsSubtitle: "Activate a specific engine like Western, Lal Kitab, or PDF Reports separately — without a full Enterprise plan.",
    limit: "Limit:",
    pdfs: "PDFs",
    speed: "Speed:",
    activateInDashboard: "Activate in Dashboard",
    offer: "One-time offer",
    useCode: "Code",
    save: "Save",
  },
} as const;

const formatInr = (value: number, showPaise = false) => value.toLocaleString("en-IN", {
  minimumFractionDigits: showPaise ? 2 : 0,
  maximumFractionDigits: 2,
});

export default function PricingClient({ locale }: { locale: Locale }) {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [addons, setAddons] = useState<AddonItem[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const t = STRINGS[locale];

  useEffect(() => {
    // Fetch live plans and addons dynamically from MySQL API
    Promise.allSettled([
      axios.get("/api/plans"),
      axios.get("/api/addons"),
      axios.get("/api/billing/offers"),
    ])
      .then(([plansResult, addonsResult, offersResult]) => {
        if (plansResult.status === "fulfilled" && plansResult.value.data?.data) {
          setPlans(plansResult.value.data.data);
        }
        if (addonsResult.status === "fulfilled" && addonsResult.value.data?.data) {
          setAddons(addonsResult.value.data.data);
        }
        if (offersResult.status === "fulfilled" && offersResult.value.data?.data) {
          setOffers(offersResult.value.data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const bestOffer = (targetType: "PLAN" | "ADDON", targetId: string, amount: number): DisplayOffer | null => {
    if (amount <= 0) return null;
    return offers.reduce<DisplayOffer | null>((best, offer) => {
      const targetMatches = offer.targetType === targetType;
      const idMatches = !offer.targetId || offer.targetId === targetId;
      if (!targetMatches || !idMatches || amount < Number(offer.minimumAmount || 0)) return best;

      let discountAmount = offer.discountType === "PERCENT"
        ? amount * (Number(offer.discountValue) / 100)
        : Number(offer.discountValue);
      if (offer.maxDiscount != null) discountAmount = Math.min(discountAmount, Number(offer.maxDiscount));
      discountAmount = Math.max(0, Math.min(amount, Math.round(discountAmount * 100) / 100));
      if (discountAmount <= 0) return best;
      const candidate = { ...offer, discountAmount, finalAmount: Math.round((amount - discountAmount) * 100) / 100 };
      return !best || candidate.finalAmount < best.finalAmount ? candidate : best;
    }, null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-ink">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 w-full flex-1">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-accent-soft border border-line text-xs font-semibold text-accent mb-4">
            <Compass className="w-3.5 h-3.5" />
            <span>{t.badge}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            {t.headingPrefix} <span className="font-display italic text-accent font-normal">{t.headingAccent}</span>
          </h1>
          <p className="text-ink-soft text-xs sm:text-sm mt-3 leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-ink-muted gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
            <span className="text-xs font-medium">{t.loadingPlans}</span>
          </div>
        ) : (
          <>
            {/* Core Subscription Plans — comparison table */}
            <div className="overflow-x-auto rounded-2xl border border-line bg-card shadow-xs">
              <table className="w-full min-w-[720px] text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-line">
                    <th className="w-1/4 px-5 py-5 align-bottom"></th>
                    {plans.map((p) => {
                      const offer = bestOffer("PLAN", p.tier, p.priceMonthly);
                      return (
                        <th
                          key={p.id || p.tier}
                          className={`px-5 py-5 align-bottom ${p.isPopular ? "border-x border-accent/30 bg-accent-soft" : ""}`}
                        >
                          {p.isPopular && (
                            <p className="text-[10px] font-bold uppercase tracking-wide text-accent mb-1">{t.mostPopular}</p>
                          )}
                          <p className="text-xs font-bold text-ink-soft uppercase tracking-wider">{p.name}</p>
                          {offer && (
                            <p className="mt-1 text-[10px] font-semibold text-emerald-700">{t.offer}: {offer.code} · {t.save} ₹{formatInr(offer.discountAmount, true)}</p>
                          )}
                          <div className="mt-1 flex items-baseline gap-1.5">
                            {offer && <span className="text-xs font-mono-brand text-ink-muted line-through">₹{formatInr(p.priceMonthly)}</span>}
                            <span className="font-display text-2xl font-medium text-ink">₹{formatInr(offer?.finalAmount ?? p.priceMonthly, Boolean(offer))}</span>
                            <span className="text-xs text-ink-muted font-brand">{t.perMonth}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ink-soft">
                  <tr>
                    <td className="px-5 py-3.5 text-ink-muted">{t.monthlyQuota}</td>
                    {plans.map((p) => (
                      <td key={p.id || p.tier} className={`px-5 py-3.5 font-mono-brand text-ink ${p.isPopular ? "border-x border-accent/30 bg-accent-soft/40" : ""}`}>
                        {p.includedQuota.toLocaleString()} {t.calls}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-5 py-3.5 text-ink-muted">{t.rateLimit}</td>
                    {plans.map((p) => (
                      <td key={p.id || p.tier} className={`px-5 py-3.5 font-mono-brand text-ink ${p.isPopular ? "border-x border-accent/30 bg-accent-soft/40" : ""}`}>
                        {p.rateLimitPerMin} req/min
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-5 py-3.5 text-ink-muted">{t.overage}</td>
                    {plans.map((p) => (
                      <td key={p.id || p.tier} className={`px-5 py-3.5 font-mono-brand text-ink ${p.isPopular ? "border-x border-accent/30 bg-accent-soft/40" : ""}`}>
                        ₹{p.overageCost.toFixed(2)} {t.perCall}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-5 py-4 align-top text-ink-muted">{t.included}</td>
                    {plans.map((p) => (
                      <td key={p.id || p.tier} className={`px-5 py-4 align-top ${p.isPopular ? "border-x border-accent/30 bg-accent-soft/40" : ""}`}>
                        <ul className="space-y-2">
                          {(Array.isArray(p.features) ? p.features : []).map((feat, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <Check className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-5 py-4"></td>
                    {plans.map((p) => {
                      const offer = bestOffer("PLAN", p.tier, p.priceMonthly);
                      return (
                        <td key={p.id || p.tier} className={`px-5 py-4 ${p.isPopular ? "border-x border-accent/30 bg-accent-soft/40" : ""}`}>
                          <Link
                            href={p.tier === "ENTERPRISE" && !offer ? "/dashboard" : `/billing?plan=${encodeURIComponent(p.tier)}${offer ? `&offer=${encodeURIComponent(offer.code)}` : ""}`}
                            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition ${
                              p.isPopular
                                ? "bg-accent hover:bg-accent-hover text-accent-foreground shadow-sm"
                                : "bg-surface-alt hover:bg-line text-ink border border-line"
                            }`}
                          >
                            <span>{p.tier === "ENTERPRISE" ? t.enterpriseContact : t.choosePlan(p.name)}</span>
                          </Link>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Modular Engine Add-ons Showcase */}
            {addons.length > 0 && (
              <div className="mt-20 pt-16 border-t border-line">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-line text-xs font-semibold text-accent mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t.addonsBadge}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                    {t.addonsTitle} <span className="font-display italic text-accent font-normal">{t.addonsTitleAccent}</span>
                  </h2>
                  <p className="text-ink-soft text-xs sm:text-sm mt-2">
                    {t.addonsSubtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {addons.map((addon) => {
                    const offer = bestOffer("ADDON", addon.id, addon.priceMonthly);
                    return (
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
                            {offer && <span className="block text-[10px] font-bold font-mono-brand text-ink-muted line-through">₹{formatInr(addon.priceMonthly)}</span>}
                            <span className="text-xl font-black font-mono-brand text-ink">₹{formatInr(offer?.finalAmount ?? addon.priceMonthly, Boolean(offer))}</span>
                            <span className="text-[10px] text-ink-muted block">{t.perMonth}</span>
                          </div>
                        </div>

                        {offer && (
                          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900">
                            <div>
                              <div className="text-[10px] font-extrabold uppercase">{t.offer}: {offer.title}</div>
                              <div className="text-[10px] text-emerald-700">{t.save} ₹{formatInr(offer.discountAmount, true)}</div>
                            </div>
                            <span className="rounded-md bg-white px-2 py-1 font-mono-brand text-[10px] font-bold">{offer.code}</span>
                          </div>
                        )}

                        <p className="mt-2.5 text-xs text-ink-soft leading-relaxed line-clamp-2">
                          {addon.description}
                        </p>

                        {/* Quota & Limits Badge */}
                        <div className="mt-3 py-2 px-3 rounded-xl bg-surface border border-line flex items-center justify-between text-[10px] font-mono-brand text-ink-soft">
                          <span>
                            {t.limit} <strong className="text-ink">{(addon.monthlyQuota || 1000).toLocaleString()} {addon.category === "REPORTS" ? t.pdfs : t.calls}</strong>
                          </span>
                          <span>
                            {t.speed} <strong className="text-ink">{addon.rateLimitPerMin || 60} RPM</strong>
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
                          href={`/billing?addon=${encodeURIComponent(addon.id)}${offer ? `&offer=${encodeURIComponent(offer.code)}` : ""}`}
                          className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                        >
                          <Zap className="w-3.5 h-3.5 text-accent-foreground/70" />
                          <span>{t.activateInDashboard}</span>
                        </Link>
                      </div>
                    </div>
                  )})}
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
