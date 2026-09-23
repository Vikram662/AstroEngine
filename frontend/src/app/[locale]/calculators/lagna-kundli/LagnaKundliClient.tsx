"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";
import type { Locale } from "@/lib/locale";

export default function LagnaKundliClient({ locale }: { locale: Locale }) {
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [svgChart, setSvgChart] = useState<string>("");

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
      const [resData, resSvg] = await Promise.all([
        axios.post("/api/demo/proxy", {
          endpoint: "/api/v1/parashari/chart/d1",
          payload,
          method: "POST",
        }),
        axios.post(
          "/api/demo/proxy",
          {
            endpoint: "/api/v1/parashari/chart/svg",
            payload,
            queryParams: { varga: "D1", chart_style: "NORTH_INDIAN" },
            method: "POST",
          },
          { responseType: "text" }
        ),
      ]);

      if (resData.data?.data) {
        setChartData(resData.data.data);
      } else {
        setChartData(resData.data);
      }

      if (resSvg.data && typeof resSvg.data === "string" && resSvg.data.includes("<svg")) {
        setSvgChart(resSvg.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "कुंडली गणना विफल रही।");
    } finally {
      setLoading(false);
    }
  };

  const ascendant = chartData?.ascendant || chartData?.lagna;
  const planets = chartData?.planets || [];

  return (
    <CalculatorPageShell
      slug="lagna-kundli"
      category="kundli"
      title="Lagna Kundli (D1)"
      hindiTitle="जन्म लग्न पत्रिका"
      description="शारीरिक गठन, स्वभाव, जीवन दिशा और लग्न भाव की उच्च-सटीक गणना।"
      icon="🪐"
      locale={locale}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-card p-6 rounded-2xl border border-line h-fit">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <span className="text-xs font-bold text-ink">भाषा / Language</span>
              <div className="flex rounded-lg bg-surface-alt p-1 border border-line text-xs">
                <button
                  type="button"
                  onClick={() => setLang("hi")}
                  className={`px-3 py-1 rounded font-medium transition ${
                    lang === "hi" ? "bg-accent text-white shadow" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  हिन्दी
                </button>
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`px-3 py-1 rounded font-medium transition ${
                    lang === "en" ? "bg-accent text-white shadow" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <BirthDataFields value={form} onChange={setForm} />

            <SubmitButton loading={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> लग्न चक्र तैयार हो रहा है...
                </>
              ) : (
                "लग्न चक्र निकालें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {error && <ErrorNote message={error} />}

          {!chartData && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">🪐</div>
              <p className="text-sm">जन्म विवरण दर्ज करें और "लग्न चक्र निकालें" पर क्लिक करें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">वैदिक लग्न एवं नवग्रह स्थिति की गणना हो रही है...</p>
            </div>
          )}

          {chartData && (
            <div className="space-y-6">
              {svgChart && (
                <ResultSection title="लग्न कुंडली (D1 Chart)">
                  <div
                    className="w-full max-w-md mx-auto aspect-square flex items-center justify-center bg-surface-alt/50 rounded-xl p-2 border border-line/60"
                    dangerouslySetInnerHTML={{ __html: svgChart }}
                  />
                </ResultSection>
              )}

              <ResultSection title="लग्न एवं प्रमुख बिंदु">
                <ResultRow
                  label="लग्न राशि (Ascendant)"
                  value={
                    <span className="flex items-center gap-2">
                      <span>{ascendant?.sign?.name || ascendant?.rashi_name || "मेष"}</span>
                      {(ascendant?.norm_degree ?? ascendant?.degree) !== undefined && (
                        <ResultBadge tone="accent">{Number(ascendant.norm_degree ?? ascendant.degree).toFixed(2)}°</ResultBadge>
                      )}
                    </span>
                  }
                  accent
                />
                {ascendant?.nakshatra?.name && (
                  <ResultRow label="लग्न नक्षत्र" value={`${ascendant.nakshatra.name} (चरण ${ascendant.nakshatra.pada || 1})`} />
                )}
                {ascendant?.nakshatra?.lord && (
                  <ResultRow label="नक्षत्र स्वामी" value={ascendant.nakshatra.lord} />
                )}
              </ResultSection>

              {planets.length > 0 && (
                <ResultSection title="ग्रह स्थिति एवं भाव">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                        <tr>
                          <th className="py-2 px-3">ग्रह</th>
                          <th className="py-2 px-3">राशि</th>
                          <th className="py-2 px-3">अंश</th>
                          <th className="py-2 px-3">भाव</th>
                          <th className="py-2 px-3">स्थिति</th>
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
                                <ResultBadge tone="bad">वक्री</ResultBadge>
                              ) : (
                                <ResultBadge tone="good">मार्गी</ResultBadge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
