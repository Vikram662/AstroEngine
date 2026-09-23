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

  const todayDateStr = new Date().toLocaleDateString("hi-IN", {
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
              <span>प्रत्यक्ष वैदिक दैनिक पंचांग • नई दिल्ली संदर्भ</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">
              आज का पंचांग एवं शुभ मुहूर्त <span className="font-display italic text-accent font-normal">(Today&apos;s Panchang)</span>
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-ink-soft max-w-2xl leading-relaxed">
              सूर्य-चंद्र गति पर आधारित तिथि, नक्षत्र, योग, करण, राहुकाल और दिन-रात का चौघड़िया — किसी भी शुभ कार्य से पूर्व अवश्य देखें।
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
            <p className="text-sm font-semibold text-ink">आज का वैदिक पंचांग लोड हो रहा है...</p>
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
                    <span className="text-[10px] text-ink-muted uppercase block font-semibold">सूर्योदय (Sunrise)</span>
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
                    <span className="text-[10px] text-ink-muted uppercase block font-semibold">सूर्यास्त (Sunset)</span>
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
                    <span className="text-[10px] text-ink-muted uppercase block font-semibold">चन्द्रोदय (Moonrise)</span>
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
                    <span className="text-[10px] text-ink-muted uppercase block font-semibold">स्थान</span>
                    <span className="text-xs font-bold text-ink truncate block">
                      नई दिल्ली (28.61° N)
                    </span>
                  </div>
                </div>
              </div>

              {/* The 5 Limbs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Tithi */}
                <div className="bg-card rounded-2xl p-5 border border-line shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent block mb-1">
                    प्रथम अंग • तिथि (Tithi)
                  </span>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-bold text-ink">
                      {data?.tithi?.name || "द्वादशी"}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-alt text-ink-soft">
                      {data?.tithi?.paksha || "शुक्ल पक्ष"}
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-muted">
                    <span>समाप्ति समय:</span>
                    <span className="font-semibold text-ink">{data?.tithi?.end_time || "रात 11:24 तक"}</span>
                  </div>
                </div>

                {/* Nakshatra */}
                <div className="bg-card rounded-2xl p-5 border border-line shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent block mb-1">
                    द्वितीय अंग • नक्षत्र (Nakshatra)
                  </span>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-bold text-ink">
                      {data?.nakshatra?.name || "श्रवण"}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-alt text-ink-soft">
                      स्वामी: {data?.nakshatra?.lord || "चंद्र"}
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-muted">
                    <span>समाप्ति समय:</span>
                    <span className="font-semibold text-ink">{data?.nakshatra?.end_time || "शाम 07:12 तक"}</span>
                  </div>
                </div>

                {/* Yoga */}
                <div className="bg-card rounded-2xl p-5 border border-line shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent block mb-1">
                    तृतीय अंग • योग (Yoga)
                  </span>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-bold text-ink">
                      {data?.yoga?.name || "सु pointकर्मा / धृति"}
                    </h3>
                    <span className="text-xs font-semibold text-emerald-600">
                      {data?.yoga?.is_auspicious ? "शुभ योग" : "सामान्य"}
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-muted">
                    <span>दैनिक योग:</span>
                    <span className="font-semibold text-ink">{data?.yoga?.end_time || "दोपहर 01:40 तक"}</span>
                  </div>
                </div>

                {/* Karana */}
                <div className="bg-card rounded-2xl p-5 border border-line shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent block mb-1">
                    चतुर्थ अंग • करण (Karana)
                  </span>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-bold text-ink">
                      {data?.karana?.name || "बव / बालव"}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-alt text-ink-soft">
                      {data?.karana?.type || "चर करण"}
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-muted">
                    <span>करण स्थिति:</span>
                    <span className="font-semibold text-ink">{data?.karana?.end_time || "दोपहर 12:05 तक"}</span>
                  </div>
                </div>

              </div>

              {/* Bottom Live Link */}
              <div className="p-4 rounded-xl bg-card border border-line flex items-center justify-between text-xs">
                <span className="text-ink-soft">
                  वार: <strong className="text-ink">{data?.vaar || "मंगलवार"}</strong> • संवत् 2083
                </span>
                <Link
                  href="/demo?tab=panchang"
                  className="font-bold text-accent hover:text-accent-hover flex items-center gap-1 transition"
                >
                  <span>विस्तृत मासिक पंचांग देखें</span>
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
                  शुभ व अशुभ काल
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("choghadiya")}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    activeTab === "choghadiya" ? "bg-accent text-white shadow-2xs" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  दिन का चौघड़िया
                </button>
              </div>

              {activeTab === "muhurat" ? (
                <div className="space-y-3.5">
                  {/* Rahu Kaal Alert */}
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                    <div className="flex items-center justify-between text-rose-900 font-bold mb-1">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>राहु काल (अशुभ समय - वर्जित)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-200/80 text-[10px] text-rose-800">
                        अशुभ
                      </span>
                    </div>
                    <p className="text-rose-700 font-semibold text-sm mt-1">
                      {data?.rahu_kaal ? `${data.rahu_kaal.start} – ${data.rahu_kaal.end}` : "12:13 PM – 01:44 PM"}
                    </p>
                    <p className="text-[11px] text-rose-600/80 mt-1">
                      इस काल में कोई भी नया कार्य, लेन-देन अथवा यात्रा आरंभ न करें।
                    </p>
                  </div>

                  {/* Abhijit Muhurat */}
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                    <div className="flex items-center justify-between text-emerald-900 font-bold mb-1">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>अभिजित मुहूर्त (सर्वश्रेष्ठ समय)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-[10px] text-emerald-800">
                        सर्वार्थ सिद्धि
                      </span>
                    </div>
                    <p className="text-emerald-700 font-semibold text-sm mt-1">
                      {data?.abhijit ? `${data.abhijit.start} – ${data.abhijit.end}` : "11:50 AM – 12:38 PM"}
                    </p>
                    <p className="text-[11px] text-emerald-600/80 mt-1">
                      विजय मुहूर्त: किसी भी महत्वपूर्ण शुभ कार्य के लिए श्रेष्ठ।
                    </p>
                  </div>

                  {/* Other Timings */}
                  <div className="space-y-2 pt-2 border-t border-line/60 text-xs">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-ink-soft">ब्रह्म मुहूर्त:</span>
                      <span className="font-semibold text-ink">
                        {data?.brahma_muhurat ? `${data.brahma_muhurat.start} – ${data.brahma_muhurat.end}` : "04:35 AM – 05:23 AM"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-ink-soft">यमगण्ड काल:</span>
                      <span className="font-semibold text-ink">
                        {data?.yamaghanda ? `${data.yamaghanda.start} – ${data.yamaghanda.end}` : "09:12 AM – 10:43 AM"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-ink-soft">गुलिक काल:</span>
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
                    { name: "CHAL", nature: "शुभ", start_time: "06:11:00", end_time: "07:42:00" },
                    { name: "LABH", nature: "शुभ", start_time: "07:42:00", end_time: "09:12:00" },
                    { name: "AMRIT", nature: "श्रेष्ठ", start_time: "09:12:00", end_time: "10:43:00" },
                    { name: "KAAL", nature: "अशुभ", start_time: "10:43:00", end_time: "12:13:00" },
                    { name: "SHUBH", nature: "शुभ", start_time: "12:13:00", end_time: "13:44:00" },
                    { name: "ROG", nature: "अशुभ", start_time: "13:44:00", end_time: "15:15:00" },
                    { name: "UDWEG", nature: "अशुभ", start_time: "15:15:00", end_time: "16:46:00" },
                    { name: "CHAL", nature: "शुभ", start_time: "16:46:00", end_time: "18:17:00" },
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
                          <span className="text-[10px] text-ink-muted">({slot.nature || (isAuspicious ? "शुभ" : "अशुभ")})</span>
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
                  href="/demo?tab=panchang"
                  className="w-full py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>संपूर्ण 24-घंटे होरा एवं पंचांग कंसोल</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>

            </div>

          </div>
        )}

      </div>
    </section>
  );
};
