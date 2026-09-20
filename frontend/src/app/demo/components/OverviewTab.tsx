"use client";

import React from "react";
import { ShieldAlert, Loader2 } from "lucide-react";

interface OverviewTabProps {
  d1Chart: any;
  planets: any[];
  panchang: any;
  currentDasha: any;
  chartStyle: "NORTH_INDIAN" | "SOUTH_INDIAN";
  setChartStyle: (style: "NORTH_INDIAN" | "SOUTH_INDIAN") => void;
  vargaSvgMap: Record<string, string>;
  svgChartD1: string;
  vargaLoading: boolean;
  loadVargaSvg: (varga: string, prof: any, style: "NORTH_INDIAN" | "SOUTH_INDIAN") => void;
  profile: any;
  manglikData: any;
  kaalSarpData: any;
  lang?: string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  d1Chart,
  planets = [],
  panchang,
  currentDasha,
  chartStyle,
  setChartStyle,
  vargaSvgMap,
  svgChartD1,
  vargaLoading,
  loadVargaSvg,
  profile,
  manglikData,
  kaalSarpData,
  lang = "en",
}) => {
  const isHi = lang === "hi";
  const isMr = lang === "mr";
  const isGu = lang === "gu";
  const isTa = lang === "ta";
  const isTe = lang === "te";
  const isBn = lang === "bn";

  const labels = {
    lagna: isHi ? "लग्न (प्रथम भाव)" : isMr ? "लग्न (पहिले स्थान)" : isGu ? "લગ્ન (પ્રથમ ભાવ)" : isTa ? "லக்னம்" : isTe ? "లగ్నం" : isBn ? "লগ্ন" : "Lagna (Ascendant)",
    moonSign: isHi ? "चंद्र राशि (जन्म राशि)" : isMr ? "चंद्र राशी (जन्म राशी)" : isGu ? "ચંદ્ર રાશિ (જન્મ રાશિ)" : isTa ? "சந்திர ராசி" : isTe ? "చంద్ర రాశి" : isBn ? "চন্দ্র রাশি" : "Moon Sign (Janma Rashi)",
    sunSign: isHi ? "सूर्य राशि" : isMr ? "सूर्य राशी" : isGu ? "સૂર્ય રાશિ" : isTa ? "சூரிய ராசி" : isTe ? "సూర్య రాశి" : isBn ? "সূর্য রাশি" : "Sun Sign (Surya Rashi)",
    currentDasha: isHi ? "वर्तमान महादशा" : isMr ? "चालू महादशा" : isGu ? "ચાલુ મહાદશા" : isTa ? "தற்போதைய தசா" : isTe ? "ప్రస్తుత దశ" : isBn ? "বর্তমান মহাদশা" : "Current Dasha",
    antar: isHi ? "अंतर्दशा" : isMr ? "अंतर्दशा" : isGu ? "અંતર્દશા" : isTa ? "புக்தி" : isTe ? "అంతర్దశ" : isBn ? "অন্তর্দশা" : "Antar",
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Lagna */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {labels.lagna}
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">
            {typeof d1Chart?.ascendant?.sign === "object"
              ? d1Chart.ascendant.sign.name || d1Chart.ascendant.sign.id
              : d1Chart?.ascendant?.sign || "Sagittarius (धनु)"}
          </div>
          <div className="text-xs text-slate-500 mt-0.5 font-mono">
            {d1Chart?.ascendant?.full_degree
              ? `${d1Chart.ascendant.full_degree.toFixed(2)}°`
              : d1Chart?.ascendant?.degree
              ? `${d1Chart.ascendant.degree.toFixed(2)}°`
              : "14.28°"}
          </div>
        </div>

        {/* Card 2: Vedic Moon Sign (Janma Rashi) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {labels.moonSign}
          </div>
          {(() => {
            const moonPlanet = planets.find(
              (p) =>
                p.id === "MOON" ||
                p.name_en === "Moon" ||
                p.name === "Moon" ||
                p.name === "चन्द्रमा" ||
                p.name === "चंद्रमा"
            );
            const moonSignName = moonPlanet
              ? typeof moonPlanet.sign === "object"
                ? moonPlanet.sign.name || moonPlanet.sign.id
                : moonPlanet.sign
              : typeof panchang?.moon_sign === "object"
              ? panchang.moon_sign.name
              : panchang?.moon_sign || "कन्या (Virgo)";
            const moonDeg = moonPlanet
              ? moonPlanet.norm_degree ??
                moonPlanet.degree_in_sign ??
                (moonPlanet.full_degree ? moonPlanet.full_degree % 30 : 0)
              : 0;
            const nakName =
              moonPlanet?.nakshatra?.name ||
              (typeof panchang?.nakshatra === "object"
                ? panchang?.nakshatra?.name
                : panchang?.nakshatra) ||
              "हस्त";
            return (
              <>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {moonSignName}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Nakshatra: <strong>{nakName}</strong> ({Number(moonDeg).toFixed(2)}°)
                </div>
              </>
            );
          })()}
        </div>

        {/* Card 3: Vedic Sun Sign (Surya Rashi) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {labels.sunSign}
          </div>
          {(() => {
            const sunPlanet = planets.find(
              (p) =>
                p.id === "SUN" ||
                p.name_en === "Sun" ||
                p.name === "Sun" ||
                p.name === "सूर्य"
            );
            const sunSignName = sunPlanet
              ? typeof sunPlanet.sign === "object"
                ? sunPlanet.sign.name || sunPlanet.sign.id
                : sunPlanet.sign
              : "कन्या (Virgo)";
            const sunDeg = sunPlanet
              ? sunPlanet.norm_degree ??
                sunPlanet.degree_in_sign ??
                (sunPlanet.full_degree ? sunPlanet.full_degree % 30 : 0)
              : 0;
            return (
              <>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {sunSignName}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 font-mono">
                  Vedic Sidereal ({Number(sunDeg).toFixed(2)}°)
                </div>
              </>
            );
          })()}
        </div>

        {/* Card 4: Current Dasha */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {labels.currentDasha}
          </div>
          {(() => {
            const mdName =
              currentDasha?.running_dasha?.mahadasha?.planet_name ||
              currentDasha?.running?.mahadasha ||
              "गुरु (Jupiter)";
            const adName =
              currentDasha?.running_dasha?.antardasha?.antardasha_name ||
              currentDasha?.running?.antardasha ||
              "गुरु";
            const pdName =
              currentDasha?.running_dasha?.pratyantar_dasha?.pratyantar_name ||
              currentDasha?.running?.pratyantar ||
              "";
            return (
              <>
                <div className="text-xl font-black text-indigo-600 mt-1">
                  {mdName}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {labels.antar}: <strong>{adName}</strong> {pdName ? `> ${pdName}` : ""}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Chart SVG + Today's Panchang Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SVG Chart Preview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Lagna Kundli (D1 Vector Chart)
              </h3>
              <p className="text-xs text-slate-500">
                Live vector SVG generated by Parashari Engine
              </p>
            </div>

            {/* North / South Indian Toggle in Overview */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
              <button
                onClick={() => {
                  setChartStyle("NORTH_INDIAN");
                  loadVargaSvg("D1", profile, "NORTH_INDIAN");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  chartStyle === "NORTH_INDIAN"
                    ? "bg-white text-indigo-700 shadow-2xs border border-indigo-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🔷</span>
                <span>North Indian (उत्तर)</span>
              </button>
              <button
                onClick={() => {
                  setChartStyle("SOUTH_INDIAN");
                  loadVargaSvg("D1", profile, "SOUTH_INDIAN");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  chartStyle === "SOUTH_INDIAN"
                    ? "bg-white text-indigo-700 shadow-2xs border border-indigo-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🟩</span>
                <span>South Indian (दक्षिण)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center p-2 bg-amber-50/20 rounded-xl border border-amber-100 min-h-[360px]">
            {vargaSvgMap[`D1_${chartStyle}`] ||
            (chartStyle === "NORTH_INDIAN"
              ? vargaSvgMap["D1"] || svgChartD1
              : null) ? (
              <div
                className="w-full max-w-[360px] aspect-square flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:drop-shadow-xs"
                dangerouslySetInnerHTML={{
                  __html:
                    vargaSvgMap[`D1_${chartStyle}`] ||
                    vargaSvgMap["D1"] ||
                    svgChartD1,
                }}
              />
            ) : vargaLoading ? (
              <div className="text-xs text-slate-400 font-mono py-20 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span>
                  Rendering{" "}
                  {chartStyle === "SOUTH_INDIAN" ? "South Indian" : "North Indian"}{" "}
                  Kundli SVG...
                </span>
              </div>
            ) : (
              <div className="text-center space-y-2 py-10">
                <p className="text-xs text-slate-500">Vector SVG not rendered yet.</p>
                <button
                  onClick={() => loadVargaSvg("D1", profile, chartStyle)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                >
                  Load D1 ({chartStyle === "SOUTH_INDIAN" ? "South Indian" : "North Indian"})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Panchang & Day Energy */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Today's Panchang &amp; Muhurat
              </h3>
              <p className="text-xs text-slate-500">The 5 sacred limbs of Vedic Time</p>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Module 2 Live
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">
                Tithi
              </span>
              <strong className="text-slate-900 font-semibold">
                {panchang?.tithi?.name || "Shukla Pratipada"}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">
                Nakshatra
              </span>
              <strong className="text-slate-900 font-semibold">
                {panchang?.nakshatra?.name || "Rohini"}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">
                Yoga
              </span>
              <strong className="text-slate-900 font-semibold">
                {panchang?.yoga?.name || "Siddhi Yoga"}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">
                Karana
              </span>
              <strong className="text-slate-900 font-semibold">
                {panchang?.karana?.name || "Bava"}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">
                Vaar (Day)
              </span>
              <strong className="text-slate-900 font-semibold">
                {typeof panchang?.vaar === "object"
                  ? panchang.vaar.name || panchang.vaar.id
                  : panchang?.vaar || "Thursday (गुरुवार)"}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-900">
              <span className="text-rose-500 text-[10px] uppercase font-bold block">
                Rahu Kaal
              </span>
              <strong className="font-semibold">
                {panchang?.rahu_kaal || "13:30 - 15:00"}
              </strong>
            </div>
          </div>

          {/* Dosha Badges */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Dosha Snapshot:
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                  manglikData?.is_manglik
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                {manglikData?.is_manglik
                  ? "Manglik Dosha Present"
                  : manglikData?.is_cancelled
                  ? "Manglik Dosha (Cancelled/भंग)"
                  : "No Manglik Dosha"}
              </span>

              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                  kaalSarpData?.has_kaal_sarp
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                {kaalSarpData?.has_kaal_sarp
                  ? `Kaal Sarp: ${kaalSarpData.type}`
                  : "Kaal Sarp Free"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
