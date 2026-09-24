"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

export default function MarriageMuhuratClient({ locale }: { locale: Locale }) {
  const [form, setForm] = useState<BirthDataValue>({
    ...DEFAULT_BIRTH_DATA,
    dob: new Date().toISOString().split("T")[0],
    tob: "10:00",
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
      dob: form.dob,
      tob: form.tob,
      lat: form.lat,
      lon: form.lon,
      tz: form.tz,
      lang,
    };

    try {
      const res = await axios.post("/api/proxy", {
        endpoint: "/api/v1/panchang/muhurat/marriage",
        payload,
        method: "POST",
      });

      if (res.data?.data) {
        setData(res.data.data);
      } else {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "विवाह मुहूर्त गणना विफल रही।");
    } finally {
      setLoading(false);
    }
  };

  const muhurats = data?.muhurats || data?.dates || [];
  const status =
    data?.status ?? data?.is_favorable ?? (data ? muhurats.length > 0 : undefined);

  return (
    <CalculatorPageShell
      slug="marriage-muhurat"
      category="panchang"
      title="Vivah Muhurat Finder"
      hindiTitle="विवाह शुभ मुहूर्त"
      description="गुरु-शुक्र अस्त, त्रिबल शुद्धि एवं शुभ नक्षत्रों के आधार पर विवाह लग्न।"
      icon="👰"
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

            <BirthDataFields
              value={form}
              onChange={setForm}
              requireName={false}
              requireGender={false}
              dateLabel="वांछित विवाह तिथि (Target Date)"
            />

            <SubmitButton loading={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> त्रिबल शुद्धि जांची जा रही है...
                </>
              ) : (
                "विवाह मुहूर्त खोजें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {error && <ErrorNote message={error} />}

          {!data && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">👰</div>
              <p className="text-sm">तारीख व स्थान चुनें और त्रिबल शुद्धि (सूर्य, चंद्र, गुरु बल) व शुभ लग्न मुहूर्त की अनुकूलता देखें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">गुरु-शुक्र अस्त, मलमास व बाण दोष नियमों की जांच जारी है...</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              <ResultSection title="विवाह मुहूर्त अनुकूलता">
                <div
                  className={`p-6 rounded-xl border text-center mb-4 ${
                    status === false
                      ? "bg-rose-50 border-rose-200 text-rose-950"
                      : "bg-emerald-50 border-emerald-200 text-emerald-950"
                  }`}
                >
                  <div className="text-xs uppercase font-bold tracking-wider mb-1">
                    तिथि अनुकूलता निष्कर्ष
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold">
                    {data.summary || (status === false ? "इस तिथि पर विवाह मुहूर्त वर्जित है" : "विवाह हेतु शुभ मुहूर्त उपलब्ध")}
                  </div>
                  {data.reason && <div className="text-xs mt-2 opacity-80">{data.reason}</div>}
                </div>

                {data.guru_bal && (
                  <ResultRow
                    label="गुरु बल (Jupiter Strength)"
                    value={<ResultBadge tone="good">{data.guru_bal}</ResultBadge>}
                  />
                )}
                {data.surya_bal && (
                  <ResultRow
                    label="सूर्य बल (Sun Strength)"
                    value={<ResultBadge tone="good">{data.surya_bal}</ResultBadge>}
                  />
                )}
                {data.chandra_bal && (
                  <ResultRow
                    label="चंद्र बल (Moon Strength)"
                    value={<ResultBadge tone="good">{data.chandra_bal}</ResultBadge>}
                  />
                )}
              </ResultSection>

              {Array.isArray(muhurats) && muhurats.length > 0 && (
                <ResultSection title={`उपलब्ध शुभ विवाह लग्न मुहूर्त (${muhurats.length})`}>
                  <div className="divide-y divide-line/60">
                    {muhurats.map((m: any, idx: number) => (
                      <div key={idx} className="py-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="font-bold text-ink text-sm">
                            {m.date || m.lagna || m.name || `मुहूर्त ${idx + 1}`}
                            {m.day && <span className="text-ink-muted font-normal"> ({m.day})</span>}
                          </div>
                          {m.quality && <ResultBadge tone="good">{m.quality}</ResultBadge>}
                        </div>
                        {(m.tithi || m.nakshatra) && (
                          <div className="text-[11px] text-ink-muted mb-1">
                            {m.tithi && <span>तिथि: {m.tithi}</span>}
                            {m.tithi && m.nakshatra && <span> · </span>}
                            {m.nakshatra && <span>नक्षत्र: {m.nakshatra}</span>}
                          </div>
                        )}
                        {(m.recommended_window || m.start || m.time || m.from) && (
                          <div className="font-mono text-xs text-accent">
                            {m.recommended_window || `${m.start || m.time || m.from} - ${m.end || m.to}`}
                          </div>
                        )}
                        {m.abhijit_muhurat && (
                          <div className="text-[11px] text-ink-muted mt-0.5">अभिजीत मुहूर्त: {m.abhijit_muhurat}</div>
                        )}
                        {Array.isArray(m.avoid_periods) && m.avoid_periods.length > 0 && (
                          <div className="text-[11px] text-rose-700 mt-0.5">
                            वर्जित काल: {m.avoid_periods.join("; ")}
                          </div>
                        )}
                      </div>
                    ))}
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
