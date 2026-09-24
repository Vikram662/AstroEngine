"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Type, Sparkles, Loader2 } from "lucide-react";

export default function NameCorrectionClient({ locale }: { locale: Locale }) {
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
      setError(err?.response?.data?.message || err?.message || "नाम संशोधन गणना विफल रही।");
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
      description="कीरो व पाइथागोरस विधि अनुसार शुभ अक्षर जोड़कर भाग्योदय नामांक बनाएं।"
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
                <span>वर्तमान नाम (Current Spelling)</span>
              </label>
              <input
                id="name_input"
                type="text"
                required
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                placeholder="उदा. Aditya Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
              />
            </div>

            <div>
              <label htmlFor="target_num" className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>वांछित शुभ नामांक (Target Number: 1, 3, 5, 6)</span>
              </label>
              <select
                id="target_num"
                value={targetNumber}
                onChange={(e) => setTargetNumber(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
              >
                <option value="1">1 - सूर्य (नेतृत्व, प्रसिद्धि)</option>
                <option value="3">3 - गुरु (ज्ञान, सफलता)</option>
                <option value="5">5 - बुध (व्यापार, आकर्षण)</option>
                <option value="6">6 - शुक्र (वैभव, कला, धन)</option>
              </select>
            </div>

            <SubmitButton loading={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> कैल्डियन गणना जारी...
                </>
              ) : (
                "शुभ स्पेलिंग सुझाव प्राप्त करें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {error && <ErrorNote message={error} />}

          {!data && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">✍️</div>
              <p className="text-sm">अंग्रेजी स्पेलिंग दर्ज करें और कैल्डियन अंक प्रणाली अनुसार भाग्योदयकारी नाम स्पेलिंग विकल्प देखें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">कैल्डियन वर्णमाला मान एवं योग संख्या की गणना जारी है...</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              <ResultSection title="वर्तमान नाम अंक विश्लेषण">
                <div className="p-4 bg-surface-alt rounded-xl border border-line/60 flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-ink-muted">वर्तमान स्पेलिंग</div>
                    <div className="text-lg font-bold text-ink">{currentName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-ink-muted">कैल्डियन कुल योग</div>
                    <div className="text-2xl font-bold font-mono text-accent">
                      {currentNumber ?? "-"}
                    </div>
                  </div>
                </div>
              </ResultSection>

              {Array.isArray(suggestions) && suggestions.length > 0 && (
                <ResultSection title="सुझाई गई संशोधित स्पेलिंग्स (Lucky Spelling Suggestions)">
                  <div className="space-y-2">
                    {suggestions.map((s: any, idx: number) => {
                      const sName = typeof s === "string" ? s : s.name || s.spelling;
                      const sVal = typeof s === "object" ? s.compound_number ?? s.number ?? s.value : targetNumber;
                      return (
                        <div key={idx} className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                          <div>
                            <span className="font-bold text-emerald-950 text-sm">{sName}</span>
                            {s?.fortune && <div className="text-[11px] text-emerald-800/80 mt-0.5">{s.fortune}</div>}
                          </div>
                          <ResultBadge tone="good">योग: {sVal}</ResultBadge>
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
