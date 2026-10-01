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
    error: "चौघड़िया गणना विफल रही।",
    dateLabel: "तारीख (Select Date)",
    calculating: "चौघड़िया समय निकाला जा रहा है...",
    submit: "चौघड़िया मुहूर्त देखें",
    emptyHint: "तिथि व शहर चुनें और दिन व रात के 16 चौघड़िया मुहूर्त (शुभ, लाभ, अमृत आदि) देखें।",
    loadingHint: "दिनमान एवं रात्रिमान के 8-8 समान खंडों की गणना जारी है...",
    dayTitle: "दिन का चौघड़िया (Day Choghadiya)",
    nightTitle: "रात्रि का चौघड़िया (Night Choghadiya)",
    colMuhurat: "मुहूर्त",
    colTime: "समय (Time)",
    colNature: "प्रकृति",
  },
  en: {
    error: "Choghadiya calculation failed.",
    dateLabel: "Select Date",
    calculating: "Calculating Choghadiya timings...",
    submit: "View Choghadiya Muhurats",
    emptyHint: "Choose a date and city to see all 16 day and night Choghadiya muhurats (Shubh, Labh, Amrit, and more).",
    loadingHint: "Calculating the 8 equal segments each for day and night...",
    dayTitle: "Day Choghadiya",
    nightTitle: "Night Choghadiya",
    colMuhurat: "Muhurat",
    colTime: "Time",
    colNature: "Nature",
  },
} as const;

export default function ChoghadiyaClient({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  const [form, setForm] = useState<BirthDataValue>({
    ...DEFAULT_BIRTH_DATA,
    dob: new Date().toISOString().split("T")[0],
    tob: "06:00",
  });
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiData>(null);

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
        endpoint: "/api/v1/panchang/choghadiya",
        payload,
        method: "POST",
      });

      if (res.data?.data) {
        setData(res.data.data);
      } else {
        setData(res.data);
      }
    } catch (errCaught) { const err = toApiError(errCaught);
      setError(err?.response?.data?.message || err?.message || s.error);
    } finally {
      setLoading(false);
    }
  };

  const dayChoghadiya = data?.day || data?.day_choghadiya || [];
  const nightChoghadiya = data?.night || data?.night_choghadiya || [];

  const getTone = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("amrit") || t.includes("अमृत") || t.includes("shubh") || t.includes("शुभ") || t.includes("labh") || t.includes("लाभ")) {
      return "good";
    }
    if (t.includes("char") || t.includes("chal") || t.includes("चर") || t.includes("चल")) {
      return "neutral";
    }
    return "bad";
  };

  return (
    <CalculatorPageShell
      slug="choghadiya"
      category="panchang"
      title="Day & Night Choghadiya"
      hindiTitle="दिन एवं रात्रि चौघड़िया"
      description={locale === "en" ? "The day's 16 time segments — Shubh, Amrit, Labh, Char, Rog, Kaal, and Udveg." : "शुभ, अमृत, लाभ, चर, रोग, काल एवं उद्वेग के 16 दैनिक समय खंड।"}
      icon="⏱️"
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

            <BirthDataFields
              value={form}
              onChange={setForm}
              requireName={false}
              requireGender={false}
              dateLabel={s.dateLabel}
            />

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
            <div className="bg-card rounded-lg border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">⏱️</div>
              <p className="text-sm">{s.emptyHint}</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-lg border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">{s.loadingHint}</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              {Array.isArray(dayChoghadiya) && dayChoghadiya.length > 0 && (
                <ResultSection title={s.dayTitle}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                        <tr>
                          <th className="py-2 px-3">{s.colMuhurat}</th>
                          <th className="py-2 px-3">{s.colTime}</th>
                          <th className="py-2 px-3">{s.colNature}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {dayChoghadiya.map((c: ApiData, idx: number) => {
                          const name = c.choghadiya || c.name;
                          return (
                            <tr key={idx} className="hover:bg-surface-alt/40 transition">
                              <td className="py-2.5 px-3 font-bold text-ink">{name}</td>
                              <td className="py-2.5 px-3 font-mono-brand">{c.start_time || c.start || c.from} - {c.end_time || c.end || c.to}</td>
                              <td className="py-2.5 px-3">
                                <ResultBadge tone={getTone(name)}>{c.nature || c.type || name}</ResultBadge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </ResultSection>
              )}

              {Array.isArray(nightChoghadiya) && nightChoghadiya.length > 0 && (
                <ResultSection title={s.nightTitle}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                        <tr>
                          <th className="py-2 px-3">{s.colMuhurat}</th>
                          <th className="py-2 px-3">{s.colTime}</th>
                          <th className="py-2 px-3">{s.colNature}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {nightChoghadiya.map((c: ApiData, idx: number) => {
                          const name = c.choghadiya || c.name;
                          return (
                            <tr key={idx} className="hover:bg-surface-alt/40 transition">
                              <td className="py-2.5 px-3 font-bold text-ink">{name}</td>
                              <td className="py-2.5 px-3 font-mono-brand">{c.start_time || c.start || c.from} - {c.end_time || c.end || c.to}</td>
                              <td className="py-2.5 px-3">
                                <ResultBadge tone={getTone(name)}>{c.nature || c.type || name}</ResultBadge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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
