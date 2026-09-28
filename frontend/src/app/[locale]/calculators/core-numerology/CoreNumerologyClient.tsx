"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Calendar, User, Loader2 } from "lucide-react";

const STRINGS = {
  hi: {
    error: "अंकशास्त्र गणना विफल रही।",
    calculating: "अंकशास्त्र गणना जारी...",
    submit: "मूलांक एवं भाग्यांक निकालें",
    emptyHint: "नाम और जन्मतिथि दर्ज करें और अपने मूलांक, भाग्यांक व नामांक का फल जानें।",
    loadingHint: "पाइथागोरस एवं कीरो अंक सिद्धांतों की गणना जारी है...",
    mulankLabel: "मूलांक (Driver)",
    bhagyankLabel: "भाग्यांक (Conductor)",
    namankLabel: "नामांक (Name Number)",
    lordLabel: "स्वामी:",
    mulankLordFallback: "बुध",
    bhagyankLordFallback: "गुरु",
    namankLordFallback: "सूर्य",
    compatTitle: "अंक अनुकूलता विवरण",
    luckyNumbers: "शुभ अंक (Lucky Numbers)",
    luckyDays: "शुभ वार (Lucky Days)",
    luckyColors: "शुभ रंग (Lucky Colors)",
    predictionTitle: "अंकशास्त्र फलादेश",
  },
  en: {
    error: "Numerology calculation failed.",
    calculating: "Calculating numerology...",
    submit: "Get Driver & Conductor Numbers",
    emptyHint: "Enter your name and date of birth to see your Driver, Conductor, and Name number readings.",
    loadingHint: "Calculating per Pythagorean and Chaldean numerology principles...",
    mulankLabel: "Driver Number",
    bhagyankLabel: "Conductor Number",
    namankLabel: "Name Number",
    lordLabel: "Ruler:",
    mulankLordFallback: "Mercury",
    bhagyankLordFallback: "Jupiter",
    namankLordFallback: "Sun",
    compatTitle: "Numerology Compatibility",
    luckyNumbers: "Lucky Numbers",
    luckyDays: "Lucky Days",
    luckyColors: "Lucky Colors",
    predictionTitle: "Numerology Reading",
  },
} as const;

export default function CoreNumerologyClient({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  const [name, setName] = useState("Aditya Sharma");
  const [dob, setDob] = useState("1995-10-05");
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      dob,
      tob: "12:00",
      lat: 28.6139,
      lon: 77.209,
      tz: 5.5,
      lang,
    };

    try {
      const res = await axios.post("/api/proxy", {
        endpoint: "/api/v1/numerology/core-numbers",
        payload,
        queryParams: name ? { name } : null,
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

  const mulank = data?.mulank || data?.birth_number || data?.driver_number;
  const bhagyank = data?.bhagyank || data?.destiny_number || data?.conductor_number;
  const namank = data?.namank || data?.name_number;

  return (
    <CalculatorPageShell
      slug="core-numerology"
      category="numerology"
      title="Life Path & Destiny Numbers"
      hindiTitle="मूलांक एवं भाग्यांक"
      description={locale === "en" ? "Classical numerology from your birth date — Driver, Conductor, and Name numbers in full." : "जन्मतिथि आधारित मूलांक, भाग्यांक एवं नामांक की समग्र शास्त्रीय गणना।"}
      icon="🔢"
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
              <label htmlFor="user_name" className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-accent" />
                <span>{lang === "en" ? "Full Name" : "पूरा नाम"}</span>
              </label>
              <input
                id="user_name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={lang === "en" ? "e.g. Aditya Sharma" : "उदा. आदित्य शर्मा"}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
              />
            </div>

            <div>
              <label htmlFor="user_dob" className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-accent" />
                <span>{lang === "en" ? "Date of Birth" : "जन्म तिथि"}</span>
              </label>
              <input
                id="user_dob"
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
              />
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
              <div className="text-4xl mb-3">🔢</div>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-card border border-line rounded-xl text-center">
                  <div className="text-[11px] uppercase font-bold text-ink-muted mb-1">{s.mulankLabel}</div>
                  <div className="font-display text-3xl font-medium text-accent">
                    {mulank?.number ?? mulank ?? 5}
                  </div>
                  <div className="text-xs text-ink-soft mt-1">
                    {s.lordLabel} {mulank?.ruler || mulank?.lord || s.mulankLordFallback}
                  </div>
                </div>

                <div className="p-4 bg-card border border-line rounded-xl text-center">
                  <div className="text-[11px] uppercase font-bold text-ink-muted mb-1">{s.bhagyankLabel}</div>
                  <div className="font-display text-3xl font-medium text-accent">
                    {bhagyank?.number ?? bhagyank ?? 3}
                  </div>
                  <div className="text-xs text-ink-soft mt-1">
                    {s.lordLabel} {bhagyank?.ruler || bhagyank?.lord || s.bhagyankLordFallback}
                  </div>
                </div>

                <div className="p-4 bg-card border border-line rounded-xl text-center">
                  <div className="text-[11px] uppercase font-bold text-ink-muted mb-1">{s.namankLabel}</div>
                  <div className="font-display text-3xl font-medium text-accent">
                    {namank?.number ?? namank ?? 1}
                  </div>
                  <div className="text-xs text-ink-soft mt-1">
                    {s.lordLabel} {namank?.ruler || namank?.lord || s.namankLordFallback}
                  </div>
                </div>
              </div>

              <ResultSection title={s.compatTitle}>
                {data.favorable_numbers && (
                  <ResultRow
                    label={s.luckyNumbers}
                    value={Array.isArray(data.favorable_numbers) ? data.favorable_numbers.join(", ") : String(data.favorable_numbers)}
                    accent
                  />
                )}
                {data.favorable_days && (
                  <ResultRow
                    label={s.luckyDays}
                    value={Array.isArray(data.favorable_days) ? data.favorable_days.join(", ") : String(data.favorable_days)}
                  />
                )}
                {data.favorable_colors && (
                  <ResultRow
                    label={s.luckyColors}
                    value={Array.isArray(data.favorable_colors) ? data.favorable_colors.join(", ") : String(data.favorable_colors)}
                  />
                )}
              </ResultSection>

              {data.prediction && (
                <ResultSection title={s.predictionTitle}>
                  <p className="text-xs text-ink-soft leading-relaxed">{data.prediction}</p>
                </ResultSection>
              )}
            </div>
          )}
        </div>
      </div>
    </CalculatorPageShell>
  );
}
