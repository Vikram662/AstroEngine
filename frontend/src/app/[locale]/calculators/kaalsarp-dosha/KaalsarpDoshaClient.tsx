"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { fetchParallelSettled } from "@/lib/calculatorApi";
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
  const [mantraData, setMantraData] = useState<any>(null);

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
      const [kalsarpa, mantras] = await fetchParallelSettled([
        axios.post("/api/proxy", {
          endpoint: "/api/v1/dosha-matching/kalsarpa",
          payload,
          method: "POST",
        }),
        axios.post("/api/proxy", {
          endpoint: "/api/v1/remedies/mantras",
          payload,
          method: "POST",
        }),
      ]);

      if (!kalsarpa) throw new Error(s.error);
      setData(kalsarpa);
      if (mantras) setMantraData(mantras);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || s.error);
    } finally {
      setLoading(false);
    }
  };

  const isPresent = data?.is_kaal_sarp || data?.is_present || data?.has_kalsarpa || false;
  const yogaType = data?.type || data?.kalsarpa_type || s.defaultType;
  const ketuHouse = data?.ketu_house ?? (data?.rahu_house ? ((data.rahu_house + 5) % 12) + 1 : undefined);
  const rahuMantra = mantraData?.mantras?.RAHU;
  const ketuMantra = mantraData?.mantras?.KETU;

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
                      {s.typeLabel} {yogaType} ({data.direction || s.directionFallback})
                    </div>
                  )}
                </div>

                {/* Rahu / Ketu Nodal Axis Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-surface-alt/80 border border-line rounded-xl">
                    <div className="text-[11px] font-bold text-ink-muted uppercase">राहु अक्ष स्थिति (Rahu Position)</div>
                    <div className="text-base font-extrabold text-ink mt-0.5">{s.house(data.rahu_house)}</div>
                    <div className="text-xs font-mono text-ink-soft mt-1">अंश: {data.rahu_degree ? `${data.rahu_degree}°` : "N/A"}</div>
                  </div>
                  <div className="p-3 bg-surface-alt/80 border border-line rounded-xl">
                    <div className="text-[11px] font-bold text-ink-muted uppercase">केतु अक्ष स्थिति (Ketu Position)</div>
                    <div className="text-base font-extrabold text-ink mt-0.5">{ketuHouse ? s.house(ketuHouse) : "N/A"}</div>
                    <div className="text-xs font-mono text-ink-soft mt-1">अंश: {data.ketu_degree ? `${data.ketu_degree}°` : "N/A"}</div>
                  </div>
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
              </ResultSection>

              {/* Dynamic backend description if returned */}
              {data.description && (
                <ResultSection title={s.effectsTitle}>
                  <p className="text-xs text-ink-soft leading-relaxed">{data.description}</p>
                </ResultSection>
              )}

              {/* Rahu and Ketu Vedic Beej Mantras */}
              {(rahuMantra || ketuMantra) && (
                <ResultSection title={lang === "hi" ? "राहु एवं केतु शांति बीज मंत्र" : "Rahu & Ketu Vedic Beej Mantras"}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rahuMantra && (
                      <div className="p-3.5 bg-surface-alt/70 border border-line rounded-xl space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-ink">{lang === "hi" ? "राहु बीज मंत्र" : "Rahu Beej Mantra"}</span>
                          <span className="text-[10px] font-mono-brand bg-accent/10 text-accent px-2 py-0.5 rounded font-bold">
                            {rahuMantra.recitations?.toLocaleString()} {lang === "hi" ? "जप" : "Chants"}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-accent font-mono">{rahuMantra.beej_mantra}</div>
                        <div className="text-[11px] text-ink-soft">{rahuMantra.mantra}</div>
                      </div>
                    )}
                    {ketuMantra && (
                      <div className="p-3.5 bg-surface-alt/70 border border-line rounded-xl space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-ink">{lang === "hi" ? "केतु बीज मंत्र" : "Ketu Beej Mantra"}</span>
                          <span className="text-[10px] font-mono-brand bg-accent/10 text-accent px-2 py-0.5 rounded font-bold">
                            {ketuMantra.recitations?.toLocaleString()} {lang === "hi" ? "जप" : "Chants"}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-accent font-mono">{ketuMantra.beej_mantra}</div>
                        <div className="text-[11px] text-ink-soft">{ketuMantra.mantra}</div>
                      </div>
                    )}
                  </div>
                </ResultSection>
              )}

              {/* Remedies: Dynamic backend remedies prioritized, with bilingual classical remedial guidance */}
              <ResultSection title={s.remediesTitle}>
                {data.remedies && Array.isArray(data.remedies) && data.remedies.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-ink-soft list-disc list-inside">
                    {data.remedies.map((r: any, idx: number) => (
                      <li key={idx}>{typeof r === "string" ? r : r.remedy || r.name}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="space-y-2.5 text-xs text-ink-soft">
                    <div className="p-3 bg-card border border-line rounded-xl">
                      <span className="font-bold text-ink block mb-0.5">
                        {lang === "hi" ? "महामृत्युंजय अनुष्ठान" : "Mahamrityunjaya Anushthana"}
                      </span>
                      {lang === "hi"
                        ? "नित्य 108 बार महामृत्युंजय मंत्र (ॐ त्र्यम्बकं यजामहे...) का जप करें अथवा सावन मास व शिवरात्रि पर रुद्राभिषेक संपन्न कराएं।"
                        : "Chant the Mahamrityunjaya Mantra (Om Tryambakam Yajamahe...) 108 times daily or perform Rudrabhisheka on Mondays or Shivratri."}
                    </div>
                    <div className="p-3 bg-card border border-line rounded-xl">
                      <span className="font-bold text-ink block mb-0.5">
                        {lang === "hi" ? "नाग पंचमी व चांदी के नाग-नागिन दान" : "Nag Panchami Offerings"}
                      </span>
                      {lang === "hi"
                        ? "नाग पंचमी पर शिवलिंग पर चांदी अथवा तांबे के नाग-नागिन का जोड़ा अर्पित करें तथा बहते जल में प्रवाहित करें।"
                        : "Offer a pair of silver or copper Nag-Nagin on the Shivling on Nag Panchami and gently immerse in running water."}
                    </div>
                    <div className="p-3 bg-card border border-line rounded-xl">
                      <span className="font-bold text-ink block mb-0.5">
                        {lang === "hi" ? "त्र्यंबकेश्वर अथवा कालहस्ती शांति पूजा" : "Trimbakeshwar or Kalahasti Shanti Puja"}
                      </span>
                      {lang === "hi"
                        ? "यदि कालसर्प का प्रभाव अत्यधिक संघर्षकारी हो तो नासिक (त्र्यंबकेश्वर) अथवा श्री कालहस्ती में शास्त्रीय कालसर्प शांति विधान संपन्न कराएं।"
                        : "If undergoing severe hurdles during Rahu/Ketu periods, perform consecrated Kaal Sarp Shanti at Trimbakeshwar (Nashik) or Srikalahasti."}
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
      slug="kaalsarp-dosha"
      category="dosha"
      title="Kaal Sarp Dosha Check"
      hindiTitle="कालसर्प दोष परीक्षण (12 Yoga Types & Remedies)"
      description={locale === "en" ? "Full analysis of all 12 Kaal Sarp types, Rahu-Ketu nodal axis degrees, Udit/Anudit direction, and Mahamrityunjaya remedies." : "अनंत, कुलिक, वासुकि सहित 12 प्रकार के कालसर्प योग, राहु-केतु अक्ष अंश, उदित/अनुदित गति एवं महामृत्युंजय शांति उपाय।"}
      icon="🐍"
      locale={locale}
      form={formContent}
      results={resultsContent}
    />
  );
}
