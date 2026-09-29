"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { fetchParallelSettled } from "@/lib/calculatorApi";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";
import { ApiData, toApiError } from "@/lib/apiTypes";

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
  const [data, setData] = useState<ApiData>(null);
  const [mantraData, setMantraData] = useState<ApiData>(null);
  const [fastingData, setFastingData] = useState<ApiData>(null);

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
      const [manglik, mantras, fasting] = await fetchParallelSettled([
        axios.post("/api/proxy", {
          endpoint: "/api/v1/dosha-matching/manglik",
          payload,
          method: "POST",
        }),
        axios.post("/api/proxy", {
          endpoint: "/api/v1/remedies/mantras",
          payload,
          method: "POST",
        }),
        axios.post("/api/proxy", {
          endpoint: "/api/v1/remedies/fasting",
          payload,
          method: "POST",
        }),
      ]);

      if (!manglik) throw new Error(s.error);
      setData(manglik);
      if (mantras) setMantraData(mantras);
      if (fasting) setFastingData(fasting);
    } catch (errCaught) { const err = toApiError(errCaught);
      setError(err?.response?.data?.message || err?.message || s.error);
    } finally {
      setLoading(false);
    }
  };

  const isManglik = data?.is_manglik || data?.is_present || false;
  const isCancelled = data?.is_cancelled || false;
  const exceptions = data?.cancellation_reasons || data?.exceptions_applied || data?.cancellations || [];
  const marsPlacements = data?.mars_placements;
  const manglikFactors = data?.manglik_factors;
  const marsMantra = mantraData?.mantras?.MARS;

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

      {!data && !loading && !error && (
        <div className="bg-card rounded-lg border border-line p-10 text-center text-ink-muted">
          <div className="text-4xl mb-3">🔥</div>
          <p className="text-sm">{s.emptyHint}</p>
        </div>
      )}

      {loading && (
        <div className="bg-card rounded-lg border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
          <p className="text-sm">{s.loadingHint}</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <ResultSection title={s.resultTitle}>
                <div
                  className={`p-6 rounded-md border text-center mb-4 ${
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
                  <div className="text-xs mt-2 opacity-90 font-semibold">
                    {data.severity ? `दोष तीव्रता: ${data.severity}` : isManglik && !isCancelled ? s.highSeverity : s.normalCancelled}
                  </div>
                </div>

                {/* 3-Way Reference Evaluation: Lagna, Moon, Venus */}
                {marsPlacements && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className="p-3 bg-surface-alt/80 border border-line rounded-md text-center">
                      <div className="text-[11px] font-bold text-ink-muted uppercase">लग्न से मंगल (From Lagna)</div>
                      <div className="text-lg font-extrabold text-ink mt-0.5">{marsPlacements.house_from_lagna}वां भाव</div>
                      <div className="text-[11px] font-medium mt-1">
                        {manglikFactors?.from_lagna ? (
                          <span className="text-rose-600 font-bold">दोष कारक (1, 4, 7, 8, 12)</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">शुभ / निर्दोष भाव</span>
                        )}
                      </div>
                    </div>
                    <div className="p-3 bg-surface-alt/80 border border-line rounded-md text-center">
                      <div className="text-[11px] font-bold text-ink-muted uppercase">चंद्र से मंगल (From Moon)</div>
                      <div className="text-lg font-extrabold text-ink mt-0.5">{marsPlacements.house_from_moon}वां भाव</div>
                      <div className="text-[11px] font-medium mt-1">
                        {manglikFactors?.from_moon ? (
                          <span className="text-rose-600 font-bold">दोष कारक</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">शुभ / निर्दोष भाव</span>
                        )}
                      </div>
                    </div>
                    <div className="p-3 bg-surface-alt/80 border border-line rounded-md text-center">
                      <div className="text-[11px] font-bold text-ink-muted uppercase">शुक्र से मंगल (From Venus)</div>
                      <div className="text-lg font-extrabold text-ink mt-0.5">{marsPlacements.house_from_venus}वां भाव</div>
                      <div className="text-[11px] font-medium mt-1">
                        {manglikFactors?.from_venus ? (
                          <span className="text-rose-600 font-bold">दोष कारक</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">शुभ / निर्दोष भाव</span>
                        )}
                      </div>
                    </div>
                  </div>
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
                    {exceptions.map((ex: ApiData, idx: number) => (
                      <li key={idx} className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900 leading-relaxed">
                        <span className="font-bold mr-1">नियम {idx + 1}:</span>
                        {typeof ex === "string" ? ex : ex.rule || ex.description || JSON.stringify(ex)}
                      </li>
                    ))}
                  </ul>
                </ResultSection>
              )}

              {/* Mangal Vedic & Tantrik Beej Mantras */}
              {marsMantra && (
                <ResultSection title={lang === "hi" ? "मंगल शांति बीज मंत्र" : "Mars Beej Mantra & Japa"}>
                  <div className="p-4 bg-surface-alt/70 border border-line rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">{lang === "hi" ? "भौम तांत्रिक मंत्र" : "Bhauma Tantrik Mantra"}</span>
                      <span className="text-[10px] font-mono-brand bg-accent/10 text-accent px-2 py-0.5 rounded font-bold">
                        {marsMantra.recitations?.toLocaleString()} {lang === "hi" ? "जप" : "Chants"}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-accent font-mono">{marsMantra.beej_mantra}</div>
                    <div className="text-xs text-ink-soft">{marsMantra.mantra}</div>
                  </div>
                </ResultSection>
              )}

              {/* Tuesday Vrat & Classical Remedies (Dynamic backend prioritized, bilingual fallback) */}
              <ResultSection title={s.remediesTitle}>
                {data.remedies && Array.isArray(data.remedies) && data.remedies.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-ink-soft list-disc list-inside">
                    {data.remedies.map((rem: ApiData, idx: number) => (
                      <li key={idx}>{typeof rem === "string" ? rem : rem.remedy || rem.name}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 bg-card border border-line rounded-md">
                      <div className="font-bold text-ink mb-1">
                        {lang === "hi" ? "मंगलवार व्रत एवं हनुमान आराधना" : "Tuesday Fasting & Hanuman Upasana"}
                      </div>
                      <p className="text-ink-soft leading-relaxed">
                        {lang === "hi"
                          ? "मंगलवार को नमक रहित व्रत रखें। हनुमान जी को सिंदूर व चमेली का तेल अर्पित कर नित्य सुंदरकांड या हनुमान चालीसा का पाठ करें।"
                          : "Observe a salt-free fast on Tuesdays. Offer vermillion and jasmine oil to Lord Hanuman, and recite the Sundarkand or Hanuman Chalisa regularly."}
                      </p>
                    </div>
                    <div className="p-3.5 bg-card border border-line rounded-md">
                      <div className="font-bold text-ink mb-1">
                        {lang === "hi" ? "कुंभ विवाह व वैदिक परिहार" : "Kumbh Vivah & Vedic Nuptial Remedy"}
                      </div>
                      <p className="text-ink-soft leading-relaxed">
                        {lang === "hi"
                          ? "यदि दोष तीव्र हो तथा विवाह में विलम्ब हो रहा हो, तो शास्त्रीय मान्यता अनुसार विवाह से पूर्व कुंभ विवाह (घट विवाह / अश्वत्थ विवाह) संपन्न कराने से वैवाहिक जीवन सुखमय रहता है।"
                          : "If Kuja Dosha is prominent without cancellations, classical BPHS texts recommend performing a symbolic Kumbh/Ashwatha Vivah before marriage to neutralize friction."}
                      </p>
                    </div>
                  </div>
                )}
              </ResultSection>
            </div>
          )}
    </>
  );

  return (
    <CalculatorPageShell
      slug="manglik-dosha"
      category="dosha"
      title="Manglik Dosha Analyser"
      hindiTitle="मांगलिक दोष विश्लेषण (Kuja Dosha & Remedies)"
      description={locale === "en" ? "Mars in houses 1, 4, 7, 8, or 12 from Lagna, Moon, and Venus — plus 12 classical cancellations, Beej Mantras, and Tuesday Vrat." : "लग्न, चंद्र व शुक्र से 1, 4, 7, 8, 12 भावों में मंगल की स्थिति, 12 शास्त्रीय अपवाद, मंगल बीज मंत्र एवं मंगलवार व्रत नियम।"}
      icon="🔥"
      locale={locale}
      form={formContent}
      results={resultsContent}
    />
  );
}
