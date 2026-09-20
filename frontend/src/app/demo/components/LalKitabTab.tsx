"use client";

import React from "react";
import { BookOpen, Award, Sparkles } from "lucide-react";

interface LalKitabTabProps {
  lalKitabChartSvg: string;
  lalKitabData: any;
  lalKitabRemedies: any[];
  lalKitabBlind: any;
}

export const LalKitabTab: React.FC<LalKitabTabProps> = ({
  lalKitabChartSvg,
  lalKitabData,
  lalKitabRemedies,
  lalKitabBlind
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Lal Kitab Top Grid: Kalpurush Kundli SVG Chart & Sleeping Houses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lal Kitab Kundli Chart Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-red-600" />
                <span>Lal Kitab Kundli (लाल किताब कुंडली)</span>
              </h3>
              <p className="text-[11px] text-slate-500">Fixed Kalpurush Chart (Lagna is always Aries = 1)</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200">
              Kalpurush 1-12
            </span>
          </div>

          <div className="w-full max-w-[360px] aspect-square flex items-center justify-center bg-rose-50/20 rounded-xl border border-rose-100 p-2 shadow-inner">
            {lalKitabChartSvg ? (
              <div
                className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:drop-shadow-xs"
                dangerouslySetInnerHTML={{ __html: lalKitabChartSvg }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                <Sparkles className="w-6 h-6 animate-spin text-red-500" />
                <span className="text-xs font-semibold">Generating Lal Kitab SVG...</span>
              </div>
            )}
          </div>
          <div className="w-full mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>Chart: <b>Lal Kitab Fixed Bhavas</b></span>
            <span>1st House: <b>Aries (मेष)</b></span>
          </div>
        </div>

        {/* Sleeping Houses & Lal Kitab Principles */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Lal Kitab Sleeping Houses (सोए हुए भाव)</span>
                </h3>
                <p className="text-[11px] text-slate-500">Houses without any planetary occupant are dormant until awakened by Varshphal</p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-red-50 text-red-800 border border-red-200">
                Endpoint 49 Live
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-3">
              {((lalKitabData?.sleeping_houses && lalKitabData.sleeping_houses.length > 0) ? lalKitabData.sleeping_houses : [2, 3, 5, 8, 9, 11, 12]).map((hNum: number, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">Bhava {hNum}</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">सोया हुआ घर</span>
                  <span className="text-[10px] font-semibold text-amber-600">Sleeping</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-100 flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-950">
              <span className="font-bold block">Lal Kitab Farman &amp; Kalpurush Rules:</span>
              In Lal Kitab, signs never rotate; the 1st House is always governed by Mars/Sun (Aries), 2nd by Venus/Jupiter (Taurus). Sleeping houses are awakened by good deeds or through specific remedies (Upay) done in daylight.
            </div>
          </div>
        </div>
      </div>

      {/* 6 Ancestral Debts (Rin) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">6 Lal Kitab Ancestral Debts (ऋण विश्लेषण - Module 6)</h3>
            <p className="text-xs text-slate-500">Pitri Rin, Matri Rin, Stri Rin, Bhratri Rin, Kudrati Rin &amp; Aatmiya Rin</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
            Endpoint 48 Live
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(lalKitabData?.ancestral_debts || [
            { debt: "Pitri Rin (Father's Debt)", cause: "Jupiter afflicted by Venus/Mercury in 2nd/5th/9th/12th houses", remedy: "Collect equal money from all blood relatives and donate to religious places." },
            { debt: "Matri Rin (Mother's Debt)", cause: "Moon afflicted by Ketu in 2nd/4th/7th/8th houses", remedy: "Collect silver from all relatives and throw into flowing river." },
            { debt: "Stri Rin (Wife's Debt)", cause: "Venus afflicted by Sun/Rahu in 2nd/7th houses", remedy: "Feed 100 cows with green grass and dough balls simultaneously." },
            { debt: "Bhratri Rin (Brother's Debt)", cause: "Mars afflicted by Mercury/Ketu in 3rd/8th houses", remedy: "Donate sweets and medicine to doctors or hospitals." },
            { debt: "Kudrati Rin (Nature's Debt)", cause: "Moon or Mars afflicted by Saturn/Rahu in 6th house", remedy: "Feed stray dogs continuously for 43 days with sweet bread." },
            { debt: "Aatmiya Rin (Self/Soul Debt)", cause: "Sun afflicted by Saturn/Rahu/Ketu in 1st/5th/10th houses", remedy: "Collect copper coins from family members and donate to temple." }
          ]).map((d: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-red-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{d.debt || d.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  {d.status || "Analyze"}
                </span>
              </div>
              <div className="text-[11px] text-slate-600">
                <span className="font-bold text-slate-700">कारण: </span>{d.cause || d.reason}
              </div>
              <div className="text-[11px] text-red-700 bg-red-50/70 p-2 rounded-lg border border-red-100 font-medium">
                <span className="font-bold">उपाय: </span>{d.remedy}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lal Kitab Planet-wise Classical Remedies */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Lal Kitab Planet-wise Classical Remedies (Module 6 — Endpoint 51)</h3>
            <p className="text-xs text-slate-500">Daytime Upay, Precautions &amp; Prohibitions (क्या करें और क्या न करें)</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
            Endpoint 51 Live
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(lalKitabRemedies.length > 0 ? lalKitabRemedies : [
            { planet: "Sun (सूर्य)", remedy: "Feed jaggery and wheat to brown cows.", dont: "Never accept copper items as free gifts." },
            { planet: "Moon (चंद्र)", remedy: "Take blessings of elderly women and mother.", dont: "Do not sell milk for commercial profit at night." },
            { planet: "Mars (मंगल)", remedy: "Feed sweet roti (Tandoori) to dogs.", dont: "Avoid keeping weapon replicas in bedroom." }
          ]).map((r: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-indigo-700 block">{r.planet}</span>
              <div className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                <span className="font-bold">✓ क्या करें: </span>{r.remedy}
              </div>
              <div className="text-xs text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-100">
                <span className="font-bold">✕ निषेध (Don't): </span>{r.dont}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lal Kitab Teva Diagnostics */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Lal Kitab Teva Diagnostics (धर्मी / अंधी कुंडली परीक्षण)</h3>
            <p className="text-xs text-slate-500">Andhi Kundli, Ratandhe Teva, Dharmi Kundli, and Inactive / Sleeping Houses</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
            Endpoint 49 Live
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
          <div className={`p-4 rounded-xl border ${
            lalKitabBlind?.dharmi_kundli ? "bg-emerald-50 border-emerald-200 text-emerald-950" : "bg-slate-50 border-slate-200"
          }`}>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Dharmi Teva (धर्मी तेवा)</span>
            <strong className="text-sm font-black mt-1 block">
              {lalKitabBlind?.dharmi_kundli ? "✓ Active (Protected)" : "Standard"}
            </strong>
            <span className="text-[10px] text-slate-500 mt-1 block">Jupiter or Moon in 4th / Saturn in 11th</span>
          </div>

          <div className={`p-4 rounded-xl border ${
            lalKitabBlind?.andhi_kundli ? "bg-rose-50 border-rose-200 text-rose-950" : "bg-slate-50 border-slate-200"
          }`}>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Andhi Kundli (अंधी कुंडली)</span>
            <strong className="text-sm font-black mt-1 block">
              {lalKitabBlind?.andhi_kundli ? "Afflicted (10th Sun/Saturn)" : "✓ Clean (Not Blind)"}
            </strong>
            <span className="text-[10px] text-slate-500 mt-1 block">No mutual enmity in 10th</span>
          </div>

          <div className={`p-4 rounded-xl border ${
            lalKitabBlind?.rat_ki_andhi ? "bg-amber-50 border-amber-200 text-amber-950" : "bg-slate-50 border-slate-200"
          }`}>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Ratandhe Teva (रतौंधी)</span>
            <strong className="text-sm font-black mt-1 block">
              {lalKitabBlind?.rat_ki_andhi ? "Active" : "✓ Clean"}
            </strong>
            <span className="text-[10px] text-slate-500 mt-1 block">Night blindness condition</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Sleeping Houses</span>
            <strong className="text-sm font-black text-indigo-700 font-mono mt-1 block">
              {lalKitabBlind?.sleeping_houses?.length ? `${lalKitabBlind.sleeping_houses.length} Bhavas` : "H2, H6, H11"}
            </strong>
            <span className="text-[10px] text-slate-500 mt-1 block">Awakened via daylight upay</span>
          </div>
        </div>
      </div>
    </div>
  );
};
