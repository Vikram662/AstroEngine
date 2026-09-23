"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

export default function KaalsarpDoshaPage() {
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [lang, setLang] = useState<"hi" | "en">("hi");
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
      const res = await axios.post("/api/demo/proxy", {
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
      setError(err?.response?.data?.message || err?.message || "कालसर्प दोष गणना विफल रही।");
    } finally {
      setLoading(false);
    }
  };

  const isPresent = data?.is_present || data?.has_kalsarpa || false;
  const yogaType = data?.kalsarpa_type || data?.type || "अनंत कालसर्प";

  return (
    <CalculatorPageShell
      slug="kaalsarp-dosha"
      category="dosha"
      title="Kaal Sarp Dosha Check"
      hindiTitle="कालसर्प दोष परीक्षण"
      description="अनंत, कुलिक, वासुकि सहित 12 प्रकार के कालसर्प योगों का सम्पूर्ण विश्लेषण।"
      icon="🐍"
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
                  <Loader2 className="w-4 h-4 animate-spin" /> राहु-केतु अक्ष का विश्लेषण जारी...
                </>
              ) : (
                "कालसर्प दोष जांचें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {error && <ErrorNote message={error} />}

          {!data && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">🐍</div>
              <p className="text-sm">राहु-केतु के बीच सभी ग्रहों के घिरे होने की स्थिति का सटीक परीक्षण करें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">राहु-केतु नोडल अक्ष एवं 12 प्रकार के कालसर्प योगों का मिलान हो रहा है...</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              <ResultSection title="कालसर्प दोष परीक्षण परिणाम">
                <div
                  className={`p-6 rounded-xl border text-center mb-4 ${
                    isPresent
                      ? "bg-rose-50 border-rose-200 text-rose-950"
                      : "bg-emerald-50 border-emerald-200 text-emerald-900"
                  }`}
                >
                  <div className="text-xs uppercase font-bold tracking-wider mb-1">
                    परीक्षण निष्कर्ष
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold">
                    {isPresent
                      ? "कालसर्प दोष उपस्थित है"
                      : "कुंडली में कालसर्प दोष नहीं है"}
                  </div>
                  {isPresent && (
                    <div className="text-sm font-semibold mt-2 text-rose-800">
                      योग प्रकार: {yogaType}
                    </div>
                  )}
                </div>

                <ResultRow
                  label="दोष स्थिति"
                  value={
                    isPresent ? (
                      <ResultBadge tone="bad">सक्रिय ({data.direction || "उदित / अनुदित"})</ResultBadge>
                    ) : (
                      <ResultBadge tone="good">दोष मुक्त</ResultBadge>
                    )
                  }
                  accent
                />
                {data.rahu_house && (
                  <ResultRow label="राहु भाव" value={`${data.rahu_house}वां भाव`} />
                )}
                {data.ketu_house && (
                  <ResultRow label="केतु भाव" value={`${data.ketu_house}वां भाव`} />
                )}
              </ResultSection>

              {data.description && (
                <ResultSection title="कालसर्प प्रभाव एवं फलादेश">
                  <p className="text-xs text-ink-soft leading-relaxed">{data.description}</p>
                </ResultSection>
              )}

              {data.remedies && data.remedies.length > 0 && (
                <ResultSection title="शास्त्रसम्मत शांति उपाय">
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
