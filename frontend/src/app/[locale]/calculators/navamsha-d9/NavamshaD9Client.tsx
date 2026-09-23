"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

export default function NavamshaD9Client({ locale }: { locale: Locale }) {
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [svgChart, setSvgChart] = useState<string>("");
  const [d1Signs, setD1Signs] = useState<Record<string, string>>({});

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
      const [resData, resSvg, resD1] = await Promise.all([
        axios.post("/api/demo/proxy", {
          endpoint: "/api/v1/parashari/chart/d9",
          payload,
          method: "POST",
        }),
        axios.post(
          "/api/demo/proxy",
          {
            endpoint: "/api/v1/parashari/chart/svg",
            payload,
            queryParams: { varga: "D9", chart_style: "NORTH_INDIAN" },
            method: "POST",
          },
          { responseType: "text" }
        ),
        axios.post("/api/demo/proxy", {
          endpoint: "/api/v1/parashari/chart/d1",
          payload,
          method: "POST",
        }),
      ]);

      if (resData.data?.data) {
        setChartData(resData.data.data);
      } else {
        setChartData(resData.data);
      }

      if (resSvg.data && typeof resSvg.data === "string" && resSvg.data.includes("<svg")) {
        setSvgChart(resSvg.data);
      }

      const d1Planets = resD1.data?.data?.planets || resD1.data?.planets || [];
      const signMap: Record<string, string> = {};
      d1Planets.forEach((p: any) => {
        if (p?.id && p?.sign?.id) signMap[p.id] = p.sign.id;
      });
      setD1Signs(signMap);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "नवांश गणना विफल रही।");
    } finally {
      setLoading(false);
    }
  };

  const ascendant = chartData?.ascendant || chartData?.lagna;
  const planets = chartData?.planets || [];

  return (
    <CalculatorPageShell
      slug="navamsha-d9"
      category="kundli"
      title="Navamsha Chart (D9)"
      hindiTitle="नवांश कुंडली (D9)"
      description="भाग्य, वैवाहिक जीवन, जीवनसाथी का स्वरूप एवं धर्म त्रिकोण विश्लेषण।"
      icon="✨"
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
                  <Loader2 className="w-4 h-4 animate-spin" /> नवांश तैयार हो रहा है...
                </>
              ) : (
                "नवांश चक्र निकालें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {error && <ErrorNote message={error} />}

          {!chartData && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">✨</div>
              <p className="text-sm">जन्म विवरण भरें और नवांश (D9) चक्र का विश्लेषण देखें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">डी-9 नवांश लग्न एवं भाग्य भावों की गणना जारी है...</p>
            </div>
          )}

          {chartData && (
            <div className="space-y-6">
              {svgChart && (
                <ResultSection title="नवांश चक्र (D9 Navamsha SVG)">
                  <div
                    className="w-full max-w-md mx-auto aspect-square flex items-center justify-center bg-surface-alt/50 rounded-xl p-2 border border-line/60"
                    dangerouslySetInnerHTML={{ __html: svgChart }}
                  />
                </ResultSection>
              )}

              <ResultSection title="नवांश लग्न सारांश">
                <ResultRow
                  label="नवांश लग्न (Navamsha Lagna)"
                  value={ascendant?.sign?.name || ascendant?.rashi_name || "मेष"}
                  accent
                />
                {(ascendant?.norm_degree ?? ascendant?.degree) !== undefined && (
                  <ResultRow label="नवांश लग्न अंश" value={`${Number(ascendant.norm_degree ?? ascendant.degree).toFixed(2)}°`} />
                )}
                <ResultRow
                  label="उद्देश्य"
                  value="विवाह सुख, भाग्य बल एवं उत्तरार्ध जीवन का सटीक दर्पण"
                />
              </ResultSection>

              {planets.length > 0 && (
                <ResultSection title="नवांश में नवग्रह स्थिति">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                        <tr>
                          <th className="py-2 px-3">ग्रह</th>
                          <th className="py-2 px-3">नवांश राशि</th>
                          <th className="py-2 px-3">भाव</th>
                          <th className="py-2 px-3">वर्गोत्तम स्थिति</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {planets.map((p: any, idx: number) => {
                          const isVargottama =
                            p.is_vargottama || p.vargottama || (p.id && d1Signs[p.id] && d1Signs[p.id] === p.sign?.id);
                          return (
                            <tr key={idx} className="hover:bg-surface-alt/40 transition">
                              <td className="py-2.5 px-3 font-bold text-ink">{p.name || p.planet}</td>
                              <td className="py-2.5 px-3">{p.sign?.name || p.rashi_name}</td>
                              <td className="py-2.5 px-3 font-semibold">{p.house || p.bhava || "-"}</td>
                              <td className="py-2.5 px-3">
                                {isVargottama ? (
                                  <ResultBadge tone="good">वर्गोत्तम (अति शुभ)</ResultBadge>
                                ) : (
                                  <span className="text-ink-muted text-[11px]">सामान्य</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
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
