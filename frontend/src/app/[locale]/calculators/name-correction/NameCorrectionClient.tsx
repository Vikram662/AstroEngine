"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Type, Sparkles, Loader2 } from "lucide-react";

const STRINGS = {
  hi: {
    error: "नाम संशोधन गणना विफल रही।",
    currentNameLabel: "वर्तमान नाम (Current Spelling)",
    namePlaceholder: "उदा. Aditya Sharma",
    targetLabel: "वांछित शुभ नामांक (Target Number: 1, 3, 5, 6)",
    targetOptions: {
      "1": "1 - सूर्य (नेतृत्व, प्रसिद्धि)",
      "3": "3 - गुरु (ज्ञान, सफलता)",
      "5": "5 - बुध (व्यापार, आकर्षण)",
      "6": "6 - शुक्र (वैभव, कला, धन)",
    },
    calculating: "कैल्डियन गणना जारी...",
    submit: "शुभ स्पेलिंग सुझाव प्राप्त करें",
    emptyHint: "अंग्रेजी स्पेलिंग दर्ज करें और कैल्डियन अंक प्रणाली अनुसार भाग्योदयकारी नाम स्पेलिंग विकल्प देखें।",
    loadingHint: "कैल्डियन वर्णमाला मान एवं योग संख्या की गणना जारी है...",
    currentTitle: "वर्तमान नाम अंक विश्लेषण",
    currentSpelling: "वर्तमान स्पेलिंग",
    chaldeanTotal: "कैल्डियन कुल योग",
    suggestionsTitle: "सुझाई गई संशोधित स्पेलिंग्स (Lucky Spelling Suggestions)",
    sumLabel: "योग:",
  },
  en: {
    error: "Name correction calculation failed.",
    currentNameLabel: "Current Spelling",
    namePlaceholder: "e.g. Aditya Sharma",
    targetLabel: "Target Lucky Name Number (1, 3, 5, 6)",
    targetOptions: {
      "1": "1 – Sun (leadership, fame)",
      "3": "3 – Jupiter (wisdom, success)",
      "5": "5 – Mercury (business, charm)",
      "6": "6 – Venus (luxury, art, wealth)",
    },
    calculating: "Calculating Chaldean values...",
    submit: "Get Lucky Spelling Suggestions",
    emptyHint: "Enter an English spelling to see fortune-boosting name spelling options per the Chaldean number system.",
    loadingHint: "Calculating Chaldean alphabet values and compound numbers...",
    currentTitle: "Current Name Number Analysis",
    currentSpelling: "Current Spelling",
    chaldeanTotal: "Chaldean Total",
    suggestionsTitle: "Suggested Revised Spellings",
    sumLabel: "Total:",
  },
} as const;

export default function NameCorrectionClient({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  const [currentName, setCurrentName] = useState("Aditya Sharma");
  const [targetNumber, setTargetNumber] = useState("1");
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post("/api/proxy", {
        endpoint: "/api/v1/numerology/name-correction",
        payload: {
          dob: "2000-01-01",
          tob: "12:00",
          lat: 28.6139,
          lon: 77.209,
          tz: 5.5,
          current_name: currentName,
          target_number: Number(targetNumber) || 1,
          lang,
        },
        queryParams: {
          current_name: currentName,
        },
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

  const currentNumber = data?.current_number || data?.chaldean_number || data?.current_value;
  const suggestions = data?.suggested_variations || data?.suggestions || data?.alternative_spellings || [];

  return (
    <CalculatorPageShell
      slug="name-correction"
      category="numerology"
      title="Chaldean Name Correction"
      hindiTitle="नाम संशोधन अंक प्रणाली"
      description={locale === "en" ? "Add favorable letters using the Chaldean and Pythagorean methods to build a fortune-boosting name number." : "कीरो व पाइथागोरस विधि अनुसार शुभ अक्षर जोड़कर भाग्योदय नामांक बनाएं।"}
      icon="✍️"
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

            <div>
              <label htmlFor="name_input" className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-accent" />
                <span>{s.currentNameLabel}</span>
              </label>
              <input
                id="name_input"
                type="text"
                required
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                placeholder={s.namePlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
              />
            </div>

            <div>
              <label htmlFor="target_num" className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>{s.targetLabel}</span>
              </label>
              <select
                id="target_num"
                value={targetNumber}
                onChange={(e) => setTargetNumber(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
              >
                <option value="1">{s.targetOptions["1"]}</option>
                <option value="3">{s.targetOptions["3"]}</option>
                <option value="5">{s.targetOptions["5"]}</option>
                <option value="6">{s.targetOptions["6"]}</option>
              </select>
            </div>

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
              <div className="text-4xl mb-3">✍️</div>
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
              <ResultSection title={s.currentTitle}>
                <div className="p-4 bg-surface-alt rounded-xl border border-line/60 flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-ink-muted">{s.currentSpelling}</div>
                    <div className="text-lg font-bold text-ink">{currentName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-ink-muted">{s.chaldeanTotal}</div>
                    <div className="text-2xl font-bold font-mono-brand text-accent">
                      {currentNumber ?? "-"}
                    </div>
                  </div>
                </div>
              </ResultSection>

              {Array.isArray(suggestions) && suggestions.length > 0 && (
                <ResultSection title={s.suggestionsTitle}>
                  <div className="space-y-2">
                    {suggestions.map((sug: any, idx: number) => {
                      const sName = typeof sug === "string" ? sug : sug.name || sug.spelling;
                      const sVal = typeof sug === "object" ? sug.compound_number ?? sug.number ?? sug.value : targetNumber;
                      return (
                        <div key={idx} className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                          <div>
                            <span className="font-bold text-emerald-950 text-sm">{sName}</span>
                            {sug?.fortune && <div className="text-[11px] text-emerald-800/80 mt-0.5">{sug.fortune}</div>}
                          </div>
                          <ResultBadge tone="good">{s.sumLabel} {sVal}</ResultBadge>
                        </div>
                      );
                    })}
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
