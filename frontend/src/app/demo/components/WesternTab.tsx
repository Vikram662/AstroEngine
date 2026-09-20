"use client";

import React from "react";
import { Sun, Moon, Compass } from "lucide-react";

interface WesternTabProps {
  westernData: any;
  westernWheelSvg: string;
  westernTropicalPlanets?: any;
  westernAspects?: any;
  westernTransits?: any;
  westernSolarReturn?: any;
}

export const WesternTab: React.FC<WesternTabProps> = ({
  westernData,
  westernWheelSvg,
  westernTropicalPlanets,
  westernAspects,
  westernTransits,
  westernSolarReturn,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* The Big Three Identity & Western Wheel SVG */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Big Three */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">The Big Three Identity</h3>
              <p className="text-xs text-slate-500">Tropical Sayana system from 0° Aries Vernal Equinox</p>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
              Western Sayana
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Sun Sign (Ego &amp; Will)
                </span>
                <div className="text-lg font-black text-slate-900 mt-0.5">
                  {typeof westernData?.sun_sign === "object"
                    ? `${westernData.sun_sign.sign} (${westernData.sun_sign.degree}°)`
                    : westernData?.sun_sign || "Libra ♎"}
                </div>
              </div>
              <Sun className="w-6 h-6 text-amber-500" />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Moon Sign (Emotions &amp; Soul)
                </span>
                <div className="text-lg font-black text-slate-900 mt-0.5">
                  {typeof westernData?.moon_sign === "object"
                    ? `${westernData.moon_sign.sign} (${westernData.moon_sign.degree}°)`
                    : westernData?.moon_sign || "Aquarius ♒"}
                </div>
              </div>
              <Moon className="w-6 h-6 text-indigo-500" />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Ascendant (Rising Persona)
                </span>
                <div className="text-lg font-black text-slate-900 mt-0.5">
                  {typeof westernData?.ascendant_sign === "object"
                    ? `${westernData.ascendant_sign.sign} (${westernData.ascendant_sign.degree}°)`
                    : westernData?.ascendant_sign || "Capricorn ♑"}
                </div>
              </div>
              <Compass className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Western Wheel SVG */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Western Circular Wheel SVG</h3>
              <p className="text-xs text-slate-500">Visual wheel diagram rendered dynamically</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              Wheel SVG
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-center min-h-[300px]">
            {westernWheelSvg ? (
              <div
                className="w-full max-w-[320px] aspect-square"
                dangerouslySetInnerHTML={{ __html: westernWheelSvg }}
              />
            ) : (
              <div className="text-xs text-slate-400">Circular wheel SVG calculated by Module 11</div>
            )}
          </div>
        </div>
      </div>

      {/* Western Extras: Complete Suite */}
      {(westernTropicalPlanets || westernAspects || westernTransits || westernSolarReturn) && (
        <div className="space-y-6 pt-2">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">
            🌍 Western Astrology — Complete Suite
          </h2>

          {/* Tropical Planets */}
          {westernTropicalPlanets && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Tropical Planetary Positions</h3>
                  <p className="text-xs text-slate-500">All planets in Western / Tropical zodiac signs with house</p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-violet-50 text-violet-700">
                  Western API
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 font-bold text-slate-500 uppercase text-[10px]">Planet</th>
                      <th className="text-left py-2 font-bold text-slate-500 uppercase text-[10px]">Sign</th>
                      <th className="text-left py-2 font-bold text-slate-500 uppercase text-[10px]">Degree</th>
                      <th className="text-left py-2 font-bold text-slate-500 uppercase text-[10px]">House</th>
                      <th className="text-left py-2 font-bold text-slate-500 uppercase text-[10px]">R?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(Array.isArray(westernTropicalPlanets?.planets)
                      ? westernTropicalPlanets.planets
                      : Array.isArray(westernTropicalPlanets)
                      ? westernTropicalPlanets
                      : []
                    ).map((p: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 font-bold text-slate-900">{p.name || p.planet}</td>
                        <td className="py-2 text-violet-700 font-semibold">
                          {typeof p.sign === "object" ? p.sign?.name || p.sign?.id : p.sign}
                        </td>
                        <td className="py-2 font-mono text-slate-600">
                          {p.degree != null ? `${Number(p.degree).toFixed(2)}°` : "—"}
                        </td>
                        <td className="py-2 text-slate-600">H{p.house || "—"}</td>
                        <td className="py-2">
                          {p.is_retrograde ? <span className="text-amber-600 font-bold">℞</span> : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Aspects Matrix */}
          {westernAspects && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Planetary Aspects Matrix</h3>
                  <p className="text-xs text-slate-500">
                    Conjunction, Trine, Square, Opposition, Sextile between planets
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-violet-50 text-violet-700">
                  Western API
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(Array.isArray(westernAspects?.aspects)
                  ? westernAspects.aspects
                  : Array.isArray(westernAspects)
                  ? westernAspects
                  : []
                )
                  .slice(0, 12)
                  .map((a: any, i: number) => {
                    const aspectColors: Record<string, string> = {
                      Conjunction: "bg-indigo-50 border-indigo-200 text-indigo-800",
                      Trine: "bg-emerald-50 border-emerald-200 text-emerald-800",
                      Square: "bg-red-50 border-red-200 text-red-800",
                      Opposition: "bg-orange-50 border-orange-200 text-orange-800",
                      Sextile: "bg-blue-50 border-blue-200 text-blue-800",
                    };
                    const ac = aspectColors[a.aspect] || "bg-slate-50 border-slate-200 text-slate-800";
                    return (
                      <div key={i} className={`p-3 rounded-xl border text-xs ${ac}`}>
                        <div className="font-bold">
                          {a.planet1 || a.planet_1} — {a.planet2 || a.planet_2}
                        </div>
                        <div className="font-black text-sm mt-0.5">{a.aspect}</div>
                        <div className="font-mono mt-0.5 opacity-70">
                          Orb: {a.orb != null ? `${Number(a.orb).toFixed(2)}°` : "—"}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Daily Transits */}
          {westernTransits && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Today's Western Transits</h3>
                  <p className="text-xs text-slate-500">Current transit planets aspecting natal chart positions</p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-violet-50 text-violet-700">
                  Western API
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Array.isArray(westernTransits?.active_transits)
                  ? westernTransits.active_transits
                  : Array.isArray(westernTransits?.transits)
                  ? westernTransits.transits
                  : Array.isArray(westernTransits)
                  ? westernTransits
                  : []
                ).map((t: any, i: number) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {t.transiting_planet || t.transit_planet || t.planet}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-800">
                          {t.aspect || "Aspect"}
                        </span>
                        <span className="text-xs font-bold text-slate-700">{t.natal_planet}</span>
                      </div>
                      {t.theme && <div className="text-[11px] text-slate-600 leading-snug">{t.theme}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      {t.orb != null && (
                        <div className="text-[10px] font-mono text-slate-500">
                          Orb: {Number(t.orb).toFixed(2)}°
                        </div>
                      )}
                      {t.exact_date && <div className="text-[10px] text-slate-400">{t.exact_date}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Solar Return */}
          {westernSolarReturn && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Solar Return Chart (Solar Birthday)</h3>
                  <p className="text-xs text-slate-500">
                    Chart cast for the exact moment the Sun returns to natal position this year
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-violet-50 text-violet-700">
                  Western API
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    label: "SR Return Year",
                    val: westernSolarReturn.solar_return_year || westernSolarReturn.year || 2026,
                  },
                  {
                    label: "Exact Solar Moment",
                    val: westernSolarReturn.exact_solar_moment
                      ? new Date(westernSolarReturn.exact_solar_moment).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : westernSolarReturn.solar_return_date || "—",
                  },
                  {
                    label: "SR Ascendant",
                    val:
                      westernSolarReturn.solar_ascendant ||
                      westernSolarReturn.ascendant ||
                      westernSolarReturn.lagna ||
                      "—",
                  },
                  {
                    label: "Profection House",
                    val: westernSolarReturn.annual_profection_house
                      ? `House ${westernSolarReturn.annual_profection_house}`
                      : westernSolarReturn.year_theme || "—",
                  },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-violet-50 border border-violet-100 text-center">
                    <div className="text-[10px] uppercase font-bold text-violet-500">{item.label}</div>
                    <div className="font-black text-violet-900 text-sm mt-1">{item.val || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
