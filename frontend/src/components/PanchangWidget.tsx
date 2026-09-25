"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { 
  Sun, 
  Moon, 
  Clock, 
  Calendar, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  ExternalLink,
  Loader2,
  Sparkles,
  MapPin,
  Compass
} from "lucide-react";

import { useLocale } from "@/hooks/useLocale";
import { getDictionary } from "@/dictionaries/dictionary";

function formatHM(hms?: string): string {
  if (!hms) return "--:--";
  const [h, m] = hms.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m} ${suffix}`;
}

export const PanchangWidget: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"muhurat" | "choghadiya">("muhurat");
  const locale = useLocale();
  const dict = getDictionary(locale);
  const t = dict.panchang;

  useEffect(() => {
    axios.get("/api/panchang/today")
      .then(res => {
        if (res.data?.status === "success") {
          setData(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const todayDateStr = new Date().toLocaleDateString(locale === "en" ? "en-US" : "hi-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <section id="panchang" className="py-16 sm:py-20 bg-surface-alt/50 border-b border-line scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-line">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft border border-line text-accent text-xs font-semibold mb-3">
              <Sun className="w-3.5 h-3.5 text-accent animate-spin-slow" />
              <span>{t.badge}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">
              {t.title}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-ink-soft max-w-2xl leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-ink-soft bg-card px-3.5 py-2 rounded-xl border border-line shrink-0">
            <Calendar className="w-4 h-4 text-accent" />
            <span className="font-medium text-ink">{todayDateStr}</span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center bg-card rounded-3xl border border-line">
            <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
            <p className="text-sm font-semibold text-ink">{t.loading}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ── LEFT: 5 Core Panchang Limbs (Pancha-Anga) (7 cols) ── */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Sun & Moon Timings Card */}
              <div className="bg-card rounded-2xl p-5 border border-line shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-muted uppercase block font-semibold">{t.sunrise}</span>
                    <span className="text-xs sm:text-sm font-bold text-ink">
                      {data?.sun_moon?.sunrise || "06:11 AM"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700 shrink-0">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-muted uppercase block font-semibold">{t.sunset}</span>
                    <span className="text-xs sm:text-sm font-bold text-ink">
                      {data?.sun_moon?.sunset || "06:17 PM"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-muted uppercase block font-semibold">{t.moonrise}</span>
                    <span className="text-xs sm:text-sm font-bold text-ink">
                      {data?.sun_moon?.moonrise || "03:45 PM"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <MapPin className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-muted uppercase block font-semibold">{t.location}</span>
                    <span className="text-xs font-bold text-ink truncate block">
                      {t.delhiLocation}
                    </span>
                  </div>
                </div>
              </div>

              {/* The 5 Limbs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Tithi */}
                <div className="bg-card rounded-2xl p-5 border border-line shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent block mb-1">
                    {t.tithiTitle}
                  </span>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-bold text-ink">
                      {data?.tithi?.name || (locale === "en" ? "Dwadashi" : "द्वादशी")}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-alt text-ink-soft">
                      {data?.tithi?.paksha || (locale === "en" ? "Shukla Paksha" : "शुक्ल पक्ष")}
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-muted">
                    <span>{t.endTime}:</span>
                    <span className="font-semibold text-ink">{data?.tithi?.end_time || "11:24 PM"}</span>
                  </div>
                </div>

                {/* Nakshatra */}
                <div className="bg-card rounded-2xl p-5 border border-line shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent block mb-1">
                    {t.nakshatraTitle}
                  </span>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-bold text-ink">
                      {data?.nakshatra?.name || (locale === "en" ? "Shravana" : "श्रवण")}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-alt text-ink-soft">
                      {t.lord}: {data?.nakshatra?.lord || (locale === "en" ? "Moon" : "चंद्र")}
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-muted">
                    <span>{t.endTime}:</span>
                    <span className="font-semibold text-ink">{data?.nakshatra?.end_time || "07:12 PM"}</span>
                  </div>
                </div>

                {/* Yoga */}
                <div className="bg-card rounded-2xl p-5 border border-line shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent block mb-1">
                    {t.yogaTitle}
                  </span>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-bold text-ink">
                      {data?.yoga?.name || (locale === "en" ? "Sukarma" : "सुकर्मा")}
                    </h3>
                    <span className="text-xs font-semibold text-emerald-600">
                      {data?.yoga?.is_auspicious ? t.auspiciousYoga : t.normal}
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-muted">
                    <span>{t.dailyYoga}:</span>
                    <span className="font-semibold text-ink">{data?.yoga?.end_time || "01:40 PM"}</span>
                  </div>
                </div>

                {/* Karana */}
                <div className="bg-card rounded-2xl p-5 border border-line shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent block mb-1">
                    {t.karanaTitle}
                  </span>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-bold text-ink">
                      {data?.karana?.name || (locale === "en" ? "Bava" : "बव")}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-alt text-ink-soft">
                      {data?.karana?.type || (locale === "en" ? "Chara" : "चर")}
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-muted">
                    <span>{t.karanaState}:</span>
                    <span className="font-semibold text-ink">{data?.karana?.end_time || "12:05 PM"}</span>
                  </div>
                </div>

              </div>

              {/* Bottom Live Link */}
              <div className="p-4 rounded-xl bg-card border border-line flex items-center justify-between text-xs">
                <span className="text-ink-soft">
                  {t.var}: <strong className="text-ink">{data?.vaar || (locale === "en" ? "Tuesday" : "मंगलवार")}</strong> • {t.samvat}
                </span>
                <Link
                  href={locale === "hi" ? "/hi/calculators/daily-panchang" : "/calculators/daily-panchang"}
                  className="font-bold text-accent hover:text-accent-hover flex items-center gap-1 transition"
                >
                  <span>{t.viewFullPanchang}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

            {/* ── RIGHT: Auspicious & Inauspicious Timings / Choghadiya (5 cols) ── */}
            <div className="lg:col-span-5 bg-card rounded-2xl border border-line p-5 shadow-xs space-y-5">
              
              {/* Toggle Buttons */}
              <div className="flex items-center gap-2 bg-surface-alt p-1 rounded-xl border border-line text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("muhurat")}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    activeTab === "muhurat" ? "bg-accent text-white shadow-2xs" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {t.tabMuhurat}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("choghadiya")}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    activeTab === "choghadiya" ? "bg-accent text-white shadow-2xs" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {t.tabChoghadiya}
                </button>
              </div>

              {activeTab === "muhurat" ? (
                <div className="space-y-3.5">
                  {/* Rahu Kaal Alert */}
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                    <div className="flex items-center justify-between text-rose-900 font-bold mb-1">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>{t.rahuKaal}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-200/80 text-[10px] text-rose-800">
                        {t.inauspicious}
                      </span>
                    </div>
                    <p className="text-rose-700 font-semibold text-sm mt-1">
                      {data?.rahu_kaal ? `${data.rahu_kaal.start} – ${data.rahu_kaal.end}` : "12:13 PM – 01:44 PM"}
                    </p>
                    <p className="text-[11px] text-rose-600/80 mt-1">
                      {t.rahuDesc}
                    </p>
                  </div>

                  {/* Abhijit Muhurat */}
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                    <div className="flex items-center justify-between text-emerald-900 font-bold mb-1">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{t.abhijit}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-[10px] text-emerald-800">
                        {t.sarvarthSiddhi}
                      </span>
                    </div>
                    <p className="text-emerald-700 font-semibold text-sm mt-1">
                      {data?.abhijit ? `${data.abhijit.start} – ${data.abhijit.end}` : "11:50 AM – 12:38 PM"}
                    </p>
                    <p className="text-[11px] text-emerald-600/80 mt-1">
                      {t.abhijitDesc}
                    </p>
                  </div>

                  {/* Other Timings */}
                  <div className="space-y-2 pt-2 border-t border-line/60 text-xs">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-ink-soft">{t.brahmaMuhurat}:</span>
                      <span className="font-semibold text-ink">
                        {data?.brahma_muhurat ? `${data.brahma_muhurat.start} – ${data.brahma_muhurat.end}` : "04:35 AM – 05:23 AM"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-ink-soft">{t.yamaganda}:</span>
                      <span className="font-semibold text-ink">
                        {data?.yamaghanda ? `${data.yamaghanda.start} – ${data.yamaghanda.end}` : "09:12 AM – 10:43 AM"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-ink-soft">{t.gulika}:</span>
                      <span className="font-semibold text-ink">
                        {data?.gulika ? `${data.gulika.start} – ${data.gulika.end}` : "01:44 PM – 03:15 PM"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Choghadiya List */
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {(data?.choghadiya && data.choghadiya.length > 0 ? data.choghadiya : [
                    { name: "CHAL", nature: locale === "en" ? "Auspicious" : "शुभ", start_time: "06:11:00", end_time: "07:42:00" },
                    { name: "LABH", nature: locale === "en" ? "Auspicious" : "शुभ", start_time: "07:42:00", end_time: "09:12:00" },
                    { name: "AMRIT", nature: locale === "en" ? "Best" : "श्रेष्ठ", start_time: "09:12:00", end_time: "10:43:00" },
                    { name: "KAAL", nature: locale === "en" ? "Inauspicious" : "अशुभ", start_time: "10:43:00", end_time: "12:13:00" },
                    { name: "SHUBH", nature: locale === "en" ? "Auspicious" : "शुभ", start_time: "12:13:00", end_time: "13:44:00" },
                    { name: "ROG", nature: locale === "en" ? "Inauspicious" : "अशुभ", start_time: "13:44:00", end_time: "15:15:00" },
                    { name: "UDWEG", nature: locale === "en" ? "Inauspicious" : "अशुभ", start_time: "15:15:00", end_time: "16:46:00" },
                    { name: "CHAL", nature: locale === "en" ? "Auspicious" : "शुभ", start_time: "16:46:00", end_time: "18:17:00" },
                  ]).map((slot: any, idx: number) => {
                    const isAuspicious = ["AMRIT", "SHUBH", "LABH", "CHAL"].includes(slot.name);
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          isAuspicious
                            ? "bg-emerald-50/60 border-emerald-200/80 text-emerald-950"
                            : "bg-surface border-line text-ink-soft"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isAuspicious ? "bg-emerald-600" : "bg-rose-500"}`} />
                          <span className="font-bold text-ink">{slot.name}</span>
                          <span className="text-[10px] text-ink-muted">({slot.nature || (isAuspicious ? (locale === "en" ? "Auspicious" : "शुभ") : (locale === "en" ? "Inauspicious" : "अशुभ"))})</span>
                        </div>
                        <span className="font-semibold text-xs text-ink">{formatHM(slot.start_time)}–{formatHM(slot.end_time)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom Quick Action */}
              <div className="pt-2">
                <Link
                  href={locale === "hi" ? "/hi/calculators/daily-panchang" : "/calculators/daily-panchang"}
                  className="w-full py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>{t.panchangCalcBtn}</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>

            </div>

          </div>
        )}

      </div>
    </section>
  );
};
