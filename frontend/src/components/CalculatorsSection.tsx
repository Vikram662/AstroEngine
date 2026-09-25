"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CALCULATOR_TOOLS } from "@/data/calculatorsData";
import { useLocale } from "@/hooks/useLocale";
import { getDictionary } from "@/dictionaries/dictionary";
import { isMigratedPath } from "@/lib/locale";
import { 
  Sparkles, 
  ArrowUpRight, 
  Search, 
  ChevronRight,
  Compass
} from "lucide-react";

export const CalculatorsSection: React.FC = () => {
  const locale = useLocale();
  const dict = getDictionary(locale);
  const t = dict.calculators;

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = locale === "en" ? [
    { id: "all", label: "All 24 Tools" },
    { id: "kundli", label: "Kundli & Planets" },
    { id: "dosha", label: "Dosha & Transit" },
    { id: "matching", label: "Matchmaking" },
    { id: "dasha", label: "Dasha & Timelines" },
    { id: "panchang", label: "Panchang & Muhurat" },
    { id: "numerology", label: "Numerology" },
    { id: "remedies", label: "Remedies & Lal Kitab" },
    { id: "advanced", label: "Special Yogas" },
  ] : [
    { id: "all", label: "सभी 24 कैलकुलेटर" },
    { id: "kundli", label: "कुंडली एवं ग्रह" },
    { id: "dosha", label: "दोष एवं गोचर" },
    { id: "matching", label: "कुंडली मिलान" },
    { id: "dasha", label: "दशा एवं काल" },
    { id: "panchang", label: "पंचांग व मुहूर्त" },
    { id: "numerology", label: "अंकशास्त्र" },
    { id: "remedies", label: "उपाय एवं लाल किताब" },
    { id: "advanced", label: "विशेष योग" },
  ];

  const filteredTools = CALCULATOR_TOOLS.filter(tool => {
    const matchesCategory = activeCategory === "all" || tool.category === activeCategory;
    const matchesSearch = 
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.hindiTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getToolHref = (href: string) => {
    if (locale === "hi" && isMigratedPath(href)) {
      return `/hi${href}`;
    }
    return href;
  };

  return (
    <section id="calculators" className="py-16 sm:py-20 bg-surface border-b border-line scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-line">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft border border-line text-accent text-xs font-semibold mb-3">
              <Compass className="w-3.5 h-3.5" />
              <span>{t.sectionBadge}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">
              {t.sectionTitle}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-ink-soft max-w-2xl leading-relaxed">
              {t.sectionSubtitle}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-line bg-card text-ink text-xs focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-accent text-white shadow-xs"
                  : "bg-card border border-line text-ink-soft hover:bg-surface-alt hover:text-ink"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 24-Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredTools.map(tool => (
            <Link
              key={tool.id}
              href={getToolHref(tool.href)}
              className="group relative bg-card rounded-2xl p-5 border border-line hover:border-accent/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Card Top: Icon, Badge & Arrow */}
                <div className="flex items-start justify-between gap-2 mb-3.5">
                  <div className="w-11 h-11 rounded-xl bg-accent-soft border border-line/80 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                    {tool.icon}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {tool.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        {tool.badge}
                      </span>
                    )}
                    <span className="p-1 rounded-lg text-ink-muted group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                {/* Card Titles: Clean single language */}
                <h3 className="font-bold text-sm sm:text-base text-ink group-hover:text-accent transition-colors leading-snug">
                  {locale === "en" ? tool.title : tool.hindiTitle}
                </h3>

                {/* Description */}
                <p className="mt-2.5 text-xs text-ink-soft leading-relaxed line-clamp-2">
                  {tool.description}
                </p>
              </div>

              {/* Card Footer CTA */}
              <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-[11px] font-semibold text-accent group-hover:text-accent-hover transition-colors">
                <span>{t.calculateCta}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* Empty state when search produces no results */}
        {filteredTools.length === 0 && (
          <div className="text-center py-16 bg-card rounded-2xl border border-line">
            <p className="text-sm font-semibold text-ink">{t.notFound}</p>
            <p className="text-xs text-ink-muted mt-1">{t.notFoundDesc}</p>
            <button
              onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
              className="mt-4 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold"
            >
              {t.viewAll}
            </button>
          </div>
        )}

        {/* Bottom Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-surface-alt border border-line flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-ink">{t.bottomBannerTitle}</h4>
              <p className="text-xs text-ink-soft">{t.bottomBannerSubtitle}</p>
            </div>
          </div>
          <Link
            href={locale === "hi" ? "/hi/calculators/lagna-kundli" : "/calculators/lagna-kundli"}
            className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs transition flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            <span>{locale === "en" ? "Start with your birth chart" : "अपनी जन्म कुंडली से शुरू करें"}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
};
