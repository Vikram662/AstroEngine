"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

export default function ManglikDoshaClient({ locale }: { locale: Locale }) {
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
      setError(err?.response?.data?.message || err?.message || "मांगलिक दोष गणना विफल रही।");
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
      description="लग्न, चंद्र व शुक्र से 1, 4, 7, 8, 12 भावों में मंगल की स्थिति और 12 शास्त्रीय अपवाद।"
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
                  <Loader2 className="w-4 h-4 animate-spin" /> मंगल स्थिति विश्लेषित हो रही है...
                </>
              ) : (
                "मांगलिक दोष जांचें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {error && <ErrorNote message={error} />}

          {!data && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">🔥</div>
              <p className="text-sm">जन्म विवरण भरें और 1, 4, 7, 8, 12 भावों में मंगल दोष व परिहार नियम देखें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">लग्न, चंद्र एवं शुक्र से कुज दोष एवं 12 शास्त्रीय अपवादों की गणना जारी है...</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              <ResultSection title="मांगलिक दोष परिणाम">
                <div
                  className={`p-6 rounded-xl border text-center mb-4 ${
                    !isManglik || isCancelled
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
                >
                  <div className="text-xs uppercase font-bold tracking-wider mb-1">
                    अंतिम स्थिति
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold">
                    {!isManglik
                      ? "मांगलिक दोष नहीं है (No Manglik Dosha)"
                      : isCancelled
                      ? "दोष प्रभावहीन / निरस्त (Cancelled by Exceptions)"
                      : "मांगलिक दोष उपस्थित है (Manglik Dosha Present)"}
                  </div>
                  <div className="text-xs mt-2 opacity-90">
                    {data.severity || (isManglik && !isCancelled ? "उच्च तीव्रता" : "सामान्य / निरस्त")}
                  </div>
                </div>

                <ResultRow
                  label="मंगल भाव, लग्न से (Mars House from Lagna)"
                  value={
                    marsHouseFromLagna !== undefined && [1, 4, 7, 8, 12].includes(Number(marsHouseFromLagna))
                      ? `${marsHouseFromLagna}वां भाव`
                      : marsHouseFromLagna !== undefined
                      ? `${marsHouseFromLagna}वां भाव (1, 4, 7, 8, 12 से बाहर)`
                      : "1, 4, 7, 8, 12 से बाहर"
                  }
                  accent
                />
                {data.percentage !== undefined && (
                  <ResultRow
                    label="दोष तीव्रता प्रतिशत"
                    value={<ResultBadge tone={data.percentage > 50 ? "bad" : "neutral"}>{data.percentage}%</ResultBadge>}
                  />
                )}
                <ResultRow
                  label="अपवाद लागू"
                  value={
                    isCancelled ? (
                      <ResultBadge tone="good">हाँ (दोष निरस्त)</ResultBadge>
                    ) : (
                      <ResultBadge tone="neutral">नहीं</ResultBadge>
                    )
                  }
                />
              </ResultSection>

              {exceptions.length > 0 && (
                <ResultSection title="लागू हुए शास्त्रीय अपवाद (Cancellations)">
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
                <ResultSection title="शास्त्रसम्मत उपाय (Remedies)">
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
