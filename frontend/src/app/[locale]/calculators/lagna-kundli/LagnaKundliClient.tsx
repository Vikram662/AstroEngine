"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";
import type { Locale } from "@/lib/locale";

export default function LagnaKundliClient({ locale }: { locale: Locale }) {
  const [form, setForm] = useState<BirthDataValue>(() => ({
    ...DEFAULT_BIRTH_DATA,
    cityName: locale === "en" ? "New Delhi, India" : "नई दिल्ली, भारत",
  }));
  const lang = locale;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [svgChart, setSvgChart] = useState<string>("");
  const [houseData, setHouseData] = useState<any>(null);
  const [yogaData, setYogaData] = useState<any>(null);
  const [strengthData, setStrengthData] = useState<any>(null);

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
      const requests = await Promise.allSettled([
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
      ]);

      if (requests[0].status !== "fulfilled") throw requests[0].reason;
      const resData = requests[0].value;
      const resSvg = requests[1].status === "fulfilled" ? requests[1].value : null;
      const responseData = (index: number) => requests[index].status === "fulfilled"
        ? (requests[index].value.data?.data || requests[index].value.data)
        : null;

      if (resData.data?.data) {
        setChartData(resData.data.data);
      } else {
        setChartData(resData.data);
      }

      if (resSvg?.data && typeof resSvg.data === "string" && resSvg.data.includes("<svg")) {
        setSvgChart(resSvg.data);
      }
      setHouseData(responseData(2));
      setYogaData(responseData(3));
      setStrengthData(responseData(4));
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
    ? Object.values(strengthData.shadbala) as any[]
    : [];

  const description =
    locale === "en"
      ? "High-precision Vedic calculation of physical build, temperament, life path, and the ascendant house."
      : "शारीरिक गठन, स्वभाव, जीवन दिशा और लग्न भाव की उच्च-सटीक गणना।";

  return (
    <CalculatorPageShell
      slug="lagna-kundli"
      category="kundli"
      title="Lagna Kundli (D1)"
      hindiTitle="जन्म लग्न पत्रिका"
      description={description}
      icon="🪐"
      locale={locale}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className={`${chartData ? "lg:col-span-12" : "lg:col-span-4"} bg-card p-6 rounded-2xl border border-line h-fit`}>
          <form onSubmit={handleSubmit} className="space-y-5">

            <BirthDataFields value={form} onChange={setForm} />

            <SubmitButton loading={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {lang === "en" ? "Generating Lagna Chart..." : "लग्न चक्र तैयार हो रहा है..."}
                </>
              ) : (
                lang === "en" ? "Calculate Lagna Chart" : "लग्न चक्र निकालें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className={`${chartData ? "lg:col-span-12" : "lg:col-span-8"} space-y-6`}>
          {error && <ErrorNote message={error} />}

          {!chartData && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">🪐</div>
              <p className="text-sm">
                {lang === "en" 
                  ? "Enter birth details and click 'Calculate Lagna Chart'." 
                  : "जन्म विवरण दर्ज करें और 'लग्न चक्र निकालें' पर क्लिक करें।"}
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">
                {lang === "en"
                  ? "Calculating high-precision Vedic ascendant and planetary positions..."
                  : "वैदिक लग्न एवं नवग्रह स्थिति की गणना हो रही है..."}
              </p>
            </div>
          )}

          {chartData && (
            <div className="space-y-6">
              {svgChart && (
                <ResultSection title={lang === "en" ? "Lagna Kundli (D1 Chart)" : "लग्न कुंडली (D1 चक्र)"}>
                  <div
                    className="w-full max-w-md mx-auto aspect-square flex items-center justify-center bg-surface-alt/50 rounded-xl p-2 border border-line/60"
                    dangerouslySetInnerHTML={{ __html: svgChart }}
                  />
                </ResultSection>
              )}

              <ResultSection title={lang === "en" ? "Ascendant & Key Points" : "लग्न एवं प्रमुख बिंदु"}>
                <ResultRow
                  label={lang === "en" ? "Ascendant Sign" : "लग्न राशि"}
                  value={
                    <span className="flex items-center gap-2">
                      <span>{ascendant?.sign?.name || ascendant?.rashi_name || (lang === "en" ? "Aries" : "मेष")}</span>
                      {(ascendant?.norm_degree ?? ascendant?.degree) !== undefined && (
                        <ResultBadge tone="accent">{Number(ascendant.norm_degree ?? ascendant.degree).toFixed(2)}°</ResultBadge>
                      )}
                    </span>
                  }
                  accent
                />
                {ascendant?.nakshatra?.name && (
                  <ResultRow 
                    label={lang === "en" ? "Ascendant Nakshatra" : "लग्न नक्षत्र"} 
                    value={lang === "en" ? `${ascendant.nakshatra.name} (Pada ${ascendant.nakshatra.pada || 1})` : `${ascendant.nakshatra.name} (चरण ${ascendant.nakshatra.pada || 1})`} 
                  />
                )}
                {ascendant?.nakshatra?.lord && (
                  <ResultRow label={lang === "en" ? "Nakshatra Lord" : "नक्षत्र स्वामी"} value={ascendant.nakshatra.lord} />
                )}
              </ResultSection>

              {planets.length > 0 && (
                <ResultSection title={lang === "en" ? "Planetary Positions & Houses" : "ग्रह स्थिति एवं भाव"}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                        <tr>
                          <th className="py-2 px-3">{lang === "en" ? "Planet" : "ग्रह"}</th>
                          <th className="py-2 px-3">{lang === "en" ? "Sign" : "राशि"}</th>
                          <th className="py-2 px-3">{lang === "en" ? "Degree" : "अंश"}</th>
                          <th className="py-2 px-3">{lang === "en" ? "House" : "भाव"}</th>
                          <th className="py-2 px-3">{lang === "en" ? "State" : "स्थिति"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {planets.map((p: any, idx: number) => (
                          <tr key={idx} className="hover:bg-surface-alt/40 transition">
                            <td className="py-2.5 px-3 font-bold text-ink">{p.name || p.planet}</td>
                            <td className="py-2.5 px-3">{p.sign?.name || p.rashi_name}</td>
                            <td className="py-2.5 px-3 font-mono">{Number(p.norm_degree ?? p.degree ?? 0).toFixed(2)}°</td>
                            <td className="py-2.5 px-3 font-semibold">{p.house || p.bhava || "-"}</td>
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

              {yogas.length > 0 && (
                <ResultSection title={lang === "en" ? `Classical Yogas (${yogas.length})` : `शास्त्रीय योग (${yogas.length})`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {yogas.map((yoga: any, index: number) => (
                      <article key={index} className="rounded-xl border border-line bg-surface-alt/40 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-ink">{yoga.name}</h3>
                          <ResultBadge tone={yoga.is_cancelled ? "neutral" : yoga.category?.includes("Arishta") ? "bad" : "good"}>{yoga.strength || "ACTIVE"}</ResultBadge>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-ink-soft">{yoga.description}</p>
                        <div className="mt-2 text-[11px] text-ink-muted">{lang === "en" ? "House" : "भाव"}: {yoga.house || "-"} · {Array.isArray(yoga.planets) ? yoga.planets.join(", ") : ""}</div>
                      </article>
                    ))}
                  </div>
                </ResultSection>
              )}

              {strengths.length > 0 && (
                <ResultSection title={lang === "en" ? "Planetary Strength (Shadbala)" : "ग्रह बल (षड्बल)"}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-surface-alt text-ink-soft"><tr><th className="px-3 py-2">{lang === "en" ? "Planet" : "ग्रह"}</th><th className="px-3 py-2">{lang === "en" ? "Obtained" : "प्राप्त रूप"}</th><th className="px-3 py-2">{lang === "en" ? "Required" : "आवश्यक"}</th><th className="px-3 py-2">{lang === "en" ? "Verdict" : "निर्णय"}</th></tr></thead>
                      <tbody className="divide-y divide-line/60">{strengths.map((planet: any, index: number) => <tr key={index}><td className="px-3 py-2.5 font-bold text-ink">{planet.planet_name}</td><td className="px-3 py-2.5">{planet.total_shadbala_rupas}</td><td className="px-3 py-2.5">{planet.minimum_required_rupas}</td><td className="px-3 py-2.5"><ResultBadge tone={planet.verdict === "STRONG_CAPABLE" ? "good" : "bad"}>{planet.verdict === "STRONG_CAPABLE" ? (lang === "en" ? "Strong" : "सबल") : (lang === "en" ? "Needs support" : "निर्बल")}</ResultBadge></td></tr>)}</tbody>
                    </table>
                  </div>
                </ResultSection>
              )}

              {houses.length > 0 && (
                <ResultSection title={lang === "en" ? "Detailed 12-House Reading" : "विस्तृत 12 भाव फल"}>
                  <div className="space-y-3">
                    {houses.map((house: any) => (
                      <details key={house.house} className="group rounded-xl border border-line bg-card open:bg-surface-alt/30">
                        <summary className="cursor-pointer list-none p-4 flex items-center justify-between gap-3">
                          <span className="flex items-center gap-3"><span className="text-xl">{house.icon}</span><span><span className="block text-sm font-bold text-ink">{house.name}</span><span className="block mt-0.5 text-[11px] text-ink-muted">{house.sign} · {lang === "en" ? "Lord" : "स्वामी"} {house.sign_lord}</span></span></span>
                          <ResultBadge tone={Number(house.potency_score) >= 60 ? "good" : "neutral"}>{house.potency_score}/100</ResultBadge>
                        </summary>
                        <div className="px-4 pb-4 border-t border-line/60 pt-3 space-y-2">
                          <p className="text-xs font-semibold text-ink-soft">{house.domain}</p>
                          <p className="text-xs leading-5 text-ink-soft">{house.prediction}</p>
                          {house.remedy && <div className="rounded-lg bg-accent-soft/50 p-3 text-xs leading-5 text-ink"><span className="font-bold">{lang === "en" ? "Remedy: " : "उपाय: "}</span>{house.remedy}</div>}
                          {Array.isArray(house.occupant_planets) && house.occupant_planets.length > 0 && <p className="text-[11px] text-ink-muted">{lang === "en" ? "Occupants" : "स्थित ग्रह"}: {house.occupant_planets.join(", ")}</p>}
                        </div>
                      </details>
                    ))}
                  </div>
                </ResultSection>
              )}
            </div>
          )}
        </div>
      </div>
    </CalculatorPageShell>
  );
}
