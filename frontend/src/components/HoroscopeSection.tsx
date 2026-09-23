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

interface RashiInfo {
  index: number;
  id: string;
  name_en: string;
  name_hi: string;
  symbol: string;
  date_range: string;
  element: string;
  lord: string;
}

const ALL_RASHIS: RashiInfo[] = [
  { index: 1, id: "mesh", name_en: "Aries", name_hi: "मेष", symbol: "♈", date_range: "21 Mar – 19 Apr", element: "अग्नि (Fire)", lord: "मंगल" },
  { index: 2, id: "vrishabh", name_en: "Taurus", name_hi: "वृषभ", symbol: "♉", date_range: "20 Apr – 20 May", element: "पृथ्वी (Earth)", lord: "शुक्र" },
  { index: 3, id: "mithun", name_en: "Gemini", name_hi: "मिथुन", symbol: "♊", date_range: "21 May – 20 Jun", element: "वायु (Air)", lord: "बुध" },
  { index: 4, id: "kark", name_en: "Cancer", name_hi: "कर्क", symbol: "♋", date_range: "21 Jun – 22 Jul", element: "जल (Water)", lord: "चंद्र" },
  { index: 5, id: "simha", name_en: "Leo", name_hi: "सिंह", symbol: "♌", date_range: "23 Jul – 22 Aug", element: "अग्नि (Fire)", lord: "सूर्य" },
  { index: 6, id: "kanya", name_en: "Virgo", name_hi: "कन्या", symbol: "♍", date_range: "23 Aug – 22 Sep", element: "पृथ्वी (Earth)", lord: "बुध" },
  { index: 7, id: "tula", name_en: "Libra", name_hi: "तुला", symbol: "♎", date_range: "23 Sep – 22 Oct", element: "वायु (Air)", lord: "शुक्र" },
  { index: 8, id: "vrishchik", name_en: "Scorpio", name_hi: "वृश्चिक", symbol: "♏", date_range: "23 Oct – 21 Nov", element: "जल (Water)", lord: "मंगल" },
  { index: 9, id: "dhanu", name_en: "Sagittarius", name_hi: "धनु", symbol: "♐", date_range: "22 Nov – 21 Dec", element: "अग्नि (Fire)", lord: "गुरु" },
  { index: 10, id: "makar", name_en: "Capricorn", name_hi: "मकर", symbol: "♑", date_range: "22 Dec – 19 Jan", element: "पृथ्वी (Earth)", lord: "शनि" },
  { index: 11, id: "kumbh", name_en: "Aquarius", name_hi: "कुंभ", symbol: "♒", date_range: "20 Jan – 18 Feb", element: "वायु (Air)", lord: "शनि" },
  { index: 12, id: "meen", name_en: "Pisces", name_hi: "मीन", symbol: "♓", date_range: "19 Feb – 20 Mar", element: "जल (Water)", lord: "गुरु" },
];

export const HoroscopeSection: React.FC = () => {
  const [period, setPeriod] = useState<"daily" | "weekly" | "yearly">("daily");
  const [horoscopeMap, setHoroscopeMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRashi, setSelectedRashi] = useState<RashiInfo | null>(null);
  const [readingModalOpen, setReadingModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/horoscope?period=${period}&lang=hi`)
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
              <span>गोचर आधारित वैदिक राशिफल • 12 राशियां</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">
              आज का राशिफल <span className="font-display italic text-accent font-normal">(Today&apos;s Horoscope)</span>
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-ink-soft max-w-2xl leading-relaxed">
              वर्तमान चंद्र गोचर और ग्रहों की अनुकूलता के आधार पर करियर, धन, स्वास्थ्य और दांपत्य जीवन का सटीक फलादेश।
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
              दैनिक (Daily)
            </button>
            <button
              onClick={() => setPeriod("weekly")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                period === "weekly" ? "bg-accent text-white shadow-2xs" : "text-ink-soft hover:text-ink"
              }`}
            >
              साप्ताहिक (Weekly)
            </button>
            <button
              onClick={() => setPeriod("yearly")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                period === "yearly" ? "bg-accent text-white shadow-2xs" : "text-ink-soft hover:text-ink"
              }`}
            >
              वार्षिक 2026 (Yearly)
            </button>
          </div>
        </div>

        {/* 12 Rashi Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {ALL_RASHIS.map(rashi => {
            const reading = getReadingForRashi(rashi);
            const score = getOverallScore(reading) ?? (75 + (rashi.index * 3) % 20);

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
                          <span>{rashi.name_hi}</span>
                          <span className="text-xs font-normal text-ink-muted">({rashi.name_en})</span>
                        </h3>
                        <span className="text-[11px] text-ink-muted block mt-0.5 font-medium">
                          {rashi.date_range}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Compatibility Badges */}
                  <div className="flex items-center gap-2 text-[10px] text-ink-soft bg-surface-alt p-2 rounded-xl border border-line mb-3">
                    <span className="truncate">तत्व: <strong className="text-ink">{rashi.element}</strong></span>
                    <span className="text-line">•</span>
                    <span className="truncate">स्वामी: <strong className="text-ink">{rashi.lord}</strong></span>
                  </div>

                  {/* Quick Prediction Snippet */}
                  <p className="text-xs text-ink-soft leading-relaxed line-clamp-3">
                    {loading ? (
                      <span className="text-ink-muted">फलादेश लोड हो रहा है...</span>
                    ) : reading?.prediction || reading?.summary || reading?.general ? (
                      reading.prediction || reading.summary || reading.general
                    ) : (
                      `${rashi.name_hi} राशि के जातकों के लिए आज का दिन अनुकूल रहेगा। कार्यक्षेत्र में प्रगति के शुभ अवसर प्राप्त होंगे।`
                    )}
                  </p>
                </div>

                {/* Card Footer: Overall Luck % & CTA */}
                <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-bold text-ink">{score}% अनुकूलता</span>
                  </div>
                  <span className="text-xs font-bold text-accent group-hover:text-accent-hover flex items-center gap-1 transition">
                    <span>पूरा पढ़ें</span>
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
                    {period === "daily" ? "आज का दैनिक राशिफल" : period === "weekly" ? "साप्ताहिक राशिफल" : "वार्षिक 2026 राशिफल"}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-ink">
                    {selectedRashi.name_hi} राशि ({selectedRashi.name_en})
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setReadingModalOpen(false)}
                className="p-2 rounded-full hover:bg-surface border border-line text-ink-soft transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-ink-soft leading-relaxed">
              {/* Lucky Attributes Grid */}
              <div className="grid grid-cols-3 gap-3 bg-surface p-3.5 rounded-xl border border-line text-center">
                <div>
                  <span className="text-[10px] text-ink-muted block">शुभ रंग (Color)</span>
                  <span className="font-bold text-ink text-xs mt-0.5 block">
                    {getReadingForRashi(selectedRashi)?.lucky_color || "लाल / पीला"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-muted block">शुभ अंक (Number)</span>
                  <span className="font-bold text-accent text-xs mt-0.5 block">
                    {getReadingForRashi(selectedRashi)?.lucky_number || "9, 3"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-muted block">शुभ रत्न (Gemstone)</span>
                  <span className="font-bold text-ink text-xs mt-0.5 block">
                    {getReadingForRashi(selectedRashi)?.gemstone || "मूंगा / पुखराज"}
                  </span>
                </div>
              </div>

              {/* Main Reading */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-ink flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>सामान्य फलादेश (General Prediction)</span>
                </h4>
                <p className="bg-surface p-4 rounded-xl border border-line text-ink leading-relaxed">
                  {getReadingForRashi(selectedRashi)?.prediction || 
                   getReadingForRashi(selectedRashi)?.summary ||
                   `${selectedRashi.name_hi} राशि के जातकों के लिए आज ग्रहों का प्रभाव अत्यंत उत्साहवर्धक रहेगा। नए संपर्क लाभकारी सिद्ध होंगे और लंबित कार्य पूर्ण होंगे। पारिवारिक वातावरण सुखद रहेगा।`}
                </p>
              </div>

              {/* Categorized Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-surface p-3.5 rounded-xl border border-line">
                  <div className="flex items-center gap-1.5 font-bold text-ink mb-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-accent" />
                    <span>करियर एवं व्यवसाय (Career)</span>
                  </div>
                  <p className="text-[11px] text-ink-soft">
                    {getReadingForRashi(selectedRashi)?.predictions?.career || "कार्यक्षेत्र में वरिष्ठ अधिकारियों का सहयोग प्राप्त होगा। नई योजनाओं पर विचार करें।"}
                  </p>
                </div>

                <div className="bg-surface p-3.5 rounded-xl border border-line">
                  <div className="flex items-center gap-1.5 font-bold text-ink mb-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>प्रेम एवं संबंध (Love)</span>
                  </div>
                  <p className="text-[11px] text-ink-soft">
                    {getReadingForRashi(selectedRashi)?.predictions?.love || "दांपत्य जीवन में मधुरता बनी रहेगी। प्रियजन के साथ सुखद समय व्यतीत होगा।"}
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
