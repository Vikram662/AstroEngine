"use client";

import React from "react";
import type { ApiData } from "@/lib/apiTypes";

interface PlanetsTabProps {
  planets: ApiData[];
  sunMoonTimings?: ApiData;
  retrogradeData?: ApiData;
  ayanamsaData?: ApiData;
  houseCusps?: ApiData;
}

export const PlanetsTab: React.FC<PlanetsTabProps> = ({
  planets,
  sunMoonTimings,
  retrogradeData,
  ayanamsaData,
  houseCusps,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Planetary Ephemeris Table */}
      <div className="bg-white rounded-lg border border-line shadow-xs overflow-hidden">
        <div className="p-5 border-b border-line flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-ink">Planetary Ephemeris Table (Graha Sphuta)</h3>
            <p className="text-xs text-ink-soft">Calculated with Swiss Ephemeris C-bindings</p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-surface-alt text-ink font-semibold">
            Lahiri Ayanamsa
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface/80 border-b border-line text-ink-soft text-[10px] uppercase font-bold">
                <th className="py-3 px-4">Planet (ग्रह)</th>
                <th className="py-3 px-4">Sign (राशि)</th>
                <th className="py-3 px-4">Longitude (डिग्री)</th>
                <th className="py-3 px-4">Nakshatra</th>
                <th className="py-3 px-4">Pada</th>
                <th className="py-3 px-4">House (भाव)</th>
                <th className="py-3 px-4">Motion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {planets.map((p, idx) => (
                <tr key={idx} className="hover:bg-surface/50 transition">
                  <td className="py-3 px-4 font-bold text-ink flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent"></span>
                    {p.name}
                  </td>
                  <td className="py-3 px-4 text-ink font-medium">
                    {typeof p.sign === "object" ? (p.sign?.name || p.sign?.id || "") : String(p.sign || "")}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-ink">
                    {typeof p.degree === "number" ? `${p.degree.toFixed(2)}°` : `${p.longitude?.toFixed(2) || "0.00"}°`}
                  </td>
                  <td className="py-3 px-4 text-ink">
                    {p.nakshatra?.name || p.nakshatra || "-"}
                  </td>
                  <td className="py-3 px-4 font-mono text-ink-soft">
                    {p.nakshatra?.pada || p.pada || "1"}
                  </td>
                  <td className="py-3 px-4 font-bold text-ink">
                    {p.house || "-"}
                  </td>
                  <td className="py-3 px-4">
                    {p.is_retrograde ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Retrograde (वक्र)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Direct (मार्गी)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Core Astronomy Extras (Sun & Moon Timings, Retrograde, Ayanamsa, House Cusps) */}
      {(sunMoonTimings || retrogradeData || ayanamsaData || houseCusps) && (
        <div className="space-y-6 pt-2">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">🌐 Core Astronomy Extras</h2>

          {/* Sun & Moon Timings */}
          {sunMoonTimings && (
            <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="font-bold text-sm text-ink">Sun &amp; Moon Daily Timings</h3>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-50 text-amber-700">Core API</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Sunrise", val: sunMoonTimings.sunrise || sunMoonTimings.sun_rise, icon: "🌅" },
                  { label: "Sunset", val: sunMoonTimings.sunset || sunMoonTimings.sun_set, icon: "🌇" },
                  { label: "Moonrise", val: sunMoonTimings.moonrise || sunMoonTimings.moon_rise, icon: "🌕" },
                  { label: "Moonset", val: sunMoonTimings.moonset || sunMoonTimings.moon_set, icon: "🌑" },
                ].map((t, i) => (
                  <div key={i} className="p-4 rounded-md bg-surface border border-line text-center">
                    <div className="text-2xl mb-1">{t.icon}</div>
                    <div className="text-[10px] uppercase font-bold text-ink-muted">{t.label}</div>
                    <div className="font-semibold text-ink text-sm mt-0.5 font-mono">{t.val || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Retrograde Status */}
          {retrogradeData && (
            <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <h3 className="font-bold text-sm text-ink">Currently Retrograde Planets (वक्री ग्रह)</h3>
                  <p className="text-xs text-ink-soft">Planets currently in backward apparent motion</p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-surface-alt text-ink">Core API</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {(Array.isArray(retrogradeData?.retrograde_planets)
                  ? retrogradeData.retrograde_planets
                  : Array.isArray(retrogradeData)
                  ? retrogradeData
                  : []
                ).map((rp: ApiData, i: number) => (
                  <div key={i} className="px-4 py-2.5 rounded-md bg-amber-50 border border-amber-200 text-center">
                    <div className="text-xs font-semibold text-amber-900">{rp.planet || rp.name || rp}</div>
                    {rp.degree && <div className="text-[10px] font-mono text-amber-700">{Number(rp.degree).toFixed(2)}°</div>}
                    <div className="text-[10px] text-amber-600 mt-0.5">⟳ Vakri</div>
                  </div>
                ))}
                {!retrogradeData?.retrograde_planets?.length && !Array.isArray(retrogradeData) && (
                  <div className="text-sm text-emerald-600 font-bold p-3 bg-emerald-50 rounded-md border border-emerald-200">
                    ✓ No planets currently retrograde
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ayanamsa Comparison */}
          {ayanamsaData && (
            <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <h3 className="font-bold text-sm text-ink">Ayanamsa Comparison (अयनांश)</h3>
                  <p className="text-xs text-ink-soft">All major ayanamsa values — Lahiri, Raman, KP, Yukteshwar etc.</p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-surface-alt text-ink">Core API</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(() => {
                  const raw = ayanamsaData?.ayanamsas ?? ayanamsaData;
                  const list = Array.isArray(raw)
                    ? raw
                    : typeof raw === "object" && raw !== null
                    ? Object.entries(raw)
                        .filter(([k]) => !["status", "message", "julian_day"].includes(k))
                        .map(([k, v]) => ({ name: k, value: typeof v === "object" ? JSON.stringify(v) : v }))
                    : [];
                  return list.map((a: ApiData, i: number) => (
                    <div key={i} className="p-3 rounded-md bg-surface border border-line text-center">
                      <div className="text-[10px] uppercase font-bold text-ink-muted truncate">{a.name || a.system}</div>
                      <div className="font-semibold text-ink text-sm mt-0.5 font-mono">
                        {typeof a.value === "number" ? `${a.value.toFixed(4)}°` : String(a.value ?? "—")}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* House Cusps */}
          {houseCusps && (
            <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <h3 className="font-bold text-sm text-ink">House Cusps (भाव संधि)</h3>
                  <p className="text-xs text-ink-soft">
                    Exact cusp degree of all 12 houses
                    {houseCusps?.house_system ? ` • System: ${houseCusps.house_system}` : ""}
                    {houseCusps?.ascendant?.sign ? ` • Asc: ${houseCusps.ascendant.sign}` : ""}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-surface-alt text-ink">Core API</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {(Array.isArray(houseCusps?.houses)
                  ? houseCusps.houses
                  : Array.isArray(houseCusps?.cusps)
                  ? houseCusps.cusps
                  : Array.isArray(houseCusps)
                  ? houseCusps
                  : []
                ).map((c: ApiData, i: number) => {
                  const hNum = c.house || i + 1;
                  const deg =
                    c.degree_in_sign != null
                      ? c.degree_in_sign
                      : c.full_degree != null
                      ? c.full_degree % 30
                      : c.degree;
                  const signName = typeof c.sign === "object" ? c.sign?.name || c.sign?.id || "" : c.sign || "";
                  const nakName = typeof c.nakshatra === "object" ? c.nakshatra?.name || "" : c.nakshatra || "";

                  return (
                    <div key={i} className="p-3 rounded-md bg-surface border border-line text-center space-y-0.5">
                      <div className="text-[10px] uppercase font-bold text-ink-muted">House {hNum}</div>
                      <div className="font-semibold text-ink text-sm font-mono">
                        {deg != null ? `${Number(deg).toFixed(2)}°` : "—"}
                      </div>
                      <div className="text-[11px] font-medium text-accent-hover truncate">{signName || "—"}</div>
                      {nakName && <div className="text-[9px] text-ink-muted truncate">{nakName}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
