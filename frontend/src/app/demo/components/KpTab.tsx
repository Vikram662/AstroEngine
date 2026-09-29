"use client";

import React from "react";
import { Sliders, Sun, Sparkles, Loader2 } from "lucide-react";
import type { ApiData } from "@/lib/apiTypes";

interface KpTabProps {
  kpChartSvg: string;
  kpRulingPlanets: ApiData;
  kpPlanets: ApiData[];
  kpCusps: ApiData[];
  kpHorarySeed: number;
  kpHoraryData: ApiData;
  kpHoraryLoading: boolean;
  kpLevel4Significators: ApiData;
  kpSignificatorsData: ApiData;
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
        <div className="lg:col-span-5 bg-white rounded-lg border border-line shadow-xs p-5 flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm text-ink flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-accent" />
                <span>KP Kundli Chart (केपी कुंडली)</span>
              </h3>
              <p className="text-[11px] text-ink-soft">Placidus Unequal Houses &amp; Krishnamurti Ayanamsa</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent-soft text-accent-hover border border-accent/30">
              Placidus SVG
            </span>
          </div>

          <div className="w-full max-w-[360px] aspect-square flex items-center justify-center bg-amber-50/20 rounded-md border border-amber-100 p-2 shadow-inner">
            {kpChartSvg ? (
              <div
                className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:drop-shadow-xs"
                dangerouslySetInnerHTML={{ __html: kpChartSvg }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-ink-muted gap-2">
                <Sparkles className="w-6 h-6 animate-spin text-accent" />
                <span className="text-xs font-semibold">Generating KP Kundli SVG...</span>
              </div>
            )}
          </div>
          <div className="w-full mt-3 flex items-center justify-between text-[11px] text-ink-soft px-1">
            <span>Ayanamsa: <b>Krishnamurti (KP)</b></span>
            <span>Houses: <b>Placidus System</b></span>
          </div>
        </div>

        {/* KP Ruling Planets & Key Significance */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-line shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-bold text-sm text-ink flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>KP Ruling Planets (सत्तारूढ़ ग्रह)</span>
                </h3>
                <p className="text-[11px] text-ink-soft">Essential determinants for event timing, Prashna (Horary) &amp; sub-lord verification</p>
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
              ]).map((rp: ApiData, idx: number) => (
                <div key={idx} className="p-2.5 rounded-md bg-surface border border-line flex items-center justify-between">
                  <span className="text-xs text-ink-soft font-medium">{rp.position}</span>
                  <span className="text-xs font-semibold text-accent-hover bg-accent-soft px-2.5 py-0.5 rounded-md border border-accent/20">
                    {rp.planet}
                  </span>
                </div>
              ))}
            </div>

            {kpRulingPlanets?.usage_guidance && (
              <p className="text-[11px] text-ink-soft bg-surface p-2.5 rounded-lg border border-line mt-3 italic">
                💡 {kpRulingPlanets.usage_guidance}
              </p>
            )}
          </div>

          <div className="p-3.5 rounded-md bg-accent-soft/60 border border-accent/20 flex items-start gap-3">
            <Sliders className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="text-xs text-ink">
              <span className="font-bold block">Krishnamurti Paddhati Principle:</span>
              KP eliminates sign-based ambiguity by relying on the <b>Sub-Lord (उप-स्वामी)</b>. A planet gives the results of its Constellation Lord (Star Lord) as modified by its own Sub-Lord.
            </div>
          </div>
        </div>
      </div>

      {/* KP Planets Table */}
      <div className="bg-white rounded-lg border border-line shadow-xs overflow-hidden">
        <div className="p-5 border-b border-line flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-ink">KP Stellar Sub-Lord Table (Module 5 — Endpoint 39)</h3>
            <p className="text-xs text-ink-soft">Sign Lord, Star Lord, and Sub-Lord for 9 Grahas</p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-surface-alt text-ink font-semibold">
            Krishnamurti Paddhati
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface border-b border-line text-ink-soft text-[10px] uppercase font-bold">
                <th className="py-3 px-4">Planet</th>
                <th className="py-3 px-4">Longitude</th>
                <th className="py-3 px-4">Sign</th>
                <th className="py-3 px-4">Sign Lord (राशीश)</th>
                <th className="py-3 px-4">Star Lord (नक्षत्रेश)</th>
                <th className="py-3 px-4">Sub-Lord (उप-स्वामी)</th>
                <th className="py-3 px-4">Motion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(kpPlanets.length > 0 ? kpPlanets : [
                { name: "Sun", degree_in_sign: 14.48, sign: "Virgo", sign_lord: "Mercury", star_lord: "Moon", sub_lord: "Jupiter", is_retrograde: false },
                { name: "Moon", degree_in_sign: 22.15, sign: "Capricorn", sign_lord: "Saturn", star_lord: "Mars", sub_lord: "Venus", is_retrograde: false },
                { name: "Mars", degree_in_sign: 8.30, sign: "Scorpio", sign_lord: "Mars", star_lord: "Saturn", sub_lord: "Mercury", is_retrograde: false },
                { name: "Jupiter", degree_in_sign: 19.12, sign: "Sagittarius", sign_lord: "Jupiter", star_lord: "Ketu", sub_lord: "Sun", is_retrograde: true },
              ]).map((p: ApiData, idx: number) => {
                const planetLabel = p.planet_name || p.name || p.planet_id || "Planet";
                const signLabel = typeof p.sign === "object" ? (p.sign?.name || p.sign?.id || "") : String(p.sign || "");
                const degStr = p.degree_in_sign != null ? `${Number(p.degree_in_sign).toFixed(2)}°` : "-";
                return (
                  <tr key={idx} className="hover:bg-surface transition">
                    <td className="py-3 px-4 font-bold text-ink">{planetLabel}</td>
                    <td className="py-3 px-4 font-mono text-ink-soft">{degStr}</td>
                    <td className="py-3 px-4 text-ink">{signLabel}</td>
                    <td className="py-3 px-4 font-medium text-ink">{p.sign_lord}</td>
                    <td className="py-3 px-4 text-accent-hover font-semibold">{p.star_lord}</td>
                    <td className="py-3 px-4 font-semibold text-accent-hover bg-accent-soft/50">{p.sub_lord}</td>
                    <td className="py-3 px-4">
                      {p.is_retrograde ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          वक्री (R)
                        </span>
                      ) : (
                        <span className="text-[10px] text-ink-muted font-semibold">Direct</span>
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
      <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-ink">KP Placidus 12 House Cusps &amp; Sub-Lords (Module 5 — Endpoint 40)</h3>
            <p className="text-xs text-ink-soft">Exact unequal Bhava beginnings for high-precision event timing</p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-surface-alt text-ink">
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
          }))).map((c: ApiData, idx: number) => {
            const cuspSign = typeof c.sign === "object" ? (c.sign?.name || c.sign?.id || "") : String(c.sign || "");
            const cuspDeg = c.degree_in_sign != null ? Number(c.degree_in_sign).toFixed(2) : (c.degree || "0.00");
            return (
              <div key={idx} className="p-3 rounded-md bg-surface border border-line text-xs hover:border-accent/40 transition">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-ink-muted font-bold block">Bhava {c.cusp || c.house || idx + 1}</span>
                  <span className="text-[9px] font-mono text-ink-muted">{c.sign_lord}</span>
                </div>
                <div className="font-bold text-ink mt-0.5">{cuspSign}</div>
                <div className="font-mono text-ink-soft text-[11px]">{cuspDeg}°</div>
                <div className="text-[10px] text-ink-soft mt-1 font-medium">Star: {c.star_lord}</div>
                <div className="text-[10px] text-accent-hover font-bold">Sub: {c.sub_lord}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KP Horary 1 to 249 Interactive Calculator (Module 5 — Endpoint 44) */}
      <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
          <div>
            <h3 className="font-bold text-sm text-ink flex items-center gap-2">
              <span>🔮</span>
              <span>KP Horary (Prashna Kundli / प्रश्न ज्योतिष - Seed 1 to 249)</span>
            </h3>
            <p className="text-xs text-ink-soft mt-0.5">
              Krishnamurti 249 Sub-Lord division for immediate query resolution
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-accent-soft text-accent-hover">
            Endpoint 44 Live
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-ink">Select Prashna Seed (1–249):</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {[1, 27, 72, 108, 144, 216, 249].map((seed) => (
              <button
                key={seed}
                onClick={() => onHorarySeedChange(seed)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                  kpHorarySeed === seed
                    ? "bg-accent text-white shadow-xs"
                    : "bg-surface-alt text-ink hover:bg-line"
                }`}
              >
                #{seed}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-xs text-ink-soft">Custom Seed:</span>
            <input
              type="number"
              min={1}
              max={249}
              value={kpHorarySeed}
              onChange={(e) => onHorarySeedChange(parseInt(e.target.value) || 1)}
              className="w-20 px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-line focus:outline-hidden focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {kpHoraryLoading ? (
          <div className="p-8 text-center text-ink-muted text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
            <span>Calculating KP Horary Arc for Seed #{kpHorarySeed}...</span>
          </div>
        ) : kpHoraryData?.horary_ascendant ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs pt-2">
            <div className="p-3 rounded-md bg-surface border border-line">
              <span className="text-ink-muted text-[10px] uppercase font-bold block">Horary Sign</span>
              <strong className="text-ink font-bold mt-0.5 block">{kpHoraryData.horary_ascendant.sign}</strong>
              <span className="text-[10px] text-ink-soft font-mono">{kpHoraryData.horary_ascendant.degree}°</span>
            </div>
            <div className="p-3 rounded-md bg-surface border border-line">
              <span className="text-ink-muted text-[10px] uppercase font-bold block">Sign Lord</span>
              <strong className="text-ink font-bold mt-0.5 block">{kpHoraryData.horary_ascendant.sign_lord}</strong>
            </div>
            <div className="p-3 rounded-md bg-surface border border-line">
              <span className="text-ink-muted text-[10px] uppercase font-bold block">Star Lord</span>
              <strong className="text-accent-hover font-bold mt-0.5 block">{kpHoraryData.horary_ascendant.star_lord}</strong>
            </div>
            <div className="p-3 rounded-md bg-accent-soft border border-accent/30">
              <span className="text-accent text-[10px] uppercase font-bold block">Sub-Lord (Decision)</span>
              <strong className="text-ink font-semibold mt-0.5 block">{kpHoraryData.horary_ascendant.sub_lord}</strong>
            </div>
            <div className="p-3 rounded-md bg-surface border border-line">
              <span className="text-ink-muted text-[10px] uppercase font-bold block">Zodiac Span</span>
              <strong className="text-ink font-mono text-[11px] mt-0.5 block">
                {kpHoraryData.horary_ascendant.arc_start}° - {kpHoraryData.horary_ascendant.arc_end}°
              </strong>
            </div>
          </div>
        ) : null}
      </div>

      {/* 4-Grade (A/B/C/D) Significator Grid (Module 5 — Endpoint 41) */}
      {kpLevel4Significators && (
        <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="font-bold text-sm text-ink">4-Grade KP Significator Table (Grades A, B, C, D)</h3>
              <p className="text-xs text-ink-soft">Grade A (Star of Occupant) &gt; Grade B (Occupant) &gt; Grade C (Star of Lord) &gt; Grade D (House Lord)</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-surface-alt text-ink">Endpoint 41 Live</span>
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

              const formatGrade = (val: ApiData) => {
                if (Array.isArray(val) && val.length > 0) return val.join(", ");
                if (typeof val === "string" && val.trim().length > 0) return val;
                return "—";
              };

              const gA = formatGrade(hData.grade_a ?? hData.grade_a_strongest);
              const gB = formatGrade(hData.grade_b ?? hData.grade_b_occupants);
              const gC = formatGrade(hData.grade_c ?? hData.grade_c_lord_stars);
              const gD = formatGrade(hData.grade_d ?? hData.grade_d_house_lord ?? hData.sign_lord);

              return (
                <div key={houseNum} className="p-3 rounded-md bg-surface border border-line space-y-1.5 hover:border-accent/40 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-accent-hover uppercase">BHAVA {houseNum}</span>
                    <span className="text-[9px] font-mono text-ink-muted">H{houseNum}</span>
                  </div>
                  <div className="space-y-1 text-[10px]">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-bold text-ink-soft">A:</span> 
                      <span className={`font-semibold truncate ${gA !== "—" ? "text-accent-hover font-bold" : "text-ink-muted"}`}>{gA}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-bold text-ink-soft">B:</span> 
                      <span className={`font-semibold truncate ${gB !== "—" ? "text-emerald-700 font-bold" : "text-ink-muted"}`}>{gB}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-bold text-ink-soft">C:</span> 
                      <span className={`font-semibold truncate ${gC !== "—" ? "text-amber-700 font-bold" : "text-ink-muted"}`}>{gC}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-bold text-ink-soft">D:</span> 
                      <span className={`font-semibold truncate ${gD !== "—" ? "text-accent-hover font-bold" : "text-ink-muted"}`}>{gD}</span>
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
        <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="font-bold text-sm text-ink">KP House Significators — All 12 Houses</h3>
              <p className="text-xs text-ink-soft">Planets that signify each house (direct + via star lord)</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-accent-soft text-accent-hover">KP System</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            {Object.entries(kpSignificatorsData).map(([house, planets]: [string, ApiData], idx) => (
              <div key={idx} className="p-3 rounded-md bg-surface border border-line">
                <span className="text-[10px] font-bold text-ink-muted uppercase">{house.replace("_", " ")}</span>
                <div className="font-bold text-ink mt-1">
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
