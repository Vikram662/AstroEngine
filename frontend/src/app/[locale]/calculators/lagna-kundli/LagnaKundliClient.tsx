"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { fetchParallelSettled } from "@/lib/calculatorApi";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";
import type { Locale } from "@/lib/locale";
import type { ApiData } from "@/lib/apiTypes";

export default function LagnaKundliClient({ locale }: { locale: Locale }) {
  const [form, setForm] = useState<BirthDataValue>(() => ({
    ...DEFAULT_BIRTH_DATA,
    cityName: locale === "en" ? "New Delhi, India" : "नई दिल्ली, भारत",
  }));
  const lang = locale;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ApiData>(null);
  const [svgChart, setSvgChart] = useState<string>("");
  const [houseData, setHouseData] = useState<ApiData>(null);
  const [yogaData, setYogaData] = useState<ApiData>(null);
  const [strengthData, setStrengthData] = useState<ApiData>(null);
  const [dashaData, setDashaData] = useState<ApiData>(null);
  const [manglikData, setManglikData] = useState<ApiData>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      dob: form.dob,
      tob: form.tob,
      lat: form.lat,
      lon: form.lon,
      tz: form.tz,
      lang,
    };

    try {
      const [resData, resSvg, resHouse, resYoga, resStrength, resDasha, resManglik] = await fetchParallelSettled([
        axios.post("/api/proxy", {
          endpoint: "/api/v1/parashari/chart/d1",
          payload,
          method: "POST",
        }),
        axios.post(
          "/api/proxy",
          {
            endpoint: "/api/v1/parashari/chart/svg",
            payload,
            queryParams: { varga: "D1", chart_style: "NORTH_INDIAN" },
            method: "POST",
          },
          { responseType: "text" }
        ),
        axios.post("/api/proxy", { endpoint: "/api/v1/parashari/predictions/12-houses", payload, method: "POST" }),
        axios.post("/api/proxy", { endpoint: "/api/v1/parashari/yogas/find", payload, method: "POST" }),
        axios.post("/api/proxy", { endpoint: "/api/v1/parashari/shadbala/details", payload, method: "POST" }),
        axios.post("/api/proxy", { endpoint: "/api/v1/dasha/vimshottari/current", payload, method: "POST" }),
        axios.post("/api/proxy", { endpoint: "/api/v1/dosha-matching/manglik", payload, method: "POST" }),
      ]);

      if (!resData) {
        throw new Error(lang === "en" ? "Kundli calculation failed." : "कुंडली गणना विफल रही।");
      }

      setChartData(resData);
      if (resSvg && typeof resSvg === "string" && resSvg.includes("<svg")) {
        setSvgChart(resSvg);
      }
      setHouseData(resHouse);
      setYogaData(resYoga);
      setStrengthData(resStrength);
      setDashaData(resDasha);
      setManglikData(resManglik);
    } catch (err: unknown) {
      const apiMessage = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setError(apiMessage || (err instanceof Error ? err.message : undefined) || (lang === "en" ? "Kundli calculation failed." : "कुंडली गणना विफल रही।"));
    } finally {
      setLoading(false);
    }
  };

  const ascendant = chartData?.ascendant || chartData?.lagna;
  const planets = chartData?.planets || [];
  const houses = Array.isArray(houseData?.houses) ? houseData.houses : [];
  const yogas = Array.isArray(yogaData?.yogas) ? yogaData.yogas : [];
  const strengths = strengthData?.shadbala && typeof strengthData.shadbala === "object"
    ? Object.values(strengthData.shadbala) as ApiData[]
    : [];
  const runningDasha = dashaData?.running_dasha;

  const moonPlanet = planets.find((p: ApiData) => (p.name || p.planet || "").toUpperCase().includes("MOON"));
  const moonSign = moonPlanet?.sign?.name || moonPlanet?.rashi_name || "-";
  const moonNakshatra = moonPlanet?.nakshatra?.name || "-";
  const moonPada = moonPlanet?.nakshatra?.pada || "-";

  const description =
    locale === "en"
      ? "Comprehensive high-precision Vedic birth chart, planetary dignities, 12-house readings, classical yogas, and active Dasha."
      : "उच्च-सटीक वैदिक जन्म पत्रिका, नवग्रह बल, विस्तृत 12 भाव फल, शास्त्रीय योग एवं महादशा चक्र।";

  const formContent = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-line">
        <span className="text-lg">📝</span>
        <h2 className="text-sm font-bold text-ink">
          {lang === "en" ? "Enter Birth Particulars" : "जन्म विवरण प्रविष्ट करें"}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <BirthDataFields value={form} onChange={setForm} />

        <SubmitButton loading={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> {lang === "en" ? "Generating Full Kundli..." : "संपूर्ण कुंडली तैयार हो रही है..."}
            </>
          ) : (
            lang === "en" ? "Calculate Full Kundli" : "संपूर्ण कुंडली निकालें"
          )}
        </SubmitButton>
      </form>
    </div>
  );

  const resultsContent = (
    <>
      {error && <ErrorNote message={error} />}

      {!chartData && !loading && !error && (
        <div className="bg-card rounded-lg border border-line p-12 text-center text-ink-muted">
          <div className="text-5xl mb-4">🪐</div>
          <h3 className="text-base font-bold text-ink mb-1">
            {lang === "en" ? "Ready to Calculate Your Kundli" : "आपकी कुंडली गणना हेतु तैयार"}
          </h3>
          <p className="text-sm max-w-md mx-auto text-ink-soft">
            {lang === "en" 
              ? "Enter your birth date, exact time, and birth place to generate the complete D1 chart with all houses and planetary aspects." 
              : "जन्म दिनांक, सटीक समय और जन्म स्थान भरें और 'संपूर्ण कुंडली निकालें' पर क्लिक करें।"}
          </p>
        </div>
      )}

      {loading && (
        <div className="bg-card rounded-lg border border-line p-14 text-center text-ink-soft flex flex-col items-center justify-center">
          <Loader2 className="w-9 h-9 text-accent animate-spin mb-3" />
          <p className="text-sm font-semibold text-ink">
            {lang === "en"
              ? "Computing high-precision Vedic ascendant, planets, and classical yogas..."
              : "वैदिक लग्न, नवग्रह स्थिति, षड्बल एवं शास्त्रीय योगों की गणना हो रही है..."}
          </p>
        </div>
      )}

      {chartData && (
        <div className="space-y-6">
              {/* 1. Avakahada Chakra / Core Particulars */}
              <ResultSection title={lang === "en" ? "Avakahada & Birth Particulars" : "अवकहड़ा चक्र एवं जन्म पंचांग"}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-1">
                  <div className="rounded-md border border-line/70 bg-surface-alt/40 p-3">
                    <span className="text-[11px] font-medium text-ink-muted block">{lang === "en" ? "Lagna (Ascendant)" : "जन्म लग्न"}</span>
                    <span className="text-sm font-bold text-ink mt-0.5 block">{ascendant?.sign?.name || ascendant?.rashi_name || "-"}</span>
                    <span className="text-[10px] text-accent font-semibold">{Number(ascendant?.norm_degree ?? ascendant?.degree ?? 0).toFixed(2)}°</span>
                  </div>
                  <div className="rounded-md border border-line/70 bg-surface-alt/40 p-3">
                    <span className="text-[11px] font-medium text-ink-muted block">{lang === "en" ? "Janma Rashi (Moon)" : "जन्म राशि (चंद्र)"}</span>
                    <span className="text-sm font-bold text-ink mt-0.5 block">{moonSign}</span>
                    <span className="text-[10px] text-ink-soft">{moonPlanet ? `${Number(moonPlanet.norm_degree ?? moonPlanet.degree ?? 0).toFixed(2)}°` : "-"}</span>
                  </div>
                  <div className="rounded-md border border-line/70 bg-surface-alt/40 p-3">
                    <span className="text-[11px] font-medium text-ink-muted block">{lang === "en" ? "Nakshatra & Pada" : "जन्म नक्षत्र व चरण"}</span>
                    <span className="text-sm font-bold text-ink mt-0.5 block">{moonNakshatra}</span>
                    <span className="text-[10px] text-ink-soft">{lang === "en" ? `Pada ${moonPada}` : `चरण ${moonPada}`}</span>
                  </div>
                  <div className="rounded-md border border-line/70 bg-surface-alt/40 p-3">
                    <span className="text-[11px] font-medium text-ink-muted block">{lang === "en" ? "Manglik Status" : "मांगलिक स्थिति"}</span>
                    <span className="mt-0.5 block">
                      {manglikData ? (
                        <ResultBadge tone={manglikData.is_manglik ? (manglikData.is_cancelled ? "neutral" : "bad") : "good"}>
                          {manglikData.is_manglik ? (manglikData.is_cancelled ? (lang === "en" ? "Cancelled" : "परिहार") : (lang === "en" ? "Manglik" : "मांगलिक")) : (lang === "en" ? "No Dosha" : "अमांगलिक")}
                        </ResultBadge>
                      ) : "-"}
                    </span>
                  </div>
                </div>
              </ResultSection>

              {/* 2. D1 Kundli SVG Chart */}
              {svgChart && (
                <ResultSection title={lang === "en" ? "Lagna Kundli (D1 Chart)" : "लग्न कुंडली (D1 चक्र)"}>
                  <div
                    className="w-full max-w-lg mx-auto aspect-square flex items-center justify-center bg-surface-alt/40 rounded-lg p-4 border border-line shadow-xs"
                    dangerouslySetInnerHTML={{ __html: svgChart }}
                  />
                </ResultSection>
              )}

              {/* 3. Running Vimshottari Dasha Tree */}
              {runningDasha && (
                <ResultSection title={lang === "en" ? "Current Running Dasha (विंशोत्तरी दशा)" : "वर्तमान सक्रिय विंशोत्तरी दशा"}>
                  <div className="p-4 rounded-md border border-accent/30 bg-accent-soft/30 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-semibold text-accent uppercase tracking-wider">
                        {lang === "en" ? "Active Mahadasha > Antardasha > Pratyantar" : "सक्रिय महादशा > अंतर्दशा > प्रत्यंतर"}
                      </div>
                      <div className="text-base sm:text-lg font-bold text-ink mt-1 flex items-center gap-2">
                        <span>{runningDasha.mahadasha?.planet_name || runningDasha.mahadasha?.planet_id || (typeof runningDasha.mahadasha === "string" ? runningDasha.mahadasha : "-")}</span>
                        <span className="text-ink-muted">→</span>
                        <span>{runningDasha.antardasha?.antardasha_name || runningDasha.antardasha?.antardasha || (typeof runningDasha.antardasha === "string" ? runningDasha.antardasha : "-")}</span>
                        <span className="text-ink-muted">→</span>
                        <span className="text-accent">{runningDasha.pratyantar_dasha?.pratyantar_name || runningDasha.pratyantar_dasha?.pratyantar_planet || runningDasha.pratyantar?.pratyantar_name || (typeof runningDasha.pratyantar === "string" ? runningDasha.pratyantar : "-")}</span>
                      </div>
                    </div>
                    {runningDasha.antardasha?.end_date && (
                      <div className="text-xs text-ink-soft bg-card px-3 py-1.5 rounded-lg border border-line">
                        <span className="text-ink-muted block text-[10px]">{lang === "en" ? "Current Period Ends" : "अवधि समाप्ति"}</span>
                        <span className="font-semibold text-ink">{runningDasha.antardasha.end_date}</span>
                      </div>
                    )}
                  </div>
                </ResultSection>
              )}

              {/* 4. Complete Planetary Table with House, Speed & Dignity */}
              {planets.length > 0 && (
                <ResultSection title={lang === "en" ? "Planetary Positions & Status" : "ग्रह स्थिति एवं संपूर्ण विवरण"}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                        <tr>
                          <th className="py-2.5 px-3">{lang === "en" ? "Planet" : "ग्रह"}</th>
                          <th className="py-2.5 px-3">{lang === "en" ? "Rashi (Sign)" : "राशि"}</th>
                          <th className="py-2.5 px-3">{lang === "en" ? "Degree" : "अंश"}</th>
                          <th className="py-2.5 px-3">{lang === "en" ? "Nakshatra" : "नक्षत्र (चरण)"}</th>
                          <th className="py-2.5 px-3">{lang === "en" ? "House" : "भाव"}</th>
                          <th className="py-2.5 px-3">{lang === "en" ? "State" : "अवस्था"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {planets.map((p: ApiData, idx: number) => (
                          <tr key={idx} className="hover:bg-surface-alt/40 transition">
                            <td className="py-2.5 px-3 font-bold text-ink flex items-center gap-1.5">
                              <span>{p.name || p.planet}</span>
                              {p.is_combust && <span className="text-[10px] text-red-600 font-bold" title="Combust">(अस्त)</span>}
                            </td>
                            <td className="py-2.5 px-3">{p.sign?.name || p.rashi_name}</td>
                            <td className="py-2.5 px-3 font-mono">{Number(p.norm_degree ?? p.degree ?? 0).toFixed(2)}°</td>
                            <td className="py-2.5 px-3 text-ink-soft">
                              {p.nakshatra?.name ? `${p.nakshatra.name} (${p.nakshatra.pada || 1})` : "-"}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-accent">{p.house || p.bhava || "-"}</td>
                            <td className="py-2.5 px-3">
                              {p.is_retrograde || p.speed < 0 ? (
                                <ResultBadge tone="bad">{lang === "en" ? "Retrograde" : "वक्री"}</ResultBadge>
                              ) : (
                                <ResultBadge tone="good">{lang === "en" ? "Direct" : "मार्गी"}</ResultBadge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ResultSection>
              )}

              {/* 5. Classical Yogas */}
              {yogas.length > 0 && (
                <ResultSection title={lang === "en" ? `Classical Yogas Identified (${yogas.length})` : `कुंडली में निर्मित शास्त्रीय योग (${yogas.length})`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {yogas.map((yoga: ApiData, index: number) => (
                      <article key={index} className="rounded-md border border-line bg-card p-4 hover:border-accent/40 transition">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-ink">{yoga.name}</h3>
                          <ResultBadge tone={yoga.is_cancelled ? "neutral" : yoga.category?.includes("Arishta") ? "bad" : "good"}>
                            {yoga.strength || "ACTIVE"}
                          </ResultBadge>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-ink-soft">{yoga.description}</p>
                        <div className="mt-2 text-[11px] text-ink-muted">
                          {lang === "en" ? "Affiliated House" : "संबद्ध भाव"}: <span className="font-semibold text-ink">{yoga.house || "-"}</span>
                          {Array.isArray(yoga.planets) && yoga.planets.length > 0 && ` · ${yoga.planets.join(", ")}`}
                        </div>
                      </article>
                    ))}
                  </div>
                </ResultSection>
              )}

              {/* 6. Shadbala Planetary Potency */}
              {strengths.length > 0 && (
                <ResultSection title={lang === "en" ? "Planetary Strength (Shadbala & Rupas)" : "षड्बल एवं ग्रहीय सामर्थ्य"}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-surface-alt text-ink-soft uppercase text-[11px]">
                        <tr>
                          <th className="px-3 py-2">{lang === "en" ? "Planet" : "ग्रह"}</th>
                          <th className="px-3 py-2">{lang === "en" ? "Obtained (Rupas)" : "प्राप्त रूप"}</th>
                          <th className="px-3 py-2">{lang === "en" ? "Required (Min)" : "न्यूनतम आवश्यक"}</th>
                          <th className="px-3 py-2">{lang === "en" ? "Potency Ratio" : "सामर्थ्य अनुपात"}</th>
                          <th className="px-3 py-2">{lang === "en" ? "Verdict" : "निर्णय"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {strengths.map((planet: ApiData, index: number) => (
                          <tr key={index} className="hover:bg-surface-alt/40 transition">
                            <td className="px-3 py-2.5 font-bold text-ink">{planet.planet_name}</td>
                            <td className="px-3 py-2.5 font-mono">{planet.total_shadbala_rupas}</td>
                            <td className="px-3 py-2.5 font-mono text-ink-muted">{planet.minimum_required_rupas}</td>
                            <td className="px-3 py-2.5 font-mono">{planet.strength_ratio ?? (planet.total_shadbala_rupas / planet.minimum_required_rupas).toFixed(2)}x</td>
                            <td className="px-3 py-2.5">
                              <ResultBadge tone={planet.verdict === "STRONG_CAPABLE" ? "good" : "bad"}>
                                {planet.verdict === "STRONG_CAPABLE" ? (lang === "en" ? "Strong" : "सबल") : (lang === "en" ? "Deficient" : "निर्बल")}
                              </ResultBadge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ResultSection>
              )}

              {/* 7. Comprehensive 12 Houses Bhavaphala & Remedies */}
              {houses.length > 0 && (
                <ResultSection title={lang === "en" ? "12-House Bhavaphala & Predictions" : "द्वादश भाव फल एवं जीवन फलादेश"}>
                  <div className="space-y-3">
                    {houses.map((house: ApiData) => (
                      <details key={house.house} className="group rounded-md border border-line bg-card open:bg-surface-alt/25 transition">
                        <summary className="cursor-pointer list-none p-4 flex items-center justify-between gap-3">
                          <span className="flex items-center gap-3">
                            <span className="text-xl">{house.icon || "🏛️"}</span>
                            <span>
                              <span className="block text-sm font-bold text-ink">{house.name}</span>
                              <span className="block mt-0.5 text-[11px] text-ink-muted">
                                {house.sign} · {lang === "en" ? "Lord" : "स्वामी"}: <strong className="text-ink">{house.sign_lord}</strong>
                              </span>
                            </span>
                          </span>
                          <ResultBadge tone={Number(house.potency_score) >= 60 ? "good" : "neutral"}>
                            {house.potency_score}/100
                          </ResultBadge>
                        </summary>
                        <div className="px-4 pb-4 border-t border-line/60 pt-3 space-y-2.5">
                          <p className="text-xs font-semibold text-accent">{house.domain}</p>
                          <p className="text-xs leading-5 text-ink-soft">{house.prediction}</p>
                          {house.remedy && (
                            <div className="rounded-lg bg-accent-soft/40 p-3 text-xs leading-5 text-ink border border-accent/20">
                              <span className="font-bold text-accent">{lang === "en" ? "Classical Remedy: " : "ज्योतिषीय उपाय: "}</span>
                              {house.remedy}
                            </div>
                          )}
                          {Array.isArray(house.occupant_planets) && house.occupant_planets.length > 0 && (
                            <p className="text-[11px] text-ink-muted">
                              {lang === "en" ? "Occupant Planets" : "भाव में स्थित ग्रह"}: <strong className="text-ink">{house.occupant_planets.join(", ")}</strong>
                            </p>
                          )}
                        </div>
                      </details>
                    ))}
                  </div>
                </ResultSection>
              )}
            </div>
          )}
    </>
  );

  return (
    <CalculatorPageShell
      slug="lagna-kundli"
      category="kundli"
      title="Lagna Kundli (D1)"
      hindiTitle="जन्म लग्न पत्रिका"
      description={description}
      icon="🪐"
      locale={locale}
      form={formContent}
      results={resultsContent}
    />
  );
}
