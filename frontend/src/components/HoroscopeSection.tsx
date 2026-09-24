"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { 
  Sparkles, 
  ChevronRight, 
  Loader2, 
  TrendingUp, 
  Heart, 
  Briefcase, 
  ShieldCheck, 
  ExternalLink,
  Calendar,
  X
} from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { getDictionary } from "@/dictionaries/dictionary";

interface RashiInfo {
  index: number;
  id: string;
  name_en: string;
  name_hi: string;
  symbol: string;
  date_range: string;
  element_en: string;
  element_hi: string;
  lord_en: string;
  lord_hi: string;
}

const ALL_RASHIS: RashiInfo[] = [
  { index: 1, id: "mesh", name_en: "Aries", name_hi: "मेष", symbol: "♈", date_range: "21 Mar – 19 Apr", element_en: "Fire", element_hi: "अग्नि", lord_en: "Mars", lord_hi: "मंगल" },
  { index: 2, id: "vrishabh", name_en: "Taurus", name_hi: "वृषभ", symbol: "♉", date_range: "20 Apr – 20 May", element_en: "Earth", element_hi: "पृथ्वी", lord_en: "Venus", lord_hi: "शुक्र" },
  { index: 3, id: "mithun", name_en: "Gemini", name_hi: "मिथुन", symbol: "♊", date_range: "21 May – 20 Jun", element_en: "Air", element_hi: "वायु", lord_en: "Mercury", lord_hi: "बुध" },
  { index: 4, id: "kark", name_en: "Cancer", name_hi: "कर्क", symbol: "♋", date_range: "21 Jun – 22 Jul", element_en: "Water", element_hi: "जल", lord_en: "Moon", lord_hi: "चंद्र" },
  { index: 5, id: "simha", name_en: "Leo", name_hi: "सिंह", symbol: "♌", date_range: "23 Jul – 22 Aug", element_en: "Fire", element_hi: "अग्नि", lord_en: "Sun", lord_hi: "सूर्य" },
  { index: 6, id: "kanya", name_en: "Virgo", name_hi: "कन्या", symbol: "♍", date_range: "23 Aug – 22 Sep", element_en: "Earth", element_hi: "पृथ्वी", lord_en: "Mercury", lord_hi: "बुध" },
  { index: 7, id: "tula", name_en: "Libra", name_hi: "तुला", symbol: "♎", date_range: "23 Sep – 22 Oct", element_en: "Air", element_hi: "वायु", lord_en: "Venus", lord_hi: "शुक्र" },
  { index: 8, id: "vrishchik", name_en: "Scorpio", name_hi: "वृश्चिक", symbol: "♏", date_range: "23 Oct – 21 Nov", element_en: "Water", element_hi: "जल", lord_en: "Mars", lord_hi: "मंगल" },
  { index: 9, id: "dhanu", name_en: "Sagittarius", name_hi: "धनु", symbol: "♐", date_range: "22 Nov – 21 Dec", element_en: "Fire", element_hi: "अग्नि", lord_en: "Jupiter", lord_hi: "गुरु" },
  { index: 10, id: "makar", name_en: "Capricorn", name_hi: "मकर", symbol: "♑", date_range: "22 Dec – 19 Jan", element_en: "Earth", element_hi: "पृथ्वी", lord_en: "Saturn", lord_hi: "शनि" },
  { index: 11, id: "kumbh", name_en: "Aquarius", name_hi: "कुंभ", symbol: "♒", date_range: "20 Jan – 18 Feb", element_en: "Air", element_hi: "वायु", lord_en: "Saturn", lord_hi: "शनि" },
  { index: 12, id: "meen", name_en: "Pisces", name_hi: "मीन", symbol: "♓", date_range: "19 Feb – 20 Mar", element_en: "Water", element_hi: "जल", lord_en: "Jupiter", lord_hi: "गुरु" },
];

export const HoroscopeSection: React.FC = () => {
  const [period, setPeriod] = useState<"daily" | "weekly" | "yearly">("daily");
  const [horoscopeMap, setHoroscopeMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRashi, setSelectedRashi] = useState<RashiInfo | null>(null);
  const [readingModalOpen, setReadingModalOpen] = useState<boolean>(false);
  const locale = useLocale();
  const dict = getDictionary(locale);
  const t = dict.horoscope;

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/horoscope?period=${period}&lang=${locale}`)
      .then(res => {
        if (res.data?.data) {
          const list = res.data.data.horoscopes || res.data.data.results || res.data.data.rashis || [];
          const map: Record<string, any> = {};
          if (Array.isArray(list)) {
            list.forEach((item: any) => {
              const key = (item.rashi_id || item.id || item.name_en || "").toLowerCase();
              map[key] = item;
            });
          }
          setHoroscopeMap(map);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const openReading = (rashi: RashiInfo) => {
    setSelectedRashi(rashi);
    setReadingModalOpen(true);
  };

  const getReadingForRashi = (rashi: RashiInfo) => {
    return (
      horoscopeMap[rashi.id] ||
      horoscopeMap[rashi.name_en.toLowerCase()] ||
      horoscopeMap[rashi.index.toString()] ||
      null
    );
  };

  const getOverallScore = (reading: any): number | null => {
    if (!reading?.ratings) return null;
    if (typeof reading.ratings.overall === "number") return reading.ratings.overall;
    const { career, finance, love, health } = reading.ratings;
    const vals = [career, finance, love, health].filter((v) => typeof v === "number");
    if (!vals.length) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  return (
    <section id="horoscope" className="py-16 sm:py-20 bg-surface border-b border-line scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-line">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft border border-line text-accent text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.badge}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">
              {t.title}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-ink-soft max-w-2xl leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          {/* Timeframe Switcher */}
          <div className="flex items-center gap-1.5 bg-surface-alt p-1.5 rounded-xl border border-line text-xs">
            <button
              onClick={() => setPeriod("daily")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                period === "daily" ? "bg-accent text-white shadow-2xs" : "text-ink-soft hover:text-ink"
              }`}
            >
              {t.daily}
            </button>
            <button
              onClick={() => setPeriod("weekly")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                period === "weekly" ? "bg-accent text-white shadow-2xs" : "text-ink-soft hover:text-ink"
              }`}
            >
              {t.weekly}
            </button>
            <button
              onClick={() => setPeriod("yearly")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                period === "yearly" ? "bg-accent text-white shadow-2xs" : "text-ink-soft hover:text-ink"
              }`}
            >
              {t.yearly}
            </button>
          </div>
        </div>

        {/* 12 Rashi Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {ALL_RASHIS.map(rashi => {
            const reading = getReadingForRashi(rashi);
            const score = getOverallScore(reading) ?? (75 + (rashi.index * 3) % 20);
            const displayName = locale === "en" ? rashi.name_en : rashi.name_hi;
            const element = locale === "en" ? rashi.element_en : rashi.element_hi;
            const lord = locale === "en" ? rashi.lord_en : rashi.lord_hi;

            return (
              <div
                key={rashi.id}
                onClick={() => openReading(rashi)}
                className="group bg-card rounded-2xl p-5 border border-line hover:border-accent/50 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Card Top: Symbol, Name, Score */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-accent-soft border border-line/80 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform shrink-0">
                        {rashi.symbol}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-ink group-hover:text-accent transition-colors flex items-center gap-1.5">
                          <span>{displayName}</span>
                        </h3>
                        <span className="text-[11px] text-ink-muted block mt-0.5 font-medium">
                          {rashi.date_range}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Compatibility Badges */}
                  <div className="flex items-center gap-2 text-[10px] text-ink-soft bg-surface-alt p-2 rounded-xl border border-line mb-3">
                    <span className="truncate">{t.element}: <strong className="text-ink">{element}</strong></span>
                    <span className="text-line">•</span>
                    <span className="truncate">{t.lord}: <strong className="text-ink">{lord}</strong></span>
                  </div>

                  {/* Quick Prediction Snippet */}
                  <p className="text-xs text-ink-soft leading-relaxed line-clamp-3">
                    {loading ? (
                      <span className="text-ink-muted">{t.loading}</span>
                    ) : reading?.prediction || reading?.summary || reading?.general ? (
                      reading.prediction || reading.summary || reading.general
                    ) : (
                      locale === "en"
                        ? `Today is favorable for ${rashi.name_en} natives. Auspicious opportunities will arise in career and work.`
                        : `${rashi.name_hi} राशि के जातकों के लिए आज का दिन अनुकूल रहेगा। कार्यक्षेत्र में प्रगति के शुभ अवसर प्राप्त होंगे।`
                    )}
                  </p>
                </div>

                {/* Card Footer: Overall Luck % & CTA */}
                <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-bold text-ink">{score}% {locale === "en" ? "Favorable" : "अनुकूलता"}</span>
                  </div>
                  <span className="text-xs font-bold text-accent group-hover:text-accent-hover flex items-center gap-1 transition">
                    <span>{t.readMore}</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ── DETAILED HOROSCOPE MODAL ── */}
      {readingModalOpen && selectedRashi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-xl rounded-3xl border border-line shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-line bg-surface-alt flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-accent-soft border border-line flex items-center justify-center text-2xl">
                  {selectedRashi.symbol}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                    {period === "daily" 
                      ? (locale === "en" ? "Today's Daily Horoscope" : "आज का दैनिक राशिफल")
                      : period === "weekly" 
                      ? (locale === "en" ? "Weekly Horoscope" : "साप्ताहिक राशिफल")
                      : (locale === "en" ? "Yearly 2026 Horoscope" : "वार्षिक 2026 राशिफल")}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-ink">
                    {locale === "en" ? selectedRashi.name_en : `${selectedRashi.name_hi} राशि`}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setReadingModalOpen(false)}
                className="p-2 rounded-full hover:bg-surface border border-line text-ink-soft transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-ink-soft leading-relaxed">
              {/* Lucky Attributes Grid */}
              <div className="grid grid-cols-3 gap-3 bg-surface p-3.5 rounded-xl border border-line text-center">
                <div>
                  <span className="text-[10px] text-ink-muted block">{locale === "en" ? "Lucky Color" : "शुभ रंग"}</span>
                  <span className="font-bold text-ink text-xs mt-0.5 block">
                    {getReadingForRashi(selectedRashi)?.lucky_color || (locale === "en" ? "Red / Yellow" : "लाल / पीला")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-muted block">{locale === "en" ? "Lucky Number" : "शुभ अंक"}</span>
                  <span className="font-bold text-accent text-xs mt-0.5 block">
                    {getReadingForRashi(selectedRashi)?.lucky_number || "9, 3"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-muted block">{locale === "en" ? "Gemstone" : "शुभ रत्न"}</span>
                  <span className="font-bold text-ink text-xs mt-0.5 block">
                    {getReadingForRashi(selectedRashi)?.gemstone || (locale === "en" ? "Coral / Yellow Sapphire" : "मूंगा / पुखराज")}
                  </span>
                </div>
              </div>

              {/* Main Reading */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-ink flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>{locale === "en" ? "General Prediction" : "सामान्य फलादेश"}</span>
                </h4>
                <p className="bg-surface p-4 rounded-xl border border-line text-ink leading-relaxed">
                  {getReadingForRashi(selectedRashi)?.prediction || 
                   getReadingForRashi(selectedRashi)?.summary ||
                   (locale === "en"
                     ? `Planetary influences are very supportive for ${selectedRashi.name_en} today. New initiatives will bring positive gains and family harmony remains strong.`
                     : `${selectedRashi.name_hi} राशि के जातकों के लिए आज ग्रहों का प्रभाव अत्यंत उत्साहवर्धक रहेगा। नए संपर्क लाभकारी सिद्ध होंगे और लंबित कार्य पूर्ण होंगे। पारिवारिक वातावरण सुखद रहेगा।`)}
                </p>
              </div>

              {/* Categorized Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-surface p-3.5 rounded-xl border border-line">
                  <div className="flex items-center gap-1.5 font-bold text-ink mb-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-accent" />
                    <span>{locale === "en" ? "Career & Business" : "करियर एवं व्यवसाय"}</span>
                  </div>
                  <p className="text-[11px] text-ink-soft">
                    {getReadingForRashi(selectedRashi)?.predictions?.career || 
                     (locale === "en" 
                       ? "Colleagues and seniors will support your plans. Good time to evaluate new strategies." 
                       : "कार्यक्षेत्र में वरिष्ठ अधिकारियों का सहयोग प्राप्त होगा। नई योजनाओं पर विचार करें।")}
                  </p>
                </div>

                <div className="bg-surface p-3.5 rounded-xl border border-line">
                  <div className="flex items-center gap-1.5 font-bold text-ink mb-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>{locale === "en" ? "Love & Relationships" : "प्रेम एवं संबंध"}</span>
                  </div>
                  <p className="text-[11px] text-ink-soft">
                    {getReadingForRashi(selectedRashi)?.predictions?.love || 
                     (locale === "en"
                       ? "Harmony and sweetness prevail in your personal relationships. Enjoy quality time with loved ones."
                       : "दांपत्य जीवन में मधुरता बनी रहेगी। प्रियजन के साथ सुखद समय व्यतीत होगा।")}
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </section>
  );
};
