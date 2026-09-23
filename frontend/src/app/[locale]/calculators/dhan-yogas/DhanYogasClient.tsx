"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

export default function DhanYogasClient({ locale }: { locale: Locale }) {
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [yogasList, setYogasList] = useState<any[]>([]);

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
      const res = await axios.post("/api/demo/proxy", {
        endpoint: "/api/v1/parashari/yogas/find",
        payload,
        method: "POST",
      });

      const list = res.data?.data?.yogas || res.data?.yogas || res.data?.data || [];
      setYogasList(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "राज व धन योग खोज विफल रही।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CalculatorPageShell
      slug="dhan-yogas"
      category="advanced"
      title="Raja & Dhan Yoga Finder"
      hindiTitle="राजयोग एवं धन योग स्कैनर"
      description="गजकेसरी, बुधादित्य एवं पंचमहापुरुष सहित 10 प्रमुख शास्त्रीय राज व धन योगों का पता लगाएं।"
      icon="👑"
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
                  <Loader2 className="w-4 h-4 animate-spin" /> योग संयोजन स्कैन हो रहे हैं...
                </>
              ) : (
                "राज व धन योग खोजें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {error && <ErrorNote message={error} />}

          {!yogasList.length && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">👑</div>
              <p className="text-sm">जन्म विवरण भरें और केंद्र-त्रिकोण स्वामियों के संयोग से बनने वाले दुर्लभ राजयोग व धनयोग देखें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">बृहत् पाराशर होराशास्त्र अनुसार योग सूत्रों का मिलान जारी है...</p>
            </div>
          )}

          {yogasList.length > 0 && (
            <div className="space-y-6">
              <ResultSection title={`सक्रिय शुभ योग (${yogasList.length} योग प्राप्त)`}>
                <div className="space-y-3">
                  {yogasList.map((y: any, idx: number) => (
                    <div key={idx} className="p-4 bg-surface-alt/70 border border-line rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-ink">{y.name || y.yoga_name}</span>
                        <ResultBadge tone={y.category === "raja" ? "accent" : "good"}>
                          {y.category || "शुभ योग"}
                        </ResultBadge>
                      </div>
                      <p className="text-xs text-ink-soft leading-relaxed mb-2">
                        {y.description || y.meaning}
                      </p>
                      {(y.planets || y.planets_involved) && (
                        <div className="text-[11px] text-ink-muted">
                          <span className="font-semibold text-ink">संबंधित ग्रह:</span>{" "}
                          {Array.isArray(y.planets || y.planets_involved)
                            ? (y.planets || y.planets_involved).join(", ")
                            : String(y.planets || y.planets_involved)}
                          {y.house ? ` (भाव ${y.house})` : ""}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ResultSection>
            </div>
          )}
        </div>
      </div>
    </CalculatorPageShell>
  );
}
