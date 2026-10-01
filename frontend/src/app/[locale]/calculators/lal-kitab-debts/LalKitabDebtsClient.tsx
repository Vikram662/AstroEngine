"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";
import { ApiData, toApiError } from "@/lib/apiTypes";

const STRINGS = {
  hi: {
    error: "लाल किताब ऋण गणना विफल रही।",
    calculating: "लाल किताब ऋणों की जांच जारी...",
    submit: "लाल किताब ऋण जांचें",
    emptyHint: "जन्म विवरण भरें और लाल किताब के 6 कुदरती/पितृ ऋणों की सक्रियता व अचूक टोटके जानें।",
    loadingHint: "लाल किताब कुंडली अनुसार ऋण सूचक ग्रह स्थितियों की जांच जारी है...",
    resultTitle: "लाल किताब ऋण मूल्यांकन (Lal Kitab Kudrati Debts)",
    activeDebt: "सक्रिय ऋण",
    debtFree: "ऋण मुक्त",
    causeLabel: "कारण:",
    remedyLabel: "लाल किताब उपाय:",
    rulesTitle: "लाल किताब के विशेष नियम",
    rulesBody: "लाल किताब के अनुसार सक्रिय ऋण होने पर जातक को जीवन के विभिन्न क्षेत्रों में अकारण रुकावटों का सामना करना पड़ता है। कुल कुटुम्ब से बराबर का अंश एकत्रित करके उपाय करने से दोष का पूर्ण शमन होता है।",
  },
  en: {
    error: "Lal Kitab Debts calculation failed.",
    calculating: "Checking Lal Kitab debts...",
    submit: "Check Lal Kitab Debts",
    emptyHint: "Fill in your birth details to see which of Lal Kitab's 6 ancestral (Kudrati) debts are active, with proven remedies.",
    loadingHint: "Checking debt-indicating planetary placements per your Lal Kitab chart...",
    resultTitle: "Lal Kitab Debt Evaluation (Kudrati Rin)",
    activeDebt: "Active Debt",
    debtFree: "Debt-free",
    causeLabel: "Cause:",
    remedyLabel: "Lal Kitab Remedy:",
    rulesTitle: "Lal Kitab's Special Rules",
    rulesBody: "Per Lal Kitab, an active debt causes the native to face unexplained obstacles across various areas of life. Performing the remedy after collecting an equal share from the whole family fully resolves the affliction.",
  },
} as const;

export default function LalKitabDebtsClient({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debtsList, setDebtsList] = useState<ApiData[]>([]);

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
        endpoint: "/api/v1/lalkitab/chart/kundli",
        payload,
        method: "POST",
      });

      const debts = res.data?.data?.kudrati_debts || res.data?.kudrati_debts || [];
      setDebtsList(Array.isArray(debts) ? debts : []);
    } catch (errCaught) { const err = toApiError(errCaught);
      setError(err?.response?.data?.message || err?.message || s.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CalculatorPageShell
      slug="lal-kitab-debts"
      category="remedies"
      title="Lal Kitab 6 Ancestral Debts"
      hindiTitle="लाल किताब पितृ ऋण एवं उपाय"
      description={locale === "en" ? "Proven Lal Kitab remedies for self, mother's, father's, spouse's, relative's, and merciless debts (Rin)." : "स्वऋण, मातृ ऋण, पितृ ऋण, स्त्री ऋण, संबंधी ऋण एवं निर्दयी ऋण के अचूक उपाय।"}
      icon="📕"
      locale={locale}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-card p-6 rounded-lg border border-line h-fit">
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

          {!debtsList.length && !loading && !error && (
            <div className="bg-card rounded-lg border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">📕</div>
              <p className="text-sm">{s.emptyHint}</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-lg border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">{s.loadingHint}</p>
            </div>
          )}

          {debtsList.length > 0 && (
            <div className="space-y-6">
              <ResultSection title={s.resultTitle}>
                <div className="space-y-3">
                  {debtsList.map((d: ApiData, idx: number) => {
                    const isActive = d.is_active || d.active;
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-md border transition ${
                          isActive
                            ? "bg-rose-50/70 border-rose-200"
                            : "bg-surface-alt/60 border-line/60"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-sm text-ink">{d.debt || d.debt_name || d.name}</span>
                          {isActive ? (
                            <ResultBadge tone="bad">{s.activeDebt}</ResultBadge>
                          ) : (
                            <ResultBadge tone="good">{s.debtFree}</ResultBadge>
                          )}
                        </div>
                        {d.cause && (
                          <div className="text-xs text-ink-soft mb-1">
                            <span className="font-semibold text-ink">{s.causeLabel}</span> {d.cause}
                          </div>
                        )}
                        {d.remedy && (
                          <div className="text-xs text-ink-muted mt-2 pt-2 border-t border-line/50">
                            <span className="font-semibold text-accent">{s.remedyLabel}</span> {d.remedy}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ResultSection>

              <ResultSection title={s.rulesTitle}>
                <p className="text-xs text-ink-soft leading-relaxed">
                  {s.rulesBody}
                </p>
              </ResultSection>
            </div>
          )}
        </div>
      </div>
    </CalculatorPageShell>
  );
}
