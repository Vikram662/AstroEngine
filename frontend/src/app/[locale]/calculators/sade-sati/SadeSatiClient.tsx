"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

const STRINGS = {
  hi: {
    error: "शनि साढ़े साती गणना विफल रही।",
    calculating: "शनि गोचर ट्रैक हो रहा है...",
    submit: "साढ़े साती स्थिति जांचें",
    emptyHint: "जन्म विवरण दर्ज करें और वर्तमान साढ़े साती चरण या ढैया का विश्लेषण प्राप्त करें।",
    loadingHint: "गोचर शनि एवं जन्म चंद्र के 12वें, 1ले व 2रे भावों की गणना जारी है...",
    resultTitle: "वर्तमान साढ़े साती स्थिति",
    transitLabel: "वर्तमान गोचर प्रभाव",
    sadeSatiOn: "शनि साढ़े साती चल रही है",
    dhaiyaOn: "शनि की ढैया चल रही है",
    neither: "साढ़े साती या ढैया का प्रभाव नहीं है",
    phaseLabel: "चरण:",
    natalMoonLabel: "जन्म चंद्र राशि",
    transitSaturnLabel: "वर्तमान गोचर शनि राशि",
    phaseStatusLabel: "शनि साढ़े साती चरण",
    activeFallback: "सक्रिय",
    free: "मुक्त",
    timelineTitle: "जीवनपर्यन्त साढ़े साती चक्र (Timeline)",
    colStage: "जीवन चरण",
    colPhase: "चरण",
    colDuration: "अवधि",
    colSaturnSign: "शनि राशि",
    remediesTitle: "शनि शांति उपाय",
  },
  en: {
    error: "Shani Sade Sati calculation failed.",
    calculating: "Tracking Saturn's transit...",
    submit: "Check Sade Sati Status",
    emptyHint: "Enter your birth details to see your current Sade Sati phase or Dhaiya analysis.",
    loadingHint: "Calculating transiting Saturn against the 12th, 1st, and 2nd houses from your natal Moon...",
    resultTitle: "Current Sade Sati Status",
    transitLabel: "Current Transit Effect",
    sadeSatiOn: "Shani Sade Sati is active",
    dhaiyaOn: "Shani Dhaiya is active",
    neither: "No Sade Sati or Dhaiya effect",
    phaseLabel: "Phase:",
    natalMoonLabel: "Natal Moon Sign",
    transitSaturnLabel: "Current Transit Saturn Sign",
    phaseStatusLabel: "Sade Sati Phase",
    activeFallback: "Active",
    free: "Free",
    timelineTitle: "Lifetime Sade Sati Cycle (Timeline)",
    colStage: "Life Stage",
    colPhase: "Phase",
    colDuration: "Duration",
    colSaturnSign: "Saturn Sign",
    remediesTitle: "Shani Shanti Remedies",
  },
} as const;

export default function SadeSatiClient({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
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
      setError(err?.response?.data?.message || err?.message || s.error);
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
      description={locale === "en" ? "The rising, peak, and setting phases, Dhaiya, and a lifetime timeline of Saturn's transit." : "उदय, शिखर एवं अस्त चरण, ढैया एवं जीवनपर्यंत शनि गोचर की समय सारिणी।"}
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
                  <Loader2 className="w-4 h-4 animate-spin" /> {s.calculating}
                </>
              ) : (
                s.submit
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {error && <ErrorNote message={error} />}

          {!statusData && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">🪐</div>
              <p className="text-sm">{s.emptyHint}</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">{s.loadingHint}</p>
            </div>
          )}

          {statusData && (
            <div className="space-y-6">
              <ResultSection title={s.resultTitle}>
                <div
                  className={`p-6 rounded-xl border text-center mb-4 ${
                    isUnderSadeSati
                      ? "bg-rose-50 border-rose-200 text-rose-950"
                      : isDhaiya
                      ? "bg-amber-50 border-amber-200 text-amber-950"
                      : "bg-emerald-50 border-emerald-200 text-emerald-900"
                  }`}
                >
                  <div className="text-xs uppercase font-bold tracking-wider mb-1">
                    {s.transitLabel}
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold">
                    {isUnderSadeSati ? s.sadeSatiOn : isDhaiya ? s.dhaiyaOn : s.neither}
                  </div>
                  {statusData.phase && (
                    <div className="text-sm font-semibold mt-2">
                      {s.phaseLabel} {statusData.phase}
                    </div>
                  )}
                </div>

                {statusData.natal_moon_sign && (
                  <ResultRow label={s.natalMoonLabel} value={statusData.natal_moon_sign} accent />
                )}
                {statusData.transit_saturn_sign && (
                  <ResultRow label={s.transitSaturnLabel} value={statusData.transit_saturn_sign} />
                )}
                <ResultRow
                  label={s.phaseStatusLabel}
                  value={
                    isUnderSadeSati ? (
                      <ResultBadge tone="bad">{statusData.phase || s.activeFallback}</ResultBadge>
                    ) : (
                      <ResultBadge tone="good">{s.free}</ResultBadge>
                    )
                  }
                />
              </ResultSection>

              {timelineData.length > 0 && (
                <ResultSection title={s.timelineTitle}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                        <tr>
                          <th className="py-2 px-3">{s.colStage}</th>
                          <th className="py-2 px-3">{s.colPhase}</th>
                          <th className="py-2 px-3">{s.colDuration}</th>
                          <th className="py-2 px-3">{s.colSaturnSign}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {timelineData.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-surface-alt/40 transition">
                            <td className="py-2.5 px-3 font-semibold text-ink">{item.stage}</td>
                            <td className="py-2.5 px-3">{item.phase}</td>
                            <td className="py-2.5 px-3 font-mono-brand">{item.years}</td>
                            <td className="py-2.5 px-3">{item.sign || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ResultSection>
              )}

              {statusData.remedies && statusData.remedies.length > 0 && (
                <ResultSection title={s.remediesTitle}>
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
