"use client";

import React from "react";
import { Clock, ArrowLeft, ChevronRight, Loader2 } from "lucide-react";

interface DashaTabProps {
  currentDasha: any;
  dashaDrillLevel: number;
  navigateDashaBreadcrumb: (targetLevel: number) => void;
  selectedMdObj: any;
  selectedAdObj: any;
  selectedPdObj: any;
  selectedSdObj: any;
  drillLoading: boolean;
  fullMahadashas: any[];
  currentLevelList: any[];
  drillIntoAd: (md: any) => void;
  drillIntoPd: (ad: any) => void;
  drillIntoSd: (pd: any) => void;
  drillIntoPr: (sd: any) => void;
  yoginiDasha: any;
}

export const DashaTab: React.FC<DashaTabProps> = ({
  currentDasha,
  dashaDrillLevel,
  navigateDashaBreadcrumb,
  selectedMdObj,
  selectedAdObj,
  selectedPdObj,
  selectedSdObj,
  drillLoading,
  fullMahadashas,
  currentLevelList,
  drillIntoAd,
  drillIntoPd,
  drillIntoSd,
  drillIntoPr,
  yoginiDasha,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Running 5-Level Dasha Tree Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Vimshottari Real-Time Running Dasha (MD &gt; AD &gt; PD &gt; SD &gt; PR)
            </h3>
            <p className="text-xs text-slate-500">
              Exact live 5-level event timing tree calculated from Janma Nakshatra
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-indigo-600 text-white">
            Live Active Tree
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Hierarchy Sequence</div>
          <div className="text-xl sm:text-2xl font-black text-indigo-950 font-mono mt-1">
            {currentDasha?.running_dasha?.hierarchy ||
              `${currentDasha?.running_dasha?.mahadasha?.planet_name || "Jupiter"} > ${
                currentDasha?.running_dasha?.antardasha?.antardasha_name || "Jupiter"
              } > ${currentDasha?.running_dasha?.pratyantar_dasha?.pratyantar_name || "Jupiter"}`}
          </div>
          <div className="text-xs text-indigo-800 mt-2 flex flex-wrap gap-4">
            <span>
              <strong>Mahadasha:</strong>{" "}
              {currentDasha?.running_dasha?.mahadasha?.planet_name || "Jupiter (गुरु)"} (
              {currentDasha?.running_dasha?.mahadasha?.start_date || "-"} to{" "}
              {currentDasha?.running_dasha?.mahadasha?.end_date || "-"})
            </span>
            <span>
              <strong>Antardasha:</strong>{" "}
              {currentDasha?.running_dasha?.antardasha?.antardasha_name || "Jupiter (गुरु)"} (
              {currentDasha?.running_dasha?.antardasha?.start_date || "-"} to{" "}
              {currentDasha?.running_dasha?.antardasha?.end_date || "-"})
            </span>
          </div>
        </div>
      </div>

      {/* Interactive 5-Level Vimshottari Dasha Drilldown (MD -> AD -> PD -> SD -> PR) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        {/* Header & Level Tracker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>5-Level Vimshottari Dasha Suite (महादशा ➔ अंतर्दशा ➔ प्रत्यंतर्दशा ➔ सूक्ष्म ➔ प्राण)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any row to drill inside to the next level down to exact minute/second Prana timing. Use Back to return.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Current Depth:</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-600 text-white shadow-xs">
              {dashaDrillLevel === 1 && "Level 1: Mahadasha (120 Yrs)"}
              {dashaDrillLevel === 2 && "Level 2: Antardasha"}
              {dashaDrillLevel === 3 && "Level 3: Pratyantar"}
              {dashaDrillLevel === 4 && "Level 4: Sookshma"}
              {dashaDrillLevel === 5 && "Level 5: Prana (Exact Time)"}
            </span>
          </div>
        </div>

        {/* Interactive Breadcrumb Bar with Back Navigation Button */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
          {dashaDrillLevel > 1 && (
            <button
              onClick={() => navigateDashaBreadcrumb(dashaDrillLevel - 1)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold flex items-center gap-1.5 shadow-2xs transition"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
              <span>Back Step</span>
            </button>
          )}

          <button
            onClick={() => navigateDashaBreadcrumb(1)}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${
              dashaDrillLevel === 1 ? "bg-slate-900 text-white" : "hover:bg-slate-200 text-slate-700"
            }`}
          >
            1. Mahadasha
          </button>

          {dashaDrillLevel >= 2 && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button
                onClick={() => navigateDashaBreadcrumb(2)}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  dashaDrillLevel === 2 ? "bg-indigo-600 text-white" : "hover:bg-slate-200 text-slate-700"
                }`}
              >
                2. {selectedMdObj?.planet_name || (selectedMdObj?.planet_id === "JUPITER" ? "बृहस्पति / गुरु" : selectedMdObj?.planet_id || "MD")} (AD)
              </button>
            </>
          )}

          {dashaDrillLevel >= 3 && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button
                onClick={() => navigateDashaBreadcrumb(3)}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  dashaDrillLevel === 3 ? "bg-indigo-600 text-white" : "hover:bg-slate-200 text-slate-700"
                }`}
              >
                3. {selectedAdObj?.antardasha_name || (selectedAdObj?.antardasha === "JUPITER" ? "बृहस्पति / गुरु" : selectedAdObj?.antardasha || selectedAdObj?.planet)} (PD)
              </button>
            </>
          )}

          {dashaDrillLevel >= 4 && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button
                onClick={() => navigateDashaBreadcrumb(4)}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  dashaDrillLevel === 4 ? "bg-purple-600 text-white" : "hover:bg-slate-200 text-slate-700"
                }`}
              >
                4. {selectedPdObj?.pratyantar_name || (selectedPdObj?.pratyantar_planet === "MERCURY" ? "बुध" : selectedPdObj?.pratyantar_planet || selectedPdObj?.planet)} (SD)
              </button>
            </>
          )}

          {dashaDrillLevel >= 5 && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2.5 py-1 rounded-lg font-bold bg-purple-900 text-white">
                5. {selectedSdObj?.sookshma_name || selectedSdObj?.sookshma_planet || selectedSdObj?.planet} (PR)
              </span>
            </>
          )}
        </div>

        {/* Level Content Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {drillLoading ? (
            <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
              <span className="font-semibold text-slate-600">
                Calculating exact high-precision Dasha timing timestamps...
              </span>
            </div>
          ) : dashaDrillLevel === 1 ? (
            /* LEVEL 1: FULL 120-YEAR MAHADASHA TIMELINE TABLE */
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-4">Planet (महादशा स्वामी)</th>
                  <th className="py-3 px-4">Full Duration</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Drill Down</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {fullMahadashas.length > 0 ? (
                  fullMahadashas.map((m: any, idx: number) => (
                    <tr
                      key={idx}
                      onClick={() => drillIntoAd(m)}
                      className="hover:bg-indigo-50/60 cursor-pointer transition select-none group"
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-400">{m.order}</td>
                      <td className="py-3 px-4 font-sans font-bold text-slate-900 group-hover:text-indigo-600 flex items-center gap-2">
                        <span>{m.planet_name || m.planet_id}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{m.duration_years} Years</td>
                      <td className="py-3 px-4 text-slate-600">{m.start_date}</td>
                      <td className="py-3 px-4 text-slate-600">{m.end_date}</td>
                      <td className="py-3 px-4">
                        {m.is_birth_dasha ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Janma Dasha
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                            Full 120-Yr Cycle
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:underline">
                          <span>Open 9 Antardashas</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                      <span>Loading Vimshottari Mahadasha timeline...</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : dashaDrillLevel === 2 ? (
            /* LEVEL 2: 9 ANTARDASHAS TABLE */
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-indigo-50/50 border-b border-slate-200 text-indigo-900 text-[10px] uppercase font-bold">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-4">Antardasha (अंतर्दशा)</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Start Timestamp</th>
                  <th className="py-3 px-4">End Timestamp</th>
                  <th className="py-3 px-4 text-right">Drill Down</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {currentLevelList.map((ad: any, idx: number) => (
                  <tr
                    key={idx}
                    onClick={() => drillIntoPd(ad)}
                    className="hover:bg-indigo-50/60 cursor-pointer transition select-none group"
                  >
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-sans font-bold text-slate-900 group-hover:text-indigo-600">
                      {selectedMdObj?.planet_name || selectedMdObj?.planet_id} - {ad.antardasha_name || ad.antardasha || ad.planet}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {ad.duration_years
                        ? `${Number(ad.duration_years).toFixed(2)} Years`
                        : ad.duration_months
                        ? `${ad.duration_months} mo`
                        : "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{ad.start_datetime || ad.start_date}</td>
                    <td className="py-3 px-4 text-slate-600">{ad.end_datetime || ad.end_date}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:underline">
                        <span>Open 9 Pratyantardashas</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : dashaDrillLevel === 3 ? (
            /* LEVEL 3: 9 PRATYANTARDASHAS TABLE */
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-indigo-50/50 border-b border-slate-200 text-indigo-900 text-[10px] uppercase font-bold">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-4">Pratyantar (प्रत्यंतर्दशा)</th>
                  <th className="py-3 px-4">Start Time &amp; Date</th>
                  <th className="py-3 px-4">End Time &amp; Date</th>
                  <th className="py-3 px-4 text-right">Drill Down</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {currentLevelList.map((pd: any, idx: number) => (
                  <tr
                    key={idx}
                    onClick={() => drillIntoSd(pd)}
                    className="hover:bg-purple-50/60 cursor-pointer transition select-none group"
                  >
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-sans font-bold text-slate-900 group-hover:text-purple-600">
                      {pd.chain ||
                        `${selectedMdObj?.planet_name || "बृहस्पति"} - ${
                          selectedAdObj?.antardasha_name || selectedAdObj?.antardasha || "बृहस्पति"
                        } - ${pd.pratyantar_name || pd.planet}`}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{pd.start_datetime || `${pd.start_date} ${pd.start_time || ""}`}</td>
                    <td className="py-3 px-4 text-slate-600">{pd.end_datetime || `${pd.end_date} ${pd.end_time || ""}`}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 group-hover:underline">
                        <span>Open 9 Sookshma (SD)</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : dashaDrillLevel === 4 ? (
            /* LEVEL 4: 9 SOOKSHMA DASHAS TABLE (SD) WITH EXACT TIME */
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-purple-50 border-b border-purple-200 text-purple-900 text-[10px] uppercase font-bold">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-4">सूक्ष्म दशा स्वामी (Sookshma)</th>
                  <th className="py-3 px-4">अवधि (Duration)</th>
                  <th className="py-3 px-4">आरंभ दिनांक व समय</th>
                  <th className="py-3 px-4">समाप्ति दिनांक व समय</th>
                  <th className="py-3 px-4 text-right">Drill Down</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {currentLevelList.map((sd: any, idx: number) => (
                  <tr
                    key={idx}
                    onClick={() => drillIntoPr(sd)}
                    className="hover:bg-purple-100/60 cursor-pointer transition select-none group"
                  >
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-sans">
                      <span className="font-bold text-slate-900 group-hover:text-purple-700 block">
                        {sd.sookshma_name || sd.sookshma_planet}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {selectedMdObj?.planet_name || selectedMdObj?.planet_id} ›{" "}
                        {selectedAdObj?.antardasha_name || selectedAdObj?.antardasha} ›{" "}
                        {selectedPdObj?.pratyantar_name || selectedPdObj?.pratyantar_planet}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-sans">
                      {sd.duration_days != null ? (
                        <>
                          <span className="font-bold">{sd.duration_days}</span>
                          <span className="text-slate-400"> दिन</span>
                          {sd.duration_hours != null && (
                            <>
                              <br />
                              <span className="text-[10px] text-slate-500">{sd.duration_hours} घंटे</span>
                            </>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-semibold tabular-nums">{sd.start_datetime}</td>
                    <td className="py-3 px-4 text-slate-900 font-semibold tabular-nums">{sd.end_datetime}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 group-hover:underline">
                        <span>9 प्राण खोलें (PR)</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* LEVEL 5: 9 PRANA DASHAS TABLE (PR) DOWN TO EXACT HOUR/MINUTE/SECOND */
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-rose-50 border-b border-rose-200 text-rose-900 text-[10px] uppercase font-bold">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-4">प्राण दशा स्वामी (Prana)</th>
                  <th className="py-3 px-4">अवधि (घंटे)</th>
                  <th className="py-3 px-4">सटीक आरंभ (दिनांक व समय)</th>
                  <th className="py-3 px-4">सटीक समाप्ति (दिनांक व समय)</th>
                  <th className="py-3 px-4 text-right">परिशुद्धता</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {currentLevelList.map((pr: any, idx: number) => (
                  <tr key={idx} className="hover:bg-rose-50/50 transition select-none">
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-sans">
                      <span className="font-bold text-slate-900 block">{pr.prana_name || pr.prana_planet}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {selectedMdObj?.planet_name} ›{" "}
                        {selectedAdObj?.antardasha_name || selectedAdObj?.antardasha} ›{" "}
                        {selectedPdObj?.pratyantar_name || selectedPdObj?.pratyantar_planet} ›{" "}
                        {selectedSdObj?.sookshma_name || selectedSdObj?.sookshma_planet}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-sans tabular-nums">
                      {pr.duration_hours != null ? (
                        <>
                          <span className="font-bold">{pr.duration_hours}</span>
                          <span className="text-slate-400"> घंटे</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 text-rose-700 font-bold bg-rose-50/30 tabular-nums">{pr.start_datetime}</td>
                    <td className="py-3 px-4 text-rose-700 font-bold bg-rose-50/30 tabular-nums">{pr.end_datetime}</td>
                    <td className="py-3 px-4 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        सूक्ष्म स्तर ⚡
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 36-Year Yogini Dasha Cycle */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">36-Year Yogini Dasha System (Mangala to Sankata)</h3>
            <p className="text-xs text-slate-500">8 Sacred Yoginis and ruling planets governing life periods</p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-purple-50 text-purple-700">
            Module 4 — Yogini
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {(
            yoginiDasha?.periods?.slice(0, 8) || [
              { yogini: "Mangala", deity: "Mangala (Auspicious)", ruling_planet: "MOON", full_duration_years: 1 },
              { yogini: "Pingala", deity: "Pingala (Radiant)", ruling_planet: "SUN", full_duration_years: 2 },
              { yogini: "Dhanya", deity: "Dhanya (Abundant)", ruling_planet: "JUPITER", full_duration_years: 3 },
              { yogini: "Bhramari", deity: "Bhramari (Wandering)", ruling_planet: "MARS", full_duration_years: 4 },
              { yogini: "Bhadrika", deity: "Bhadrika (Gentle)", ruling_planet: "MERCURY", full_duration_years: 5 },
              { yogini: "Ulka", deity: "Ulka (Fiery)", ruling_planet: "SATURN", full_duration_years: 6 },
              { yogini: "Siddha", deity: "Siddha (Accomplished)", ruling_planet: "VENUS", full_duration_years: 7 },
              { yogini: "Sankata", deity: "Sankata (Crisis)", ruling_planet: "RAHU", full_duration_years: 8 },
            ]
          ).map((y: any, idx: number) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="font-black text-slate-900 text-xs">{y.yogini}</div>
              <div className="text-[11px] font-mono text-indigo-600 font-semibold mt-0.5">{y.full_duration_years} Years</div>
              <div className="text-[10px] text-slate-500 mt-1">{y.ruling_planet}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
