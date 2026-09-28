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
    error: "मांगलिक दोष गणना विफल रही।",
    calculating: "मंगल स्थिति विश्लेषित हो रही है...",
    submit: "मांगलिक दोष जांचें",
    emptyHint: "जन्म विवरण भरें और 1, 4, 7, 8, 12 भावों में मंगल दोष व परिहार नियम देखें।",
    loadingHint: "लग्न, चंद्र एवं शुक्र से कुज दोष एवं 12 शास्त्रीय अपवादों की गणना जारी है...",
    resultTitle: "मांगलिक दोष परिणाम",
    finalStatus: "अंतिम स्थिति",
    noDosha: "मांगलिक दोष नहीं है (No Manglik Dosha)",
    cancelled: "दोष प्रभावहीन / निरस्त (Cancelled by Exceptions)",
    present: "मांगलिक दोष उपस्थित है (Manglik Dosha Present)",
    highSeverity: "उच्च तीव्रता",
    normalCancelled: "सामान्य / निरस्त",
    marsHouseLabel: "मंगल भाव, लग्न से (Mars House from Lagna)",
    house: (n: number) => `${n}वां भाव`,
    houseOutside: (n: number) => `${n}वां भाव (1, 4, 7, 8, 12 से बाहर)`,
    outsideFallback: "1, 4, 7, 8, 12 से बाहर",
    severityPercent: "दोष तीव्रता प्रतिशत",
    exceptionApplied: "अपवाद लागू",
    yesCancelled: "हाँ (दोष निरस्त)",
    no: "नहीं",
    cancellationsTitle: "लागू हुए शास्त्रीय अपवाद (Cancellations)",
    remediesTitle: "शास्त्रसम्मत उपाय (Remedies)",
  },
  en: {
    error: "Manglik Dosha calculation failed.",
    calculating: "Analyzing Mars placement...",
    submit: "Check Manglik Dosha",
    emptyHint: "Fill in your birth details to see Manglik Dosha from houses 1, 4, 7, 8, 12 and its cancellation rules.",
    loadingHint: "Calculating Kuja Dosha from Lagna, Moon, and Venus, and checking all 12 classical exceptions...",
    resultTitle: "Manglik Dosha Result",
    finalStatus: "Final Verdict",
    noDosha: "No Manglik Dosha",
    cancelled: "Neutralized / Cancelled by Exceptions",
    present: "Manglik Dosha Present",
    highSeverity: "High Severity",
    normalCancelled: "Normal / Cancelled",
    marsHouseLabel: "Mars House from Lagna",
    house: (n: number) => `House ${n}`,
    houseOutside: (n: number) => `House ${n} (outside 1, 4, 7, 8, 12)`,
    outsideFallback: "Outside houses 1, 4, 7, 8, 12",
    severityPercent: "Dosha Severity %",
    exceptionApplied: "Exception Applied",
    yesCancelled: "Yes (Dosha Cancelled)",
    no: "No",
    cancellationsTitle: "Classical Cancellations Applied",
    remediesTitle: "Classical Remedies",
  },
} as const;

export default function ManglikDoshaClient({ locale }: { locale: Locale }) {
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
        endpoint: "/api/v1/dosha-matching/manglik",
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

  const isManglik = data?.is_manglik || data?.is_present || false;
  const isCancelled = data?.is_cancelled || false;
  const exceptions = data?.cancellation_reasons || data?.exceptions_applied || data?.cancellations || [];
  const marsHouseFromLagna = data?.mars_placements?.house_from_lagna ?? data?.mars_house;

  return (
    <CalculatorPageShell
      slug="manglik-dosha"
      category="dosha"
      title="Manglik Dosha Analyser"
      hindiTitle="मांगलिक दोष विश्लेषण"
      description={locale === "en" ? "Mars in houses 1, 4, 7, 8, or 12 from Lagna, Moon, and Venus — plus all 12 classical cancellation rules." : "लग्न, चंद्र व शुक्र से 1, 4, 7, 8, 12 भावों में मंगल की स्थिति और 12 शास्त्रीय अपवाद।"}
      icon="🔥"
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
              <div className="text-4xl mb-3">🔥</div>
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
                    !isManglik || isCancelled
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
                >
                  <div className="text-xs uppercase font-bold tracking-wider mb-1">
                    {s.finalStatus}
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold">
                    {!isManglik ? s.noDosha : isCancelled ? s.cancelled : s.present}
                  </div>
                  <div className="text-xs mt-2 opacity-90">
                    {data.severity || (isManglik && !isCancelled ? s.highSeverity : s.normalCancelled)}
                  </div>
                </div>

                <ResultRow
                  label={s.marsHouseLabel}
                  value={
                    marsHouseFromLagna !== undefined && [1, 4, 7, 8, 12].includes(Number(marsHouseFromLagna))
                      ? s.house(marsHouseFromLagna)
                      : marsHouseFromLagna !== undefined
                      ? s.houseOutside(marsHouseFromLagna)
                      : s.outsideFallback
                  }
                  accent
                />
                {data.percentage !== undefined && (
                  <ResultRow
                    label={s.severityPercent}
                    value={<ResultBadge tone={data.percentage > 50 ? "bad" : "neutral"}>{data.percentage}%</ResultBadge>}
                  />
                )}
                <ResultRow
                  label={s.exceptionApplied}
                  value={
                    isCancelled ? (
                      <ResultBadge tone="good">{s.yesCancelled}</ResultBadge>
                    ) : (
                      <ResultBadge tone="neutral">{s.no}</ResultBadge>
                    )
                  }
                />
              </ResultSection>

              {exceptions.length > 0 && (
                <ResultSection title={s.cancellationsTitle}>
                  <ul className="space-y-2 text-xs">
                    {exceptions.map((ex: any, idx: number) => (
                      <li key={idx} className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900">
                        {typeof ex === "string" ? ex : ex.rule || ex.description || JSON.stringify(ex)}
                      </li>
                    ))}
                  </ul>
                </ResultSection>
              )}

              {data.remedies && data.remedies.length > 0 && (
                <ResultSection title={s.remediesTitle}>
                  <ul className="space-y-1.5 text-xs text-ink-soft list-disc list-inside">
                    {data.remedies.map((rem: any, idx: number) => (
                      <li key={idx}>{typeof rem === "string" ? rem : rem.remedy || rem.name}</li>
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
