"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

export default function RudrakshaMappingClient({ locale }: { locale: Locale }) {
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rudrakshaList, setRudrakshaList] = useState<any[]>([]);

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
        endpoint: "/api/v1/remedies/rudraksha",
        payload,
        method: "POST",
      });

      const list = res.data?.data?.rudraksha_recommendations || res.data?.rudraksha_recommendations || res.data?.data || [];
      setRudrakshaList(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "रुद्राक्ष सुझाव गणना विफल रही।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CalculatorPageShell
      slug="rudraksha-mapping"
      category="remedies"
      title="1 to 14 Mukhi Rudraksha"
      hindiTitle="रुद्राक्ष सुझाव"
      description="जन्म कुंडली के कमजोर एवं पीड़ित ग्रहों को बल देने हेतु शास्त्रीय रुद्राक्ष।"
      icon="📿"
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
                  <Loader2 className="w-4 h-4 animate-spin" /> ग्रह बल एवं रुद्राक्ष चयन जारी...
                </>
              ) : (
                "रुद्राक्ष परामर्श प्राप्त करें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {error && <ErrorNote message={error} />}

          {!rudrakshaList.length && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">📿</div>
              <p className="text-sm">अपनी जन्म कुंडली के कमजोर ग्रहों के निवारण हेतु 1 से 14 मुखी रुद्राक्ष की सिफारिश देखें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">ग्रह युति, दृष्टि एवं षड्बल आधार पर रुद्राक्ष मैपिंग जारी है...</p>
            </div>
          )}

          {rudrakshaList.length > 0 && (
            <div className="space-y-6">
              <ResultSection title="अनुशंसित रुद्राक्ष (Recommended Rudraksha)">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rudrakshaList.map((r: any, idx: number) => (
                    <div key={idx} className="p-4 bg-surface-alt/70 border border-line rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-accent text-sm">
                          {r.mukhi || r.name}
                        </span>
                        <ResultBadge tone="accent">{r.ruling_planet || r.planet || "कारक ग्रह"}</ResultBadge>
                      </div>
                      <div className="text-xs text-ink-soft mb-2">
                        <span className="font-semibold text-ink">अधिष्ठाता देवता:</span> {r.deity || r.god || "भगवान शिव"}
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        {r.benefits || r.reason || r.description}
                      </p>
                    </div>
                  ))}
                </div>
              </ResultSection>

              <ResultSection title="धारण नियम">
                <p className="text-xs text-ink-soft leading-relaxed">
                  रुद्राक्ष को गंगाजल और कच्चे दूध से शुद्ध करके "ॐ नमः शिवाय" मंत्र का 108 बार जाप करके लाल धागे या चांदी की चेन में सोमवार या शिवरात्रि के दिन धारण करना परम कल्याणकारी होता है।
                </p>
              </ResultSection>
            </div>
          )}
        </div>
      </div>
    </CalculatorPageShell>
  );
}
