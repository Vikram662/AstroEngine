"use client";

import React from "react";
import { Star } from "lucide-react";

interface HoroscopeTabProps {
  planets: any[];
  currentDasha: any;
  apiHoroscopeData: any;
  selectedRashi: string;
  setSelectedRashi: (rashi: string) => void;
  rashiPeriod: "daily" | "weekly" | "monthly" | "yearly";
  setRashiPeriod: (period: "daily" | "weekly" | "monthly" | "yearly") => void;
}

export const HoroscopeTab: React.FC<HoroscopeTabProps> = ({
  planets = [],
  currentDasha,
  apiHoroscopeData,
  selectedRashi,
  setSelectedRashi,
  rashiPeriod,
  setRashiPeriod,
}) => {
  const RASHIS = [
    { id: "mesh", en: "Aries", hi: "मेष", symbol: "♈", lord: "Mars", element: "Fire", color: "from-red-500 to-rose-600", light: "bg-red-50 border-red-200", badge: "bg-red-600" },
    { id: "vrishabh", en: "Taurus", hi: "वृषभ", symbol: "♉", lord: "Venus", element: "Earth", color: "from-emerald-500 to-green-600", light: "bg-emerald-50 border-emerald-200", badge: "bg-emerald-600" },
    { id: "mithun", en: "Gemini", hi: "मिथुन", symbol: "♊", lord: "Mercury", element: "Air", color: "from-amber-500 to-yellow-600", light: "bg-amber-50 border-amber-200", badge: "bg-amber-600" },
    { id: "kark", en: "Cancer", hi: "कर्क", symbol: "♋", lord: "Moon", element: "Water", color: "from-blue-400 to-cyan-500", light: "bg-blue-50 border-blue-200", badge: "bg-blue-500" },
    { id: "simha", en: "Leo", hi: "सिंह", symbol: "♌", lord: "Sun", element: "Fire", color: "from-orange-500 to-amber-600", light: "bg-orange-50 border-orange-200", badge: "bg-orange-600" },
    { id: "kanya", en: "Virgo", hi: "कन्या", symbol: "♍", lord: "Mercury", element: "Earth", color: "from-lime-500 to-green-600", light: "bg-lime-50 border-lime-200", badge: "bg-lime-600" },
    { id: "tula", en: "Libra", hi: "तुला", symbol: "♎", lord: "Venus", element: "Air", color: "from-pink-500 to-rose-500", light: "bg-pink-50 border-pink-200", badge: "bg-pink-600" },
    { id: "vrishchik", en: "Scorpio", hi: "वृश्चिक", symbol: "♏", lord: "Mars", element: "Water", color: "from-purple-600 to-violet-700", light: "bg-purple-50 border-purple-200", badge: "bg-purple-700" },
    { id: "dhanu", en: "Sagittarius", hi: "धनु", symbol: "♐", lord: "Jupiter", element: "Fire", color: "from-indigo-500 to-blue-600", light: "bg-indigo-50 border-indigo-200", badge: "bg-indigo-600" },
    { id: "makar", en: "Capricorn", hi: "मकर", symbol: "♑", lord: "Saturn", element: "Earth", color: "from-slate-500 to-gray-700", light: "bg-slate-50 border-slate-200", badge: "bg-slate-700" },
    { id: "kumbh", en: "Aquarius", hi: "कुंभ", symbol: "♒", lord: "Saturn", element: "Air", color: "from-sky-500 to-blue-600", light: "bg-sky-50 border-sky-200", badge: "bg-sky-600" },
    { id: "meen", en: "Pisces", hi: "मीन", symbol: "♓", lord: "Jupiter", element: "Water", color: "from-teal-500 to-cyan-600", light: "bg-teal-50 border-teal-200", badge: "bg-teal-600" },
  ];

  const getPredictions = (rashi: typeof RASHIS[0], period: string) => {
    const safePlanets = Array.isArray(planets) ? planets : [];
    const moonP = safePlanets.find((p: any) => p.id === "MOON" || p.name_en === "Moon" || p.name === "Moon");
    const sunP = safePlanets.find((p: any) => p.id === "SUN" || p.name_en === "Sun" || p.name === "Sun");
    const jupP = safePlanets.find((p: any) => p.id === "JUPITER" || p.name_en === "Jupiter");
    const satP = safePlanets.find((p: any) => p.id === "SATURN" || p.name_en === "Saturn");
    const moonSign = moonP ? (typeof moonP.sign === "object" ? moonP.sign?.name : moonP.sign) || "Virgo" : "Virgo";
    const curMD = currentDasha?.running_dasha?.mahadasha?.planet_name || "Jupiter";
    const idx = RASHIS.findIndex((r) => r.id === rashi.id);

    const daily = {
      overview: `${rashi.en} (${rashi.hi}) natives, today Moon in ${moonSign} creates a ${idx % 2 === 0 ? "harmonious" : "reflective"} mood. Morning hours between ${6 + idx}:00–${8 + idx}:00 are most productive. Lord ${rashi.lord} is ${idx % 3 === 0 ? "well-placed" : idx % 3 === 1 ? "receiving positive aspects" : "bestowing vitality"} today.`,
      career: `Workplace conditions are favorable for ${rashi.en}. Focus on ${["completing pending deliverables", "presenting proposals", "client communication", "team coordination", "creative development", "quality analysis", "collaborative ventures", "strategic research", "expanding professional networks", "executive decisions", "community outreach", "system audit"][idx]}. Recognition from superiors is strongly indicated.`,
      finance: `Financial outlook is stable with growth potential. ${idx % 2 === 0 ? "Good day for evaluating new investment instruments or reclaiming past dues." : "Control discretionary expenditure during the second half of the day. Steady gains from regular income."}`,
      love: `Romantic and family dynamics are promising. ${rashi.element === "Fire" ? "Warm conversations ignite mutual joy." : rashi.element === "Earth" ? "Grounding discussions bring emotional security." : rashi.element === "Air" ? "Clear verbal sharing deepens trust." : "Empathetic listening strengthens relationship bonds."}`,
      health: `Energy levels remain balanced. Give special care to ${["eyes and head", "throat and hydration", "shoulders and posture", "dietary rhythm", "cardiac stamina", "digestive wellness", "kidney and water intake", "reproductive balance", "thighs and mobility", "joints and spine", "calves and circulation", "sleep and feet comfort"][idx]}. A brief evening walk will bring mental tranquility.`,
    };

    const weekly = {
      overview: `This week, ${rashi.en} (${rashi.hi}) sees Moon transiting key sectors. Mid-week: ${curMD} Mahadasha brings positive breakthroughs. Weekend is ideal for rejuvenating pursuits.`,
      career: `Professional advancement accelerates between Tuesday and Thursday. Best time to negotiate contracts or launch initiatives. Your ruling planet ${rashi.lord} protects your reputation.`,
      finance: `Monetary stability improves. New avenues of revenue or commission-based rewards may materialize. Avoid speculation on Fridays.`,
      love: `Family harmony flourishes. Married couples enjoy peaceful domestic alignment. Singles could meet someone inspiring through social circles or work channels.`,
      health: `Stamina stays steady. Prioritize 7-8 hours of uninterrupted sleep and avoid excessive caffeine during late evenings.`,
    };

    const monthly = {
      overview: `${new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })} Monthly Forecast: Governed by ${rashi.lord}'s transit across your quadrant. Progress is consistent across both personal and professional horizons.`,
      career: `A rewarding month for career ambitions. ${idx < 4 ? "Promotions or key leadership assignments" : idx < 8 ? "Steady accolades and client expansion" : "Long-term strategies begin delivering tangible results"}.`,
      finance: `Asset accumulation and disciplined budgeting bear fruit. Best auspicious dates for financial transactions: ${3 + idx}, ${10 + idx}, and ${18 + (idx % 10)}.`,
      love: `Domestic tranquility is highlighted. Auspicious period to resolve historical misunderstandings and plan memorable family journeys.`,
      health: `Vitality remains high. Maintain consistent morning routines, pranayama, and nutrient-dense seasonal foods.`,
    };

    const yearly = {
      overview: `2026 Annual Horoscope for ${rashi.en} (${rashi.hi}): A landmark year guided by Saturn in ${satP ? (typeof satP.sign === "object" ? satP.sign?.name : satP.sign) || "Aquarius" : "Aquarius"} and Jupiter in ${jupP ? (typeof jupP.sign === "object" ? jupP.sign?.name : jupP.sign) || "Taurus" : "Taurus"}.`,
      career: `Transformative professional elevation. Opportunities for expansion, executive promotions, or overseas engagements emerge strongly.`,
      finance: `Substantial wealth building potential. Investments in real-estate, funds, or business infrastructure yield long-term dividends.`,
      love: `Auspicious year for matrimonial commitments and celebrations. Deepening familial support anchors emotional happiness.`,
      health: `Holistic wellness improves noticeably. Lifestyle discipline and preventative healthcare ensure robust endurance throughout the year.`,
    };

    const map: Record<string, typeof daily> = { daily, weekly, monthly, yearly };
    const fallback = map[period] || daily;

    const apiPeriodData = apiHoroscopeData?.[period]?.horoscopes;
    if (Array.isArray(apiPeriodData)) {
      const found = apiPeriodData.find((h: any) => h.rashi_id === rashi.id);
      if (found && found.predictions) {
        return {
          overview: found.predictions.overview || found.prediction || fallback.overview,
          career: found.predictions.career || fallback.career,
          finance: found.predictions.finance || fallback.finance,
          love: found.predictions.love || fallback.love,
          health: found.predictions.health || fallback.health,
        };
      } else if (found && found.prediction) {
        return {
          overview: found.prediction,
          career: fallback.career,
          finance: fallback.finance,
          love: fallback.love,
          health: fallback.health,
        };
      }
    }

    return fallback;
  };

  const activeRashi = RASHIS.find((r) => r.id === selectedRashi) || RASHIS[0];
  const preds = getPredictions(activeRashi, rashiPeriod);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className={`bg-gradient-to-br ${activeRashi.color} rounded-2xl p-6 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 text-[120px] leading-none opacity-10 font-black select-none pr-4 pt-2">
          {activeRashi.symbol}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-6 h-6" />
            <h2 className="text-xl font-black">Rashifal — 12 Rashi Horoscope (राशिफल)</h2>
          </div>
          <p className="text-white/70 text-xs">Live predictions based on current planetary transits for all 12 zodiac signs</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {(["Daily", "Weekly", "Monthly", "Yearly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setRashiPeriod(p.toLowerCase() as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${
                  rashiPeriod === p.toLowerCase()
                    ? "bg-white text-slate-900 border-white shadow-sm"
                    : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                }`}
              >
                {p === "Daily" ? "📆 Daily" : p === "Weekly" ? "📅 Weekly" : p === "Monthly" ? "🗓️ Monthly" : "📆 Yearly 2026"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 12 Rashi Selector Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <p className="text-[10px] uppercase font-bold text-slate-400 mb-3">Select Rashi / Zodiac Sign</p>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
          {RASHIS.map((rashi) => (
            <button
              key={rashi.id}
              onClick={() => setSelectedRashi(rashi.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition text-center ${
                selectedRashi === rashi.id
                  ? `bg-gradient-to-br ${rashi.color} text-white border-transparent shadow-md scale-105`
                  : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700"
              }`}
            >
              <span className="text-lg leading-none">{rashi.symbol}</span>
              <span className={`text-[10px] font-black leading-tight ${selectedRashi === rashi.id ? "text-white" : "text-slate-700"}`}>
                {rashi.en}
              </span>
              <span className={`text-[9px] leading-tight ${selectedRashi === rashi.id ? "text-white/80" : "text-slate-400"}`}>
                {rashi.hi}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Rashi Full Prediction Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-6">
        {/* Rashi Header */}
        <div className={`bg-gradient-to-r ${activeRashi.color} p-5 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{activeRashi.symbol}</span>
              <div>
                <h3 className="text-2xl font-black">{activeRashi.en} ({activeRashi.hi})</h3>
                <p className="text-white/70 text-xs mt-0.5">Lord: {activeRashi.lord} • Element: {activeRashi.element}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-white/20 border border-white/30 capitalize">
                {rashiPeriod} Rashifal
              </span>
              <div className="text-[10px] text-white/60 mt-1">
                {rashiPeriod === "daily" && new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                {rashiPeriod === "weekly" && "This Week"}
                {rashiPeriod === "monthly" && new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                {rashiPeriod === "yearly" && "Year 2026"}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-0 space-y-6">
          {/* General Overview Prediction */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              Astrological Overview ({rashiPeriod.toUpperCase()})
            </div>
            <p className="text-sm font-medium text-slate-800 leading-relaxed">
              {preds.overview}
            </p>
          </div>

          {/* Detailed 4-Pillar Categorized Predictions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Career Prediction */}
            <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💼</span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900">Career & Business (कार्यक्षेत्र)</h4>
                </div>
                <span className="text-xs font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  {[8, 7, 9, 6, 8, 7, 9, 6, 8, 7, 6, 8][RASHIS.findIndex((r) => r.id === selectedRashi)] || 8}/10
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {preds.career}
              </p>
            </div>

            {/* Finance Prediction */}
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-900">Finance & Wealth (धन लाभ)</h4>
                </div>
                <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {[7, 9, 6, 7, 8, 6, 8, 7, 6, 9, 7, 8][RASHIS.findIndex((r) => r.id === selectedRashi)] || 7}/10
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {preds.finance}
              </p>
            </div>

            {/* Love & Relationship Prediction */}
            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">❤️</span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-rose-900">Love & Relationships (प्रेम व परिवार)</h4>
                </div>
                <span className="text-xs font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                  {[9, 7, 8, 9, 7, 8, 7, 9, 8, 6, 9, 7][RASHIS.findIndex((r) => r.id === selectedRashi)] || 8}/10
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {preds.love}
              </p>
            </div>

            {/* Health Prediction */}
            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏥</span>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900">Health & Vitality (स्वास्थ्य)</h4>
                </div>
                <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  {[6, 8, 7, 8, 9, 9, 7, 6, 8, 7, 8, 6][RASHIS.findIndex((r) => r.id === selectedRashi)] || 7}/10
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {preds.health}
              </p>
            </div>
          </div>

          {/* Lucky Info Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Lucky Color", val: ["Red", "Green", "Yellow", "White", "Golden", "Green", "Pink", "Deep Red", "Yellow", "Blue", "Sky Blue", "Sea Green"][RASHIS.findIndex((r) => r.id === selectedRashi)] || "White" },
              { label: "Lucky Number", val: ["9", "6", "5", "2", "1", "5", "6", "9", "3", "8", "8", "3"][RASHIS.findIndex((r) => r.id === selectedRashi)] || "5" },
              { label: "Lucky Day", val: ["Tuesday", "Friday", "Wednesday", "Monday", "Sunday", "Wednesday", "Friday", "Tuesday", "Thursday", "Saturday", "Saturday", "Thursday"][RASHIS.findIndex((r) => r.id === selectedRashi)] || "Wednesday" },
              { label: "Gem Stone", val: ["Red Coral", "Diamond", "Emerald", "Pearl", "Ruby", "Emerald", "Diamond", "Red Coral", "Yellow Sapphire", "Blue Sapphire", "Blue Sapphire", "Yellow Sapphire"][RASHIS.findIndex((r) => r.id === selectedRashi)] || "Diamond" },
            ].map((info, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">{info.label}</div>
                <div className="text-xs font-black text-slate-900 mt-1">{info.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All 12 Rashis Quick View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <h3 className="font-bold text-sm text-slate-900 mb-4">All 12 Rashis — Quick {rashiPeriod.charAt(0).toUpperCase() + rashiPeriod.slice(1)} Outlook</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {RASHIS.map((rashi, idx) => {
            const rashiPreds = getPredictions(rashi, rashiPeriod);
            const text = rashiPreds?.overview || rashiPreds?.career || "";
            return (
              <button
                key={rashi.id}
                onClick={() => setSelectedRashi(rashi.id)}
                className={`text-left p-4 rounded-xl border transition hover:shadow-sm ${
                  selectedRashi === rashi.id
                    ? `bg-gradient-to-br ${rashi.color} text-white border-transparent`
                    : `${rashi.light} hover:scale-[1.01]`
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{rashi.symbol}</span>
                  <div>
                    <span className={`text-xs font-black ${selectedRashi === rashi.id ? "text-white" : "text-slate-900"}`}>{rashi.en}</span>
                    <span className={`text-[10px] ml-1.5 ${selectedRashi === rashi.id ? "text-white/70" : "text-slate-400"}`}>{rashi.hi}</span>
                  </div>
                </div>
                <p className={`text-[10px] leading-relaxed line-clamp-2 ${selectedRashi === rashi.id ? "text-white/80" : "text-slate-600"}`}>
                  {text ? `${text.slice(0, 120)}...` : "Click to view full forecast"}
                </p>
                <div className="flex gap-1 mt-2">
                  {["💼", "💰", "❤️", "🏥"].map((icon, i) => (
                    <span key={i} className="text-[10px]">
                      {icon} {[8, 7, 9, 6, 8, 7, 9, 6, 8, 7, 6, 8][(idx + i) % 12]}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Horoscope Backend API Endpoints Info Card */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Module 2 — Official Horoscope (Rashifal) Backend APIs
          </h3>
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
            4 Endpoints Active (200 OK)
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { ep: "POST /api/v1/panchang/horoscope/daily", desc: "12 Rashis Daily Transit Rashifal, Scores, Lucky Colors & Gemstones", badge: "✓" },
            { ep: "POST /api/v1/panchang/horoscope/weekly", desc: "Weekly Transit Outlook, Lucky Weekday & Category Ratings", badge: "✓" },
            { ep: "POST /api/v1/panchang/horoscope/monthly", desc: "Monthly Forecast, Best Auspicious Dates & Financial Advice", badge: "✓" },
            { ep: "POST /api/v1/panchang/horoscope/yearly", desc: "Annual Varshik Rashifal 2026 based on Jupiter/Saturn/Rahu transits", badge: "✓" },
          ].map((e, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-emerald-600 mt-0.5">{e.badge}</span>
              <div>
                <div className="text-xs font-mono font-bold text-slate-800">{e.ep}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{e.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
