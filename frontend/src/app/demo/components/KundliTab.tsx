"use client";

import React from "react";
import { Layers, Loader2 } from "lucide-react";
import type { ApiData } from "@/lib/apiTypes";

interface KundliTabProps {
  chartStyle: "NORTH_INDIAN" | "SOUTH_INDIAN";
  setChartStyle: (style: "NORTH_INDIAN" | "SOUTH_INDIAN") => void;
  selectedVarga: string;
  setSelectedVarga: (varga: string) => void;
  vargaCharts: Array<{ id: string; name: string; hindi: string; desc: string }>;
  vargaSvgMap: Record<string, string>;
  svgChartD1: string;
  vargaLoading: boolean;
  loadVargaSvg: (varga: string, prof: ApiData, style: "NORTH_INDIAN" | "SOUTH_INDIAN") => void;
  profile: ApiData;
  housePredictions: ApiData;
  bhavChalit: ApiData;
  avasthasData: ApiData;
  bhavabalaData: ApiData;
  specialPoints: ApiData;
}

export const KundliTab: React.FC<KundliTabProps> = ({
  chartStyle,
  setChartStyle,
  selectedVarga,
  setSelectedVarga,
  vargaCharts,
  vargaSvgMap,
  svgChartD1,
  vargaLoading,
  loadVargaSvg,
  profile,
  housePredictions,
  bhavChalit,
  avasthasData,
  bhavabalaData,
  specialPoints,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Varga Selector Header */}
      <div className="bg-white p-5 rounded-lg border border-line shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-ink flex items-center gap-2">
              <Layers className="w-5 h-5 text-accent" />
              <span>Shodhadvadashamsha &amp; Shodashavarga (D1 to D60)</span>
            </h3>
            <p className="text-xs text-ink-soft mt-0.5">
              Select any harmonic divisional chart computed live by Parashari Engine with micro-precision SVG
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-md border border-line">
              <button
                onClick={() => {
                  setChartStyle("NORTH_INDIAN");
                  loadVargaSvg(selectedVarga, profile, "NORTH_INDIAN");
                  loadVargaSvg("D1", profile, "NORTH_INDIAN");
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  chartStyle === "NORTH_INDIAN"
                    ? "bg-white text-accent-hover shadow-2xs border border-accent/30"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <span>🔷</span>
                <span>North Indian (उत्तर भारतीय)</span>
              </button>
              <button
                onClick={() => {
                  setChartStyle("SOUTH_INDIAN");
                  loadVargaSvg(selectedVarga, profile, "SOUTH_INDIAN");
                  loadVargaSvg("D1", profile, "SOUTH_INDIAN");
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  chartStyle === "SOUTH_INDIAN"
                    ? "bg-white text-accent-hover shadow-2xs border border-accent/30"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <span>🟩</span>
                <span>South Indian (दक्षिण भारतीय)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink-soft">Active Chart:</span>
              <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-accent text-white shadow-xs">
                {selectedVarga} — {vargaCharts.find((v) => v.id === selectedVarga)?.name || selectedVarga}
              </span>
            </div>
          </div>
        </div>

        {/* Varga Chart Badges / Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-t border-line pt-3">
          {vargaCharts.map((v) => {
            const isSelected = selectedVarga === v.id;
            return (
              <button
                key={v.id}
                onClick={() => {
                  setSelectedVarga(v.id);
                  loadVargaSvg(v.id, profile, chartStyle);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? "bg-console text-white shadow-xs scale-105"
                    : "bg-surface-alt hover:bg-line text-ink"
                }`}
              >
                <span>{v.id}</span>
                <span
                  className={`text-[10px] font-normal ${
                    isSelected ? "text-slate-300" : "text-ink-soft"
                  }`}
                >
                  {v.name.split("/")[0].trim()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Selected Varga Chart */}
        <div className="bg-white p-6 rounded-lg border border-line shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-accent-soft text-accent-hover font-mono text-xs font-bold border border-accent/30">
                  {selectedVarga}
                </span>
                <h4 className="font-bold text-sm text-ink">
                  {vargaCharts.find((v) => v.id === selectedVarga)?.hindi} (
                  {vargaCharts.find((v) => v.id === selectedVarga)?.name})
                </h4>
              </div>
              <p className="text-xs text-ink-soft mt-1">
                {vargaCharts.find((v) => v.id === selectedVarga)?.desc}
              </p>
            </div>

            {vargaLoading && (
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
            )}
          </div>

          <div className="bg-surface p-4 rounded-md border border-line flex items-center justify-center min-h-[360px]">
            {vargaSvgMap[`${selectedVarga}_${chartStyle}`] ||
            (chartStyle === "NORTH_INDIAN" ? vargaSvgMap[selectedVarga] : null) ? (
              <div
                className="w-full max-w-[350px] aspect-square flex items-center justify-center"
                dangerouslySetInnerHTML={{
                  __html:
                    vargaSvgMap[`${selectedVarga}_${chartStyle}`] ||
                    (chartStyle === "NORTH_INDIAN"
                      ? vargaSvgMap[selectedVarga]
                      : ""),
                }}
              />
            ) : vargaLoading ? (
              <div className="text-center text-xs text-ink-muted">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-accent" />
                Generating {selectedVarga} (
                {chartStyle === "SOUTH_INDIAN" ? "South Indian" : "North Indian"}) Chart...
              </div>
            ) : (
              <div className="text-center space-y-2">
                <p className="text-xs text-ink-soft">Vector SVG not rendered yet.</p>
                <button
                  onClick={() => loadVargaSvg(selectedVarga, profile, chartStyle)}
                  className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition"
                >
                  Load {selectedVarga} (
                  {chartStyle === "SOUTH_INDIAN" ? "South Indian" : "North Indian"})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lagna Chart (D1) Reference Standard */}
        <div className="bg-white p-6 rounded-lg border border-line shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-console text-white font-mono text-xs font-bold">
                  D1 Reference
                </span>
                <h4 className="font-bold text-sm text-ink">
                  D1 — Lagna Kundli (मूल जन्म लग्न कुंडली)
                </h4>
              </div>
              <p className="text-xs text-ink-soft mt-1">
                Base foundational chart with exact ascendant degrees (
                {chartStyle === "SOUTH_INDIAN" ? "South Indian Style" : "North Indian Style"})
              </p>
            </div>
          </div>

          <div className="bg-surface p-4 rounded-md border border-line flex items-center justify-center min-h-[360px]">
            {vargaSvgMap[`D1_${chartStyle}`] ||
            (chartStyle === "NORTH_INDIAN"
              ? vargaSvgMap["D1"] || svgChartD1
              : null) ? (
              <div
                className="w-full max-w-[350px] aspect-square flex items-center justify-center"
                dangerouslySetInnerHTML={{
                  __html:
                    vargaSvgMap[`D1_${chartStyle}`] ||
                    vargaSvgMap["D1"] ||
                    svgChartD1,
                }}
              />
            ) : (
              <div className="text-center space-y-2">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-accent" />
                <div className="text-xs text-ink-muted">
                  Rendering D1 ({chartStyle === "SOUTH_INDIAN" ? "South Indian" : "North Indian"}) Chart...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Grid of Key Vargas (D9, D10, D12) */}
      <div className="bg-white p-6 rounded-lg border border-line shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h4 className="font-bold text-sm text-ink">Essential Varga Quick-Switch Deck</h4>
            <p className="text-xs text-ink-soft">Instant one-click preview for primary life pillars</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {[
            { id: "D1", name: "Lagna", hi: "लग्न" },
            { id: "D2", name: "Hora (Wealth)", hi: "होरा" },
            { id: "D3", name: "Drekkana", hi: "द्रेष्काण" },
            { id: "D7", name: "Saptamsha", hi: "सप्तांश" },
            { id: "D9", name: "Navamsha", hi: "नवांश" },
            { id: "D10", name: "Dashamsha", hi: "दशांश" },
            { id: "D60", name: "Shashtiamsha", hi: "षष्ट्यांश" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedVarga(item.id);
                loadVargaSvg(item.id, profile, chartStyle);
              }}
              className={`p-3 rounded-md border text-center transition ${
                selectedVarga === item.id
                  ? "bg-accent-soft border-accent/40 ring-2 ring-accent/20"
                  : "bg-surface hover:bg-surface-alt border-line"
              }`}
            >
              <div className="text-xs font-semibold text-accent font-mono">{item.id}</div>
              <div className="text-xs font-bold text-ink mt-0.5">{item.hi}</div>
              <div className="text-[10px] text-ink-muted mt-0.5">{item.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 12 Houses (Bhavas) Life Predictions & Bhavaphala */}
      <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-4">
          <div>
            <h3 className="font-bold text-base text-ink flex items-center gap-2">
              <span>🏛️</span>
              12 Houses Bhavaphala &amp; Life Predictions (द्वादश भाव फल)
            </h3>
            <p className="text-xs text-ink-soft mt-0.5">
              Classical Vedic predictions for all 12 life areas: Career, Marriage, Wealth, Health, Family &amp; Moksha
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-accent-soft text-accent-hover border border-accent/30 w-fit">
            Parashari Bhavaphala Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(
            housePredictions?.houses || [
              { house: 1, name: "Tanu Bhava (1st House)", icon: "👤", domain: "Self, Personality & Health", sign: "Sagittarius", sign_lord: "Jupiter", potency_score: 85, prediction: "Ascendant in Sagittarius bestows wisdom, expansive mindset, and commanding physical presence. Jupiter grace guides ethical decisions.", remedy: "Perform morning surya namaskar and wear yellow tones on Thursdays." },
              { house: 2, name: "Dhana Bhava (2nd House)", icon: "💰", domain: "Wealth, Family & Speech", sign: "Capricorn", sign_lord: "Saturn", potency_score: 75, prediction: "Second house brings structured, disciplined financial accumulation. Family assets grow through persistent long-term investments.", remedy: "Practice truthfulness in speech and support elderly relatives." },
              { house: 3, name: "Sahaja Bhava (3rd House)", icon: "⚔️", domain: "Courage, Siblings & Initiative", sign: "Aquarius", sign_lord: "Saturn", potency_score: 78, prediction: "Third house imparts immense endurance, technical communication aptitude, and courage in business negotiations.", remedy: "Encourage younger siblings and engage in daily physical exercise." },
              { house: 4, name: "Sukha Bhava (4th House)", icon: "🏠", domain: "Mother, Vehicles & Domestic Peace", sign: "Pisces", sign_lord: "Jupiter", potency_score: 82, prediction: "Fourth house blesses native with spacious property, vehicle happiness, and deep emotional bond with maternal figures.", remedy: "Keep water elements clean at home and respect mother." },
              { house: 5, name: "Putra Bhava (5th House)", icon: "🎓", domain: "Intellect, Children & Purva Punya", sign: "Aries", sign_lord: "Mars", potency_score: 80, prediction: "Fifth house sharpens analytical thinking, higher education success, and auspicious rewards from past karmic investments.", remedy: "Chant Gayatri Mantra daily for intellectual brilliance." },
              { house: 6, name: "Ripu Bhava (6th House)", icon: "🛡️", domain: "Daily Work, Health & Competitions", sign: "Taurus", sign_lord: "Venus", potency_score: 72, prediction: "Sixth house ensures victory over workplace rivals and debt-clearance capability through balanced routine work.", remedy: "Maintain regular dietary discipline and feed birds." },
              { house: 7, name: "Kalatra Bhava (7th House)", icon: "💍", domain: "Spouse & Business Partnerships", sign: "Gemini", sign_lord: "Mercury", potency_score: 78, prediction: "Seventh house indicates intelligent, communicative spouse and lucrative business alliances in trade and consulting.", remedy: "Honor commitments in partnership and offer sweets on Fridays." },
              { house: 8, name: "Randhra Bhava (8th House)", icon: "🔮", domain: "Longevity, Research & Transformation", sign: "Cancer", sign_lord: "Moon", potency_score: 74, prediction: "Eighth house grants intuitive research ability, sudden legacy gains, and keen interest in hidden metaphysical truths.", remedy: "Practice evening pranayama and offer milk/water to Shiva." },
              { house: 9, name: "Bhagya Bhava (9th House)", icon: "🛕", domain: "Fortune, Higher Wisdom & Dharma", sign: "Leo", sign_lord: "Sun", potency_score: 88, prediction: "Ninth house activates royal fortune, paternal blessings, and spiritual inclination toward philanthropic works.", remedy: "Seek blessings from father and teachers regularly." },
              { house: 10, name: "Karma Bhava (10th House)", icon: "👑", domain: "Career, Authority & Public Status", sign: "Virgo", sign_lord: "Mercury", potency_score: 86, prediction: "Tenth house governs commanding administrative authority, analytical excellence, and consistent professional rise.", remedy: "Maintain meticulous ethics in professional contracts." },
              { house: 11, name: "Labha Bhava (11th House)", icon: "🌟", domain: "Income, Profits & Network Circles", sign: "Libra", sign_lord: "Venus", potency_score: 84, prediction: "Eleventh house secures multiple income streams, high-profile friendships, and fulfillment of ambitious life goals.", remedy: "Collaborate generously with philanthropic circles." },
              { house: 12, name: "Vyaya Bhava (12th House)", icon: "🕊️", domain: "Foreign Lands, Expenses & Moksha", sign: "Scorpio", sign_lord: "Mars", potency_score: 70, prediction: "Twelfth house favors foreign travels, overseas earnings, meditation retreats, and gradual spiritual detachment.", remedy: "Practice charity before sunset and meditate before sleeping." },
            ]
          ).map((h: ApiData, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-lg border border-line bg-surface/50 hover:bg-white hover:border-accent/30 transition space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{h.icon}</span>
                  <div>
                    <h4 className="font-bold text-xs text-ink leading-tight">{h.name}</h4>
                    <div className="text-[10px] text-ink-muted font-medium">{h.domain}</div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-accent-hover bg-accent-soft border border-accent/30 px-2 py-0.5 rounded-full">
                  {h.potency_score || 80}/100
                </span>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-mono text-ink-soft bg-white p-2 rounded-lg border border-line">
                <span><strong>Sign:</strong> {h.sign}</span>
                <span>•</span>
                <span><strong>Lord:</strong> {h.sign_lord}</span>
                {h.occupant_planets && h.occupant_planets.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-accent font-bold">Planets: {h.occupant_planets.join(", ")}</span>
                  </>
                )}
              </div>

              <p className="text-[11px] text-ink leading-relaxed">{h.prediction}</p>

              {h.remedy && (
                <div className="text-[10px] text-emerald-800 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100 flex items-start gap-1.5">
                  <span className="font-bold">🌿 Upay:</span>
                  <span>{h.remedy}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Parashari Analysis Extras (Bhav Chalit, Avasthas, Bhavabala, Special Points) */}
      {(bhavChalit || avasthasData || bhavabalaData || specialPoints) && (
        <div className="space-y-6 pt-4 border-t border-line">
          <h2 className="text-sm font-semibold text-ink uppercase tracking-wider">
            📐 Advanced Parashari Analysis
          </h2>

          {/* Bhav Chalit */}
          {bhavChalit && (
            <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <h3 className="font-bold text-sm text-ink">Bhav Chalit Chart (भाव चलित)</h3>
                  <p className="text-xs text-ink-soft">
                    House positions using equal house method — shows house-shift of planets
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-accent-soft text-accent-hover">
                  Module 3
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="text-left py-2 font-bold text-ink-soft uppercase text-[10px]">Planet</th>
                      <th className="text-left py-2 font-bold text-ink-soft uppercase text-[10px]">Rashi House</th>
                      <th className="text-left py-2 font-bold text-ink-soft uppercase text-[10px]">Chalit House</th>
                      <th className="text-left py-2 font-bold text-ink-soft uppercase text-[10px]">Shifted?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {(() => {
                      const rawList = Array.isArray(bhavChalit?.shifted_planets)
                        ? bhavChalit.shifted_planets
                        : Array.isArray(bhavChalit?.planets)
                        ? bhavChalit.planets
                        : Array.isArray(bhavChalit)
                        ? bhavChalit
                        : typeof bhavChalit === "object" && bhavChalit !== null
                        ? Object.values(bhavChalit).filter((v) => typeof v === "object" && v !== null)
                        : [];
                      return rawList.map((p: ApiData, i: number) => {
                        const pName = p.planet || p.name || p.planet_name || `Planet ${i + 1}`;
                        const rHouse = p.birth_house || p.rashi_house || p.house_rashi || p.house || "—";
                        const cHouse = p.chalit_house || p.bhav_house || p.chalit || rHouse;
                        const shifted = rHouse !== "—" && cHouse !== "—" && rHouse !== cHouse;
                        return (
                          <tr key={i} className="hover:bg-surface">
                            <td className="py-2 font-bold text-ink">{pName}</td>
                            <td className="py-2 font-mono text-ink-soft">H{rHouse}</td>
                            <td className="py-2 font-mono text-accent-hover font-bold">H{cHouse}</td>
                            <td className="py-2">
                              {shifted ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Shifted!
                                </span>
                              ) : (
                                <span className="text-ink-muted text-[10px]">Same House</span>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Avasthas */}
          {avasthasData && (
            <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <h3 className="font-bold text-sm text-ink">Planet Avasthas (ग्रह अवस्था)</h3>
                  <p className="text-xs text-ink-soft">
                    Baladi (Age Fruit) & Jagradadi (Consciousness State) of Planets
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-accent-soft text-accent-hover">
                  Module 3
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(() => {
                  const avasthaMap = avasthasData?.planetary_avasthas || avasthasData?.avasthas || avasthasData;
                  const list = Array.isArray(avasthaMap)
                    ? avasthaMap
                    : typeof avasthaMap === "object" && avasthaMap !== null
                    ? Object.entries(avasthaMap)
                        .filter(([k]) => !["ascendant_sign", "status", "message"].includes(k))
                        .map(([k, v]: [string, ApiData]) => ({ pid: k, ...(typeof v === "object" ? v : { state: v }) }))
                    : [];

                  return list.map((a: ApiData, i: number) => {
                    const name = a.planet_name || a.planet || a.name || a.pid;
                    const baladi = a.baladi_avastha || a.avastha || a.state || "—";
                    const jagradadi = a.jagradadi_avastha;
                    const deg = a.degree_in_sign != null ? `${a.degree_in_sign}°` : "";
                    const sign = a.sign ? ` in ${a.sign}` : "";
                    return (
                      <div key={i} className="p-3.5 rounded-md bg-surface border border-line space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-ink">{name}</span>
                          <span className="text-[10px] font-mono text-ink-soft">{deg}{sign}</span>
                        </div>
                        <div className="text-[11px] font-bold text-accent bg-accent-soft/70 px-2 py-0.5 rounded">
                          {baladi}
                        </div>
                        {jagradadi && (
                          <div className="text-[10px] text-ink-soft truncate">{jagradadi}</div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Bhavabala */}
          {bhavabalaData && (
            <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <h3 className="font-bold text-sm text-ink">Bhavabala — House Strength (भावबल)</h3>
                  <p className="text-xs text-ink-soft">12 Houses Potency in Virupas, Rupas & Relative Strength</p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-accent-soft text-accent-hover">
                  Module 3
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {(() => {
                  const bhavMap = bhavabalaData?.bhavabala || bhavabalaData?.bhavabalas || bhavabalaData;
                  const list = Array.isArray(bhavMap)
                    ? bhavMap
                    : typeof bhavMap === "object" && bhavMap !== null
                    ? Object.entries(bhavMap)
                        .filter(([k]) => !["ascendant_sign", "status", "message"].includes(k))
                        .map(([k, v]: [string, ApiData]) => ({ key: k, ...(typeof v === "object" ? v : { score: v }) }))
                    : [];

                  return list.map((b: ApiData, i: number) => {
                    const hNum = b.house_number || b.house || i + 1;
                    const rupas = b.total_bhavabala_rupas || (b.total_bhavabala_virupas ? (b.total_bhavabala_virupas / 60).toFixed(1) : b.score || b.total || 0);
                    const virupas = b.total_bhavabala_virupas || (typeof b.score === "number" ? b.score : null);
                    const lord = b.lord ? ` • Lord: ${b.lord}` : "";
                    const strength = b.relative_strength || (Number(rupas) >= 8 ? "EXCELLENT" : Number(rupas) >= 6.5 ? "GOOD" : "AVERAGE");
                    const badgeColor = strength === "EXCELLENT" ? "bg-emerald-100 text-emerald-800" : strength === "GOOD" ? "bg-accent-soft text-accent-hover" : "bg-surface-alt text-ink";

                    return (
                      <div key={i} className="p-3.5 rounded-md bg-surface border border-line space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-ink">House {hNum}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeColor}`}>{strength}</span>
                        </div>
                        <div className="font-semibold text-ink text-base font-mono">
                          {Number(rupas).toFixed(2)} <span className="text-[10px] font-normal text-ink-soft">Rupas</span>
                        </div>
                        <div className="text-[10px] text-ink-soft truncate">
                          {b.sign || `Sign ${hNum}`}{lord}
                        </div>
                        {virupas != null && (
                          <div className="text-[9px] font-mono text-ink-muted">
                            {Number(virupas).toFixed(1)} Virupas
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Special Points */}
          {specialPoints && (
            <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <h3 className="font-bold text-sm text-ink">Sensitive Points & Critical Junctions (विशेष संवेदनशील बिंदु)</h3>
                  <p className="text-xs text-ink-soft">
                    Pushkar Navamsha (शुभ फल), Pushkar Bhaga (पुनरुद्धार), Gandanta (संधि दोष)
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-accent-soft text-accent-hover">
                  Module 3
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(() => {
                  const spList = Array.isArray(specialPoints?.planets_special_points)
                    ? specialPoints.planets_special_points
                    : Array.isArray(specialPoints?.special_points)
                    ? specialPoints.special_points
                    : Array.isArray(specialPoints?.upagrahas)
                    ? specialPoints.upagrahas
                    : Array.isArray(specialPoints)
                    ? specialPoints
                    : [];

                  return spList.map((sp: ApiData, i: number) => {
                    const pName = sp.planet || sp.name || sp.point || `Planet ${i + 1}`;
                    const isPushkarNav = sp.is_pushkar_navamsha;
                    const isPushkarBhaga = sp.is_pushkar_bhaga;
                    const isGandanta = sp.is_gandanta;

                    return (
                      <div key={i} className="p-3.5 rounded-md bg-surface border border-line space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-ink">{pName}</span>
                          <span className="text-[10px] font-mono text-ink-soft">
                            {sp.sign} ({sp.longitude ? `${(sp.longitude % 30).toFixed(1)}°` : "—"})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {isPushkarNav && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              ✨ Pushkar Navamsha
                            </span>
                          )}
                          {isPushkarBhaga && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              🌟 Pushkar Bhaga ({sp.pushkar_bhaga_degree}°)
                            </span>
                          )}
                          {isGandanta && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              ⚠️ Gandanta: {sp.gandanta_junction}
                            </span>
                          )}
                          {!isPushkarNav && !isPushkarBhaga && !isGandanta && (
                            <span className="text-[10px] text-ink-muted">Normal Planetary Zone</span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
