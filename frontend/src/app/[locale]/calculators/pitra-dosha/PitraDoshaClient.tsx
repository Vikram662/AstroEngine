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
    error: "पितृ दोष गणना विफल रही।",
    calculating: "नवम भाव व सूर्य स्थिति जांची जा रही है...",
    submit: "पितृ दोष विश्लेषण करें",
    emptyHint: "नवम भाव (धर्म/पितृ भाव), सूर्य एवं राहु-केतु युति जनित दोष का परीक्षण करें।",
    loadingHint: "सूर्य, नवमेश एवं पूर्वज ऋण योगों की गणना हो रही है...",
    resultTitle: "पितृ दोष निष्कर्ष",
    verdictLabel: "विश्लेषण परिणाम",
    present: "पितृ दोष के संकेत उपस्थित हैं",
    absent: "पितृ दोष नहीं है (शुभ)",
    severityLabel: "तीव्रता:",
    statusLabel: "दोष स्थिति",
    active: "सक्रिय",
    doshaFree: "दोष मुक्त",
    affectedHousesLabel: "संबंधित भाव",
    factorsTitle: "दोष कारक ग्रह योग",
    remediesTitle: "पितृ शांति एवं तर्पण उपाय",
  },
  en: {
    error: "Pitra Dosha calculation failed.",
    calculating: "Checking the 9th house and Sun's placement...",
    submit: "Analyze Pitra Dosha",
    emptyHint: "Check for dosha arising from the 9th house (Dharma/ancestor house), Sun, and Rahu-Ketu conjunctions.",
    loadingHint: "Calculating Sun, 9th lord, and ancestral debt yogas...",
    resultTitle: "Pitra Dosha Result",
    verdictLabel: "Analysis Result",
    present: "Indicators of Pitra Dosha are present",
    absent: "No Pitra Dosha (Auspicious)",
    severityLabel: "Severity:",
    statusLabel: "Dosha Status",
    active: "Active",
    doshaFree: "Dosha-free",
    affectedHousesLabel: "Affected Houses",
    factorsTitle: "Contributing Planetary Yogas",
    remediesTitle: "Pitra Shanti & Tarpan Remedies",
  },
} as const;

export default function PitraDoshaClient({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

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
      const res = await axios.post("/api/proxy", {
        endpoint: "/api/v1/dosha-matching/pitra-dosha",
        payload,
        method: "POST",
      });

      if (res.data?.data) {
        setData(res.data.data);
      } else {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || s.error);
    } finally {
      setLoading(false);
    }
  };

  const isPresent = data?.is_present || data?.has_pitra_dosha || false;

  return (
    <CalculatorPageShell
      slug="pitra-dosha"
      category="dosha"
      title="Pitra Dosha Calculator"
      hindiTitle="पितृ दोष एवं शांति"
      description={locale === "en" ? "Scripture-based analysis of ancestral debt from the 9th house and Sun-Rahu conjunctions." : "नवम भाव, सूर्य एवं राहु युति जनित पूर्वजों के ऋण का शास्त्रोक्त विश्लेषण।"}
      icon="☀️"
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

          {!data && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">☀️</div>
              <p className="text-sm">{s.emptyHint}</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">{s.loadingHint}</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              <ResultSection title={s.resultTitle}>
                <div
                  className={`p-6 rounded-xl border text-center mb-4 ${
                    isPresent
                      ? "bg-rose-50 border-rose-200 text-rose-950"
                      : "bg-emerald-50 border-emerald-200 text-emerald-900"
                  }`}
                >
                  <div className="text-xs uppercase font-bold tracking-wider mb-1">
                    {s.verdictLabel}
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold">
                    {isPresent ? s.present : s.absent}
                  </div>
                  {data.severity && (
                    <div className="text-xs mt-2 text-ink-muted font-medium">{s.severityLabel} {data.severity}</div>
                  )}
                </div>

                <ResultRow
                  label={s.statusLabel}
                  value={
                    isPresent ? (
                      <ResultBadge tone="bad">{s.active}</ResultBadge>
                    ) : (
                      <ResultBadge tone="good">{s.doshaFree}</ResultBadge>
                    )
                  }
                  accent
                />
                {data.affected_houses && (
                  <ResultRow
                    label={s.affectedHousesLabel}
                    value={Array.isArray(data.affected_houses) ? data.affected_houses.join(", ") : String(data.affected_houses)}
                  />
                )}
              </ResultSection>

              {(data.reasons || data.factors) && (data.reasons || data.factors).length > 0 && (
                <ResultSection title={s.factorsTitle}>
                  <ul className="space-y-2 text-xs">
                    {(data.reasons || data.factors).map((f: any, idx: number) => (
                      <li key={idx} className="p-3 bg-surface-alt rounded-lg border border-line text-ink">
                        {typeof f === "string" ? f : f.description || f.rule}
                      </li>
                    ))}
                  </ul>
                </ResultSection>
              )}

              {data.remedies && data.remedies.length > 0 && (
                <ResultSection title={s.remediesTitle}>
                  <ul className="space-y-1.5 text-xs text-ink-soft list-disc list-inside">
                    {data.remedies.map((r: any, idx: number) => (
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
