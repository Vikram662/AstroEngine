"use client";

import React from "react";
import { Sliders, Sun, Sparkles, Loader2 } from "lucide-react";

interface KpTabProps {
  kpChartSvg: string;
  kpRulingPlanets: any;
  kpPlanets: any[];
  kpCusps: any[];
  kpHorarySeed: number;
  kpHoraryData: any;
  kpHoraryLoading: boolean;
  kpLevel4Significators: any;
  kpSignificatorsData: any;
  onHorarySeedChange: (seed: number) => void;
}

export const KpTab: React.FC<KpTabProps> = ({
  kpChartSvg,
  kpRulingPlanets,
  kpPlanets,
  kpCusps,
  kpHorarySeed,
  kpHoraryData,
  kpHoraryLoading,
  kpLevel4Significators,
  kpSignificatorsData,
  onHorarySeedChange
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* KP Top Grid: Live KP Kundli SVG Chart & Ruling Planets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* KP Kundli Chart Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>KP Kundli Chart (केपी कुंडली)</span>
              </h3>
              <p className="text-[11px] text-slate-500">Placidus Unequal Houses &amp; Krishnamurti Ayanamsa</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Placidus SVG
            </span>
          </div>

          <div className="w-full max-w-[360px] aspect-square flex items-center justify-center bg-amber-50/20 rounded-xl border border-amber-100 p-2 shadow-inner">
            {kpChartSvg ? (
              <div
                className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:drop-shadow-xs"
                dangerouslySetInnerHTML={{ __html: kpChartSvg }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                <Sparkles className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-xs font-semibold">Generating KP Kundli SVG...</span>
              </div>
            )}
          </div>
          <div className="w-full mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>Ayanamsa: <b>Krishnamurti (KP)</b></span>
            <span>Houses: <b>Placidus System</b></span>
          </div>
        </div>

        {/* KP Ruling Planets & Key Significance */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>KP Ruling Planets (सत्तारूढ़ ग्रह)</span>
                </h3>
                <p className="text-[11px] text-slate-500">Essential determinants for event timing, Prashna (Horary) &amp; sub-lord verification</p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Endpoint 43 Live
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
              {(kpRulingPlanets?.ruling_planets_ordered || [
                { position: "Ascendant Sign Lord", planet: "Mercury" },
                { position: "Ascendant Star Lord", planet: "Moon" },
                { position: "Moon Sign Lord", planet: "Saturn" },
                { position: "Moon Star Lord", planet: "Mars" },
                { position: "Day Lord (Vaara Lord)", planet: "Jupiter" }
              ]).map((rp: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">{rp.position}</span>
                  <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                    {rp.planet}
                  </span>
                </div>
              ))}
            </div>

            {kpRulingPlanets?.usage_guidance && (
              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-3 italic">
                💡 {kpRulingPlanets.usage_guidance}
              </p>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
            <Sliders className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950">
              <span className="font-bold block">Krishnamurti Paddhati Principle:</span>
              KP eliminates sign-based ambiguity by relying on the <b>Sub-Lord (उप-स्वामी)</b>. A planet gives the results of its Constellation Lord (Star Lord) as modified by its own Sub-Lord.
            </div>
          </div>
        </div>
      </div>

      {/* KP Planets Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">KP Stellar Sub-Lord Table (Module 5 — Endpoint 39)</h3>
            <p className="text-xs text-slate-500">Sign Lord, Star Lord, and Sub-Lord for 9 Grahas</p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-semibold">
            Krishnamurti Paddhati
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                <th className="py-3 px-4">Planet</th>
                <th className="py-3 px-4">Longitude</th>
                <th className="py-3 px-4">Sign</th>
                <th className="py-3 px-4">Sign Lord (राशीश)</th>
                <th className="py-3 px-4">Star Lord (नक्षत्रेश)</th>
                <th className="py-3 px-4">Sub-Lord (उप-स्वामी)</th>
                <th className="py-3 px-4">Motion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(kpPlanets.length > 0 ? kpPlanets : [
                { name: "Sun", degree_in_sign: 14.48, sign: "Virgo", sign_lord: "Mercury", star_lord: "Moon", sub_lord: "Jupiter", is_retrograde: false },
                { name: "Moon", degree_in_sign: 22.15, sign: "Capricorn", sign_lord: "Saturn", star_lord: "Mars", sub_lord: "Venus", is_retrograde: false },
                { name: "Mars", degree_in_sign: 8.30, sign: "Scorpio", sign_lord: "Mars", star_lord: "Saturn", sub_lord: "Mercury", is_retrograde: false },
                { name: "Jupiter", degree_in_sign: 19.12, sign: "Sagittarius", sign_lord: "Jupiter", star_lord: "Ketu", sub_lord: "Sun", is_retrograde: true },
              ]).map((p: any, idx: number) => {
                const planetLabel = p.planet_name || p.name || p.planet_id || "Planet";
                const signLabel = typeof p.sign === "object" ? (p.sign?.name || p.sign?.id || "") : String(p.sign || "");
                const degStr = p.degree_in_sign != null ? `${Number(p.degree_in_sign).toFixed(2)}°` : "-";
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{planetLabel}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{degStr}</td>
                    <td className="py-3 px-4 text-slate-700">{signLabel}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{p.sign_lord}</td>
                    <td className="py-3 px-4 text-indigo-700 font-semibold">{p.star_lord}</td>
                    <td className="py-3 px-4 font-black text-purple-700 bg-purple-50/50">{p.sub_lord}</td>
                    <td className="py-3 px-4">
                      {p.is_retrograde ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          वक्री (R)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold">Direct</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* KP Placidus 12 House Cusps */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">KP Placidus 12 House Cusps &amp; Sub-Lords (Module 5 — Endpoint 40)</h3>
            <p className="text-xs text-slate-500">Exact unequal Bhava beginnings for high-precision event timing</p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
            12 Cusps
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {(kpCusps.length > 0 ? kpCusps : Array.from({ length: 12 }, (_, i) => ({
            house: i + 1,
            cusp: i + 1,
            degree: (i * 30 + 14.5).toFixed(2),
            sign: "Sign " + (i + 1),
            sign_lord: "Lord",
            star_lord: "Star",
            sub_lord: ["Jupiter", "Saturn", "Mercury", "Venus", "Sun", "Moon"][i % 6]
          }))).map((c: any, idx: number) => {
            const cuspSign = typeof c.sign === "object" ? (c.sign?.name || c.sign?.id || "") : String(c.sign || "");
            const cuspDeg = c.degree_in_sign != null ? Number(c.degree_in_sign).toFixed(2) : (c.degree || "0.00");
            return (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:border-indigo-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold block">Bhava {c.cusp || c.house || idx + 1}</span>
                  <span className="text-[9px] font-mono text-slate-400">{c.sign_lord}</span>
                </div>
                <div className="font-bold text-slate-900 mt-0.5">{cuspSign}</div>
                <div className="font-mono text-slate-500 text-[11px]">{cuspDeg}°</div>
                <div className="text-[10px] text-slate-600 mt-1 font-medium">Star: {c.star_lord}</div>
                <div className="text-[10px] text-purple-700 font-bold">Sub: {c.sub_lord}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KP Horary 1 to 249 Interactive Calculator (Module 5 — Endpoint 44) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>🔮</span>
              <span>KP Horary (Prashna Kundli / प्रश्न ज्योतिष - Seed 1 to 249)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Krishnamurti 249 Sub-Lord division for immediate query resolution
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700">
            Endpoint 44 Live
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-700">Select Prashna Seed (1–249):</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {[1, 27, 72, 108, 144, 216, 249].map((seed) => (
              <button
                key={seed}
                onClick={() => onHorarySeedChange(seed)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                  kpHorarySeed === seed
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                #{seed}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-xs text-slate-500">Custom Seed:</span>
            <input
              type="number"
              min={1}
              max={249}
              value={kpHorarySeed}
              onChange={(e) => onHorarySeedChange(parseInt(e.target.value) || 1)}
              className="w-20 px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {kpHoraryLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Calculating KP Horary Arc for Seed #{kpHorarySeed}...</span>
          </div>
        ) : kpHoraryData?.horary_ascendant ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Horary Sign</span>
              <strong className="text-slate-900 font-bold mt-0.5 block">{kpHoraryData.horary_ascendant.sign}</strong>
              <span className="text-[10px] text-slate-500 font-mono">{kpHoraryData.horary_ascendant.degree}°</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Sign Lord</span>
              <strong className="text-slate-800 font-bold mt-0.5 block">{kpHoraryData.horary_ascendant.sign_lord}</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Star Lord</span>
              <strong className="text-indigo-700 font-bold mt-0.5 block">{kpHoraryData.horary_ascendant.star_lord}</strong>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
              <span className="text-purple-600 text-[10px] uppercase font-bold block">Sub-Lord (Decision)</span>
              <strong className="text-purple-900 font-black mt-0.5 block">{kpHoraryData.horary_ascendant.sub_lord}</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Zodiac Span</span>
              <strong className="text-slate-700 font-mono text-[11px] mt-0.5 block">
                {kpHoraryData.horary_ascendant.arc_start}° - {kpHoraryData.horary_ascendant.arc_end}°
              </strong>
            </div>
          </div>
        ) : null}
      </div>

      {/* 4-Grade (A/B/C/D) Significator Grid (Module 5 — Endpoint 41) */}
      {kpLevel4Significators && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">4-Grade KP Significator Table (Grades A, B, C, D)</h3>
              <p className="text-xs text-slate-500">Grade A (Star of Occupant) &gt; Grade B (Occupant) &gt; Grade C (Star of Lord) &gt; Grade D (House Lord)</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700">Endpoint 41 Live</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((houseNum) => {
              const hKey = `house_${houseNum}`;
              const hData = (kpLevel4Significators && (
                kpLevel4Significators[hKey] || 
                kpLevel4Significators[`House_${houseNum}`] || 
                kpLevel4Significators?.houses?.[`House_${houseNum}`] || 
                kpLevel4Significators?.houses?.[hKey] || 
                kpLevel4Significators[String(houseNum)]
              )) || {};

              const formatGrade = (val: any) => {
                if (Array.isArray(val) && val.length > 0) return val.join(", ");
                if (typeof val === "string" && val.trim().length > 0) return val;
                return "—";
              };

              const gA = formatGrade(hData.grade_a ?? hData.grade_a_strongest);
              const gB = formatGrade(hData.grade_b ?? hData.grade_b_occupants);
              const gC = formatGrade(hData.grade_c ?? hData.grade_c_lord_stars);
              const gD = formatGrade(hData.grade_d ?? hData.grade_d_house_lord ?? hData.sign_lord);

              return (
                <div key={houseNum} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 hover:border-indigo-300 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-700 uppercase">BHAVA {houseNum}</span>
                    <span className="text-[9px] font-mono text-slate-400">H{houseNum}</span>
                  </div>
                  <div className="space-y-1 text-[10px]">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-bold text-slate-500">A:</span> 
                      <span className={`font-semibold truncate ${gA !== "—" ? "text-indigo-700 font-bold" : "text-slate-400"}`}>{gA}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-bold text-slate-500">B:</span> 
                      <span className={`font-semibold truncate ${gB !== "—" ? "text-emerald-700 font-bold" : "text-slate-400"}`}>{gB}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-bold text-slate-500">C:</span> 
                      <span className={`font-semibold truncate ${gC !== "—" ? "text-amber-700 font-bold" : "text-slate-400"}`}>{gC}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-bold text-slate-500">D:</span> 
                      <span className={`font-semibold truncate ${gD !== "—" ? "text-purple-700 font-bold" : "text-slate-400"}`}>{gD}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Standard House Significators */}
      {kpSignificatorsData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">KP House Significators — All 12 Houses</h3>
              <p className="text-xs text-slate-500">Planets that signify each house (direct + via star lord)</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700">KP System</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            {Object.entries(kpSignificatorsData).map(([house, planets]: [string, any], idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{house.replace("_", " ")}</span>
                <div className="font-bold text-slate-800 mt-1">
                  {Array.isArray(planets) ? planets.join(", ") : String(planets || "—")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
