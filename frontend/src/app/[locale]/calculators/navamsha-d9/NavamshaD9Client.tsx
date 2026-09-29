"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { fetchParallelSettled } from "@/lib/calculatorApi";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";
import { ApiData, toApiError } from "@/lib/apiTypes";

const STRINGS = {
  hi: {
    error: "नवांश गणना विफल रही।",
    calculating: "नवांश तैयार हो रहा है...",
    submit: "नवांश चक्र निकालें",
    emptyHint: "जन्म विवरण भरें और नवांश (D9) चक्र का विश्लेषण देखें।",
    loadingHint: "डी-9 नवांश लग्न एवं भाग्य भावों की गणना जारी है...",
    chartTitle: "नवांश चक्र (D9 Navamsha SVG)",
    summaryTitle: "नवांश लग्न सारांश",
    lagnaLabel: "नवांश लग्न (Navamsha Lagna)",
    lagnaFallback: "मेष",
    degreeLabel: "नवांश लग्न अंश",
    purposeLabel: "उद्देश्य",
    purposeValue: "विवाह सुख, भाग्य बल एवं उत्तरार्ध जीवन का सटीक दर्पण",
    planetsTitle: "नवांश में नवग्रह स्थिति",
    colPlanet: "ग्रह",
    colSign: "नवांश राशि",
    colHouse: "भाव",
    colVargottama: "वर्गोत्तम स्थिति",
    vargottama: "वर्गोत्तम (अति शुभ)",
    normal: "सामान्य",
  },
  en: {
    error: "Navamsha calculation failed.",
    calculating: "Building your Navamsha chart...",
    submit: "Get Navamsha Chart",
    emptyHint: "Fill in your birth details to see your Navamsha (D9) chart analysis.",
    loadingHint: "Calculating the D9 Navamsha ascendant and fortune houses...",
    chartTitle: "Navamsha Chart (D9 SVG)",
    summaryTitle: "Navamsha Lagna Summary",
    lagnaLabel: "Navamsha Lagna",
    lagnaFallback: "Aries",
    degreeLabel: "Navamsha Lagna Degree",
    purposeLabel: "Purpose",
    purposeValue: "A precise mirror of marital happiness, fortune strength, and the second half of life",
    planetsTitle: "Planetary Placements in Navamsha",
    colPlanet: "Planet",
    colSign: "Navamsha Sign",
    colHouse: "House",
    colVargottama: "Vargottama Status",
    vargottama: "Vargottama (Highly Auspicious)",
    normal: "Normal",
  },
} as const;

export default function NavamshaD9Client({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ApiData>(null);
  const [svgChart, setSvgChart] = useState<string>("");
  const [d1Signs, setD1Signs] = useState<Record<string, string>>({});
  const [specialPoints, setSpecialPoints] = useState<ApiData>(null);

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
      const [resData, resSvg, resD1, resSpecial] = await fetchParallelSettled([
        axios.post("/api/proxy", {
          endpoint: "/api/v1/parashari/chart/d9",
          payload,
          method: "POST",
        }),
        axios.post(
          "/api/proxy",
          {
            endpoint: "/api/v1/parashari/chart/svg",
            payload,
            queryParams: { varga: "D9", chart_style: "NORTH_INDIAN" },
            method: "POST",
          },
          { responseType: "text" }
        ),
        axios.post("/api/proxy", {
          endpoint: "/api/v1/parashari/chart/d1",
          payload,
          method: "POST",
        }),
        axios.post("/api/proxy", {
          endpoint: "/api/v1/parashari/special-points",
          payload,
          method: "POST",
        }),
      ]);

      if (!resData) throw new Error(s.error);

      setChartData(resData);

      if (resSvg && typeof resSvg === "string" && resSvg.includes("<svg")) {
        setSvgChart(resSvg);
      }

      if (resSpecial) {
        setSpecialPoints(resSpecial);
      }

      const d1Planets = resD1?.planets || [];
      const signMap: Record<string, string> = {};
      d1Planets.forEach((p: ApiData) => {
        if (p?.id && p?.sign?.id) signMap[p.id] = p.sign.id;
      });
      setD1Signs(signMap);
    } catch (errCaught) { const err = toApiError(errCaught);
      setError(err?.response?.data?.message || err?.message || s.error);
    } finally {
      setLoading(false);
    }
  };

  const ascendant = chartData?.ascendant || chartData?.lagna;
  const planets = chartData?.planets || [];

  const formContent = (
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
            <Loader2 className="w-4 h-4 animate-spin" /> {s.calculating}
          </>
        ) : (
          s.submit
        )}
      </SubmitButton>
    </form>
  );

  const resultsContent = (
    <>
      {error && <ErrorNote message={error} />}

      {!chartData && !loading && !error && (
        <div className="bg-card rounded-lg border border-line p-10 text-center text-ink-muted">
          <div className="text-4xl mb-3">✨</div>
          <p className="text-sm">{s.emptyHint}</p>
        </div>
      )}

      {loading && (
        <div className="bg-card rounded-lg border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
          <p className="text-sm">{s.loadingHint}</p>
        </div>
      )}

      {chartData && (
        <div className="space-y-6">
              {svgChart && (
                <ResultSection title={s.chartTitle}>
                  <div
                    className="w-full max-w-md mx-auto aspect-square flex items-center justify-center bg-surface-alt/50 rounded-md p-2 border border-line/60"
                    dangerouslySetInnerHTML={{ __html: svgChart }}
                  />
                </ResultSection>
              )}

              <ResultSection title={s.summaryTitle}>
                <ResultRow
                  label={s.lagnaLabel}
                  value={ascendant?.sign?.name || ascendant?.rashi_name || s.lagnaFallback}
                  accent
                />
                {(ascendant?.norm_degree ?? ascendant?.degree) !== undefined && (
                  <ResultRow label={s.degreeLabel} value={`${Number(ascendant.norm_degree ?? ascendant.degree).toFixed(2)}°`} />
                )}
                <ResultRow
                  label={s.purposeLabel}
                  value={s.purposeValue}
                />
              </ResultSection>

              {/* Pushkar Navamsha & Special Sensitive Points */}
              {specialPoints && (
                <ResultSection title={lang === "hi" ? "पुष्कर नवांश एवं गंडान्त विश्लेषण" : "Pushkar Navamsha & Sensitive Points"}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-surface-alt rounded-md border border-line">
                      <span className="font-bold text-ink block mb-1">पुष्कर नवांश (Pushkar Navamsha)</span>
                      <p className="text-ink-soft">
                        {specialPoints.pushkar_navamsha?.planets && specialPoints.pushkar_navamsha.planets.length > 0
                          ? `पुष्कर नवांश में स्थित ग्रह: ${specialPoints.pushkar_navamsha.planets.join(", ")} (अति शुभ व फलदायी)`
                          : "कोई भी ग्रह पुष्कर नवांश में नहीं है।"}
                      </p>
                    </div>
                    <div className="p-3 bg-surface-alt rounded-md border border-line">
                      <span className="font-bold text-ink block mb-1">नक्षत्र गंडान्त (Gandanta Degree)</span>
                      <p className="text-ink-soft">
                        {specialPoints.gandanta?.is_gandanta
                          ? `लग्न या चंद्र गंडान्त संधि में स्थित है (${specialPoints.gandanta.type})`
                          : "कुंडली गंडान्त दोष से मुक्त है।"}
                      </p>
                    </div>
                  </div>
                </ResultSection>
              )}

              {planets.length > 0 && (
                <ResultSection title={s.planetsTitle}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                        <tr>
                          <th className="py-2 px-3">{s.colPlanet}</th>
                          <th className="py-2 px-3">{s.colSign}</th>
                          <th className="py-2 px-3">{s.colHouse}</th>
                          <th className="py-2 px-3">{s.colVargottama}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {planets.map((p: ApiData, idx: number) => {
                          const isVargottama =
                            p.is_vargottama || p.vargottama || (p.id && d1Signs[p.id] && d1Signs[p.id] === p.sign?.id);
                          return (
                            <tr key={idx} className="hover:bg-surface-alt/40 transition">
                              <td className="py-2.5 px-3 font-bold text-ink">{p.name || p.planet}</td>
                              <td className="py-2.5 px-3">{p.sign?.name || p.rashi_name}</td>
                              <td className="py-2.5 px-3 font-semibold">{p.house || p.bhava || "-"}</td>
                              <td className="py-2.5 px-3">
                                {isVargottama ? (
                                  <ResultBadge tone="good">{s.vargottama}</ResultBadge>
                                ) : (
                                  <span className="text-ink-muted text-[11px]">{s.normal}</span>
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
    </>
  );

  return (
    <CalculatorPageShell
      slug="navamsha-d9"
      category="kundli"
      title="Navamsha Chart (D9)"
      hindiTitle="नवांश कुंडली (D9 Dharma, Spouse & Fortune)"
      description={locale === "en" ? "Fortune, married life, spouse nature, Pushkar Navamsha, and Vargottama planets." : "भाग्य, वैवाहिक जीवन, जीवनसाथी का स्वरूप, पुष्कर नवांश एवं वर्गोत्तम ग्रहों का सूक्ष्म विश्लेषण।"}
      icon="✨"
      locale={locale}
      form={formContent}
      results={resultsContent}
    />
  );
}
