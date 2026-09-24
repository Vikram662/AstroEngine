"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

export default function SadeSatiClient({ locale }: { locale: Locale }) {
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);

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
      const [resStatus, resTimeline] = await Promise.all([
        axios.post("/api/proxy", {
          endpoint: "/api/v1/dosha-matching/sade-sati/status",
          payload,
          method: "POST",
        }),
        axios.post("/api/proxy", {
          endpoint: "/api/v1/dosha-matching/sade-sati/timeline",
          payload,
          method: "POST",
        }).catch(() => null),
      ]);

      if (resStatus.data?.data) {
        setStatusData(resStatus.data.data);
      } else {
        setStatusData(resStatus.data);
      }

      const cycles = resTimeline?.data?.data?.lifetime_cycles || resTimeline?.data?.lifetime_cycles || [];
      const flatRows = Array.isArray(cycles)
        ? cycles.flatMap((cycle: any) =>
            (cycle.phases || []).map((ph: any) => ({
              stage: cycle.lifecycle_stage,
              phase: ph.phase,
              years: ph.approx_years,
              sign: ph.saturn_sign,
            }))
          )
        : [];
      setTimelineData(flatRows);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "शनि साढ़े साती गणना विफल रही।");
    } finally {
      setLoading(false);
    }
  };

  const isUnderSadeSati = statusData?.is_sadesati_active || statusData?.is_active || false;
  const isDhaiya = statusData?.is_dhaiya_active || false;

  return (
    <CalculatorPageShell
      slug="sade-sati"
      category="dosha"
      title="Shani Sade Sati Timeline"
      hindiTitle="शनि साढ़े साती चक्र"
      description="उदय, शिखर एवं अस्त चरण, ढैया एवं जीवनपर्यंत शनि गोचर की समय सारिणी।"
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
                  <Loader2 className="w-4 h-4 animate-spin" /> शनि गोचर ट्रैक हो रहा है...
                </>
              ) : (
                "साढ़े साती स्थिति जांचें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {error && <ErrorNote message={error} />}

          {!statusData && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">🪐</div>
              <p className="text-sm">जन्म विवरण दर्ज करें और वर्तमान साढ़े साती चरण या ढैया का विश्लेषण प्राप्त करें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">गोचर शनि एवं जन्म चंद्र के 12वें, 1ले व 2रे भावों की गणना जारी है...</p>
            </div>
          )}

          {statusData && (
            <div className="space-y-6">
              <ResultSection title="वर्तमान साढ़े साती स्थिति">
                <div
                  className={`p-6 rounded-xl border text-center mb-4 ${
                    isUnderSadeSati
                      ? "bg-amber-50 border-amber-200 text-amber-950"
                      : isDhaiya
                      ? "bg-indigo-50 border-indigo-200 text-indigo-950"
                      : "bg-emerald-50 border-emerald-200 text-emerald-900"
                  }`}
                >
                  <div className="text-xs uppercase font-bold tracking-wider mb-1">
                    वर्तमान गोचर प्रभाव
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold">
                    {isUnderSadeSati
                      ? "शनि साढ़े साती चल रही है"
                      : isDhaiya
                      ? "शनि की ढैया चल रही है"
                      : "साढ़े साती या ढैया का प्रभाव नहीं है"}
                  </div>
                  {statusData.phase && (
                    <div className="text-sm font-semibold mt-2">
                      चरण: {statusData.phase}
                    </div>
                  )}
                </div>

                {statusData.natal_moon_sign && (
                  <ResultRow label="जन्म चंद्र राशि" value={statusData.natal_moon_sign} accent />
                )}
                {statusData.transit_saturn_sign && (
                  <ResultRow label="वर्तमान गोचर शनि राशि" value={statusData.transit_saturn_sign} />
                )}
                <ResultRow
                  label="शनि साढ़े साती चरण"
                  value={
                    isUnderSadeSati ? (
                      <ResultBadge tone="bad">{statusData.phase || "सक्रिय"}</ResultBadge>
                    ) : (
                      <ResultBadge tone="good">मुक्त</ResultBadge>
                    )
                  }
                />
              </ResultSection>

              {timelineData.length > 0 && (
                <ResultSection title="जीवनपर्यन्त साढ़े साती चक्र (Timeline)">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                        <tr>
                          <th className="py-2 px-3">जीवन चरण</th>
                          <th className="py-2 px-3">चरण</th>
                          <th className="py-2 px-3">अवधि</th>
                          <th className="py-2 px-3">शनि राशि</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {timelineData.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-surface-alt/40 transition">
                            <td className="py-2.5 px-3 font-semibold text-ink">{item.stage}</td>
                            <td className="py-2.5 px-3">{item.phase}</td>
                            <td className="py-2.5 px-3 font-mono">{item.years}</td>
                            <td className="py-2.5 px-3">{item.sign || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ResultSection>
              )}

              {statusData.remedies && statusData.remedies.length > 0 && (
                <ResultSection title="शनि शांति उपाय">
                  <ul className="space-y-1.5 text-xs text-ink-soft list-disc list-inside">
                    {statusData.remedies.map((r: any, idx: number) => (
                      <li key={idx}>{typeof r === "string" ? r : r.remedy}</li>
                    ))}
                  </ul>
                </ResultSection>
              )}
            </div>
          )}
        </div>
      </div>
    </CalculatorPageShell>
  );
}
