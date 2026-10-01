"use client";

import React from "react";
import { Sun, Moon, Compass } from "lucide-react";
import type { ApiData } from "@/lib/apiTypes";
import { sanitizeSvg } from "@/lib/sanitizeSvg";

interface WesternTabProps {
  westernData: ApiData;
  westernWheelSvg: string;
  westernTropicalPlanets?: ApiData;
  westernAspects?: ApiData;
  westernTransits?: ApiData;
  westernSolarReturn?: ApiData;
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
        <div className="bg-white p-6 rounded-lg border border-line shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-ink">The Big Three Identity</h3>
              <p className="text-xs text-ink-soft">Tropical Sayana system from 0° Aries Vernal Equinox</p>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-accent-soft text-accent-hover">
              Western Sayana
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-md bg-surface border border-line flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  Sun Sign (Ego &amp; Will)
                </span>
                <div className="text-lg font-semibold text-ink mt-0.5">
                  {typeof westernData?.sun_sign === "object"
                    ? `${westernData.sun_sign.sign} (${westernData.sun_sign.degree}°)`
                    : westernData?.sun_sign || "Libra ♎"}
                </div>
              </div>
              <Sun className="w-6 h-6 text-amber-500" />
            </div>

            <div className="p-4 rounded-md bg-surface border border-line flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  Moon Sign (Emotions &amp; Soul)
                </span>
                <div className="text-lg font-semibold text-ink mt-0.5">
                  {typeof westernData?.moon_sign === "object"
                    ? `${westernData.moon_sign.sign} (${westernData.moon_sign.degree}°)`
                    : westernData?.moon_sign || "Aquarius ♒"}
                </div>
              </div>
              <Moon className="w-6 h-6 text-accent" />
            </div>

            <div className="p-4 rounded-md bg-surface border border-line flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  Ascendant (Rising Persona)
                </span>
                <div className="text-lg font-semibold text-ink mt-0.5">
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
        <div className="bg-white p-6 rounded-lg border border-line shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-ink">Western Circular Wheel SVG</h3>
              <p className="text-xs text-ink-soft">Visual wheel diagram rendered dynamically</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-alt text-ink">
              Wheel SVG
            </span>
          </div>

          <div className="bg-surface p-4 rounded-md border border-line flex items-center justify-center min-h-[300px]">
            {westernWheelSvg ? (
              <div
                className="w-full max-w-[320px] aspect-square"
                dangerouslySetInnerHTML={{ __html: sanitizeSvg(westernWheelSvg) }}
              />
            ) : (
              <div className="text-xs text-ink-muted">Circular wheel SVG calculated by Module 11</div>
            )}
          </div>
        </div>
      </div>

      {/* Western Extras: Complete Suite */}
      {(westernTropicalPlanets || westernAspects || westernTransits || westernSolarReturn) && (
        <div className="space-y-6 pt-2">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
            🌍 Western Astrology — Complete Suite
          </h2>

          {/* Tropical Planets */}
          {westernTropicalPlanets && (
            <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <h3 className="font-bold text-sm text-ink">Tropical Planetary Positions</h3>
                  <p className="text-xs text-ink-soft">All planets in Western / Tropical zodiac signs with house</p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-accent-soft text-accent-hover">
                  Western API
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="text-left py-2 font-bold text-ink-soft uppercase text-[10px]">Planet</th>
                      <th className="text-left py-2 font-bold text-ink-soft uppercase text-[10px]">Sign</th>
                      <th className="text-left py-2 font-bold text-ink-soft uppercase text-[10px]">Degree</th>
                      <th className="text-left py-2 font-bold text-ink-soft uppercase text-[10px]">House</th>
                      <th className="text-left py-2 font-bold text-ink-soft uppercase text-[10px]">R?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {(Array.isArray(westernTropicalPlanets?.planets)
                      ? westernTropicalPlanets.planets
                      : Array.isArray(westernTropicalPlanets)
                      ? westernTropicalPlanets
                      : []
                    ).map((p: ApiData, i: number) => (
                      <tr key={i} className="hover:bg-surface">
                        <td className="py-2 font-bold text-ink">{p.name || p.planet}</td>
                        <td className="py-2 text-accent-hover font-semibold">
                          {typeof p.sign === "object" ? p.sign?.name || p.sign?.id : p.sign}
                        </td>
                        <td className="py-2 font-mono text-ink-soft">
                          {p.degree != null ? `${Number(p.degree).toFixed(2)}°` : "—"}
                        </td>
                        <td className="py-2 text-ink-soft">H{p.house || "—"}</td>
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
            <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <h3 className="font-bold text-sm text-ink">Planetary Aspects Matrix</h3>
                  <p className="text-xs text-ink-soft">
                    Conjunction, Trine, Square, Opposition, Sextile between planets
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-accent-soft text-accent-hover">
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
                  .map((a: ApiData, i: number) => {
                    const aspectColors: Record<string, string> = {
                      Conjunction: "bg-accent-soft border-accent/30 text-accent-hover",
                      Trine: "bg-emerald-50 border-emerald-200 text-emerald-800",
                      Square: "bg-red-50 border-red-200 text-red-800",
                      Opposition: "bg-orange-50 border-orange-200 text-orange-800",
                      Sextile: "bg-accent-soft border-accent/30 text-accent-hover",
                    };
                    const ac = aspectColors[a.aspect] || "bg-surface border-line text-ink";
                    return (
                      <div key={i} className={`p-3 rounded-md border text-xs ${ac}`}>
                        <div className="font-bold">
                          {a.planet1 || a.planet_1} — {a.planet2 || a.planet_2}
                        </div>
                        <div className="font-semibold text-sm mt-0.5">{a.aspect}</div>
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
            <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <h3 className="font-bold text-sm text-ink">Today&apos;s Western Transits</h3>
                  <p className="text-xs text-ink-soft">Current transit planets aspecting natal chart positions</p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-accent-soft text-accent-hover">
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
                ).map((t: ApiData, i: number) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-md bg-surface border border-line flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-ink">
                          {t.transiting_planet || t.transit_planet || t.planet}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent-soft text-accent-hover">
                          {t.aspect || "Aspect"}
                        </span>
                        <span className="text-xs font-bold text-ink">{t.natal_planet}</span>
                      </div>
                      {t.theme && <div className="text-[11px] text-ink-soft leading-snug">{t.theme}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      {t.orb != null && (
                        <div className="text-[10px] font-mono text-ink-soft">
                          Orb: {Number(t.orb).toFixed(2)}°
                        </div>
                      )}
                      {t.exact_date && <div className="text-[10px] text-ink-muted">{t.exact_date}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Solar Return */}
          {westernSolarReturn && (
            <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <h3 className="font-bold text-sm text-ink">Solar Return Chart (Solar Birthday)</h3>
                  <p className="text-xs text-ink-soft">
                    Chart cast for the exact moment the Sun returns to natal position this year
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-accent-soft text-accent-hover">
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
                  <div key={i} className="p-4 rounded-md bg-accent-soft border border-accent/20 text-center">
                    <div className="text-[10px] uppercase font-bold text-accent">{item.label}</div>
                    <div className="font-semibold text-ink text-sm mt-1">{item.val || "—"}</div>
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
