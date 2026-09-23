"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

export default function NadiExceptionsClient({ locale }: { locale: Locale }) {
  const [boyForm, setBoyForm] = useState<BirthDataValue>({
    ...DEFAULT_BIRTH_DATA,
    name: "वर",
    gender: "male",
    dob: "1994-08-12",
    tob: "10:15",
  });
  const [girlForm, setGirlForm] = useState<BirthDataValue>({
    ...DEFAULT_BIRTH_DATA,
    name: "कन्या",
    gender: "female",
    dob: "1996-03-24",
    tob: "18:45",
    cityName: "मुंबई, भारत",
    lat: 19.076,
    lon: 72.8777,
  });
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      groom_dob: boyForm.dob,
      groom_tob: boyForm.tob,
      groom_lat: boyForm.lat,
      groom_lon: boyForm.lon,
      groom_tz: boyForm.tz,
      bride_dob: girlForm.dob,
      bride_tob: girlForm.tob,
      bride_lat: girlForm.lat,
      bride_lon: girlForm.lon,
      bride_tz: girlForm.tz,
      lang,
    };

    try {
      const res = await axios.post("/api/demo/proxy", {
        endpoint: "/api/v1/dosha-matching/matchmaking/exceptions",
        payload,
        method: "POST",
      });

      if (res.data?.data) {
        setData(res.data.data);
      } else {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "नाड़ी अपवाद विश्लेषण विफल रहा।");
    } finally {
      setLoading(false);
    }
  };

  const nadiAnalysis = data?.nadi_analysis;
  const hasBaseDosha = nadiAnalysis?.has_base_dosha ?? false;
  const isCancelled = nadiAnalysis?.is_cancelled ?? data?.is_cancelled ?? false;
  const exceptions = nadiAnalysis?.cancellation_rules || data?.exceptions || data?.rules_applied || [];

  return (
    <CalculatorPageShell
      slug="nadi-exceptions"
      category="matching"
      title="Nadi Dosha Cancellations"
      hindiTitle="नाड़ी दोष निरस्तीकरण"
      description="एक ही नक्षत्र भिन्न चरण, राशि स्वामी मैत्री आदि 10 शास्त्रीय अपवाद नियम।"
      icon="🧬"
      locale={locale}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 bg-card p-6 rounded-2xl border border-line h-fit">
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="p-4 rounded-xl bg-surface border border-line">
              <BirthDataFields
                value={boyForm}
                onChange={setBoyForm}
                personLabel="वर विवरण (Groom Details)"
                idPrefix="boy_"
              />
            </div>

            <div className="p-4 rounded-xl bg-surface border border-line">
              <BirthDataFields
                value={girlForm}
                onChange={setGirlForm}
                personLabel="कन्या विवरण (Bride Details)"
                idPrefix="girl_"
              />
            </div>

            <SubmitButton loading={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> अपवाद नियमों की जांच जारी...
                </>
              ) : (
                "नाड़ी अपवाद नियम जांचें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-6 space-y-6">
          {error && <ErrorNote message={error} />}

          {!data && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">🧬</div>
              <p className="text-sm">यदि अष्टकूट में नाड़ी दोष आ रहा हो, तो शास्त्रोक्त 10 अपवादों द्वारा उसका निरस्तीकरण जांचें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">एक नक्षत्र भिन्न चरण, राशि एकता एवं स्वामी मैत्री अपवादों की जांच हो रही है...</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              <ResultSection title="नाड़ी दोष अपवाद निष्कर्ष">
                <div
                  className={`p-6 rounded-xl border text-center mb-4 ${
                    !hasBaseDosha || isCancelled
                      ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                      : "bg-amber-50 border-amber-200 text-amber-950"
                  }`}
                >
                  <div className="text-xs uppercase font-bold tracking-wider mb-1">
                    अंतिम स्थिति
                  </div>
                  <div className="text-2xl font-extrabold">
                    {!hasBaseDosha
                      ? "नाड़ी दोष है ही नहीं (No Nadi Dosha)"
                      : isCancelled
                      ? "नाड़ी दोष शास्त्रीय नियमों से निरस्त है"
                      : "कोई अपवाद लागू नहीं / नाड़ी दोष मान्य"}
                  </div>
                  <div className="text-xs mt-2 opacity-80">
                    {!hasBaseDosha
                      ? "दोनों की जन्म नाड़ी भिन्न है, कोई शांति उपाय आवश्यक नहीं"
                      : isCancelled
                      ? "विवाह में नाड़ी दोष का प्रतिकूल प्रभाव नहीं माना जाएगा"
                      : "नाड़ी शांति अनुष्ठान या महामृत्युंजय जप की सलाह दी जाती है"}
                  </div>
                </div>

                <ResultRow
                  label="अपवाद स्थिति"
                  value={
                    !hasBaseDosha ? (
                      <ResultBadge tone="good">लागू नहीं (दोष अनुपस्थित)</ResultBadge>
                    ) : isCancelled ? (
                      <ResultBadge tone="good">दोष निरस्त (Parihara Active)</ResultBadge>
                    ) : (
                      <ResultBadge tone="bad">सक्रिय</ResultBadge>
                    )
                  }
                  accent
                />
              </ResultSection>

              {Array.isArray(exceptions) && exceptions.length > 0 && (
                <ResultSection title="लागू हुए शास्त्रीय अपवाद नियम">
                  <ul className="space-y-2 text-xs">
                    {exceptions.map((ex: any, idx: number) => (
                      <li key={idx} className="p-3 bg-surface-alt rounded-lg border border-line text-ink">
                        {typeof ex === "string" ? ex : ex.rule || ex.description}
                      </li>
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
