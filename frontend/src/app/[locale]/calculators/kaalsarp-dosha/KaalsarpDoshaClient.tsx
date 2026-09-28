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
    error: "कालसर्प दोष गणना विफल रही।",
    defaultType: "अनंत कालसर्प",
    calculating: "राहु-केतु अक्ष का विश्लेषण जारी...",
    submit: "कालसर्प दोष जांचें",
    emptyHint: "राहु-केतु के बीच सभी ग्रहों के घिरे होने की स्थिति का सटीक परीक्षण करें।",
    loadingHint: "राहु-केतु नोडल अक्ष एवं 12 प्रकार के कालसर्प योगों का मिलान हो रहा है...",
    resultTitle: "कालसर्प दोष परीक्षण परिणाम",
    verdictLabel: "परीक्षण निष्कर्ष",
    present: "कालसर्प दोष उपस्थित है",
    absent: "कुंडली में कालसर्प दोष नहीं है",
    typeLabel: "योग प्रकार:",
    statusLabel: "दोष स्थिति",
    directionFallback: "उदित / अनुदित",
    doshaFree: "दोष मुक्त",
    rahuHouse: "राहु भाव",
    ketuHouse: "केतु भाव",
    house: (n: number) => `${n}वां भाव`,
    effectsTitle: "कालसर्प प्रभाव एवं फलादेश",
    remediesTitle: "शास्त्रसम्मत शांति उपाय",
  },
  en: {
    error: "Kaal Sarp Dosha calculation failed.",
    defaultType: "Anant Kaal Sarp",
    calculating: "Analyzing the Rahu-Ketu axis...",
    submit: "Check Kaal Sarp Dosha",
    emptyHint: "A precise check for whether every planet sits within the Rahu-Ketu axis.",
    loadingHint: "Matching the Rahu-Ketu nodal axis against all 12 Kaal Sarp yoga types...",
    resultTitle: "Kaal Sarp Dosha Result",
    verdictLabel: "Verdict",
    present: "Kaal Sarp Dosha is present",
    absent: "No Kaal Sarp Dosha in this chart",
    typeLabel: "Yoga type:",
    statusLabel: "Dosha status",
    directionFallback: "Rising / Setting",
    doshaFree: "Dosha-free",
    rahuHouse: "Rahu House",
    ketuHouse: "Ketu House",
    house: (n: number) => `House ${n}`,
    effectsTitle: "Effects & Predictions",
    remediesTitle: "Classical Remedies",
  },
} as const;

export default function KaalsarpDoshaClient({ locale }: { locale: Locale }) {
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
        endpoint: "/api/v1/dosha-matching/kalsarpa",
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

  const isPresent = data?.is_kaal_sarp || data?.is_present || data?.has_kalsarpa || false;
  const yogaType = data?.type || data?.kalsarpa_type || s.defaultType;
  const ketuHouse = data?.ketu_house ?? (data?.rahu_house ? ((data.rahu_house + 5) % 12) + 1 : undefined);

  return (
    <CalculatorPageShell
      slug="kaalsarp-dosha"
      category="dosha"
      title="Kaal Sarp Dosha Check"
      hindiTitle="कालसर्प दोष परीक्षण"
      description={locale === "en" ? "Full analysis of all 12 Kaal Sarp yoga types, including Anant, Kulik, and Vasuki." : "अनंत, कुलिक, वासुकि सहित 12 प्रकार के कालसर्प योगों का सम्पूर्ण विश्लेषण।"}
      icon="🐍"
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
              <div className="text-4xl mb-3">🐍</div>
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
                  {isPresent && (
                    <div className="text-sm font-semibold mt-2 text-rose-800">
                      {s.typeLabel} {yogaType}
                    </div>
                  )}
                </div>

                <ResultRow
                  label={s.statusLabel}
                  value={
                    isPresent ? (
                      <ResultBadge tone="bad">{locale === "en" ? "Active" : "सक्रिय"} ({data.direction || s.directionFallback})</ResultBadge>
                    ) : (
                      <ResultBadge tone="good">{s.doshaFree}</ResultBadge>
                    )
                  }
                  accent
                />
                {data.rahu_house && (
                  <ResultRow label={s.rahuHouse} value={s.house(data.rahu_house)} />
                )}
                {ketuHouse && (
                  <ResultRow label={s.ketuHouse} value={s.house(ketuHouse)} />
                )}
              </ResultSection>

              {data.description && (
                <ResultSection title={s.effectsTitle}>
                  <p className="text-xs text-ink-soft leading-relaxed">{data.description}</p>
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
