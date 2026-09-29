"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";
import type { Locale } from "@/lib/locale";
import { ApiData, toApiError } from "@/lib/apiTypes";

const STRINGS = {
  hi: {
    error: "चंद्र राशि गणना विफल रही।",
    calculating: "चंद्र राशि खोजी जा रही है...",
    submit: "चंद्र राशि व नक्षत्र जानें",
    emptyHint: "जन्म समय व स्थान दर्ज करें और अपना वैदिक चंद्र नक्षत्र व राशि जानें।",
    loadingHint: "चंद्रमा के देशांतर एवं 27 नक्षत्रों के भोग की गणना जारी है...",
    resultTitle: "आपकी वैदिक चंद्र राशि (Moon Sign)",
    birthSignLabel: "वैदिक जन्म राशि",
    signFallback: "कर्क (Cancer)",
    bhogAmshLabel: "भोग अंश:",
    nakshatraLabel: "जन्म नक्षत्र (Birth Nakshatra)",
    nakshatraFallback: "पुष्य",
    padaLabel: "चरण",
    nakshatraLordLabel: "नक्षत्र स्वामी (Nakshatra Lord)",
    signLordLabel: "राशि स्वामी (Sign Lord)",
    namingSyllableLabel: "नामाक्षर (Naming Syllable)",
    significanceTitle: "ज्योतिषीय महत्व",
    significanceBody: "वैदिक ज्योतिष में चंद्र राशि को मन, भावना, स्वभाव और सोच का केंद्र माना जाता है। दैनिक राशिफल, साढ़े साती की गणना, और महादशा का प्रारंभ इसी नक्षत्र और चरण से होता है।",
  },
  en: {
    error: "Moon sign calculation failed.",
    calculating: "Finding your Moon sign...",
    submit: "Get Moon Sign & Nakshatra",
    emptyHint: "Enter your birth time and place to see your Vedic Moon Nakshatra and sign.",
    loadingHint: "Calculating the Moon's longitude and its position across the 27 nakshatras...",
    resultTitle: "Your Vedic Moon Sign",
    birthSignLabel: "Vedic Birth Sign",
    signFallback: "Cancer",
    bhogAmshLabel: "Bhoga Amsha:",
    nakshatraLabel: "Birth Nakshatra",
    nakshatraFallback: "Pushya",
    padaLabel: "Pada",
    nakshatraLordLabel: "Nakshatra Lord",
    signLordLabel: "Sign Lord",
    namingSyllableLabel: "Naming Syllable",
    significanceTitle: "Astrological Significance",
    significanceBody: "In Vedic astrology, the Moon sign is considered the center of the mind, emotions, temperament, and thought. Daily horoscopes, the Sade Sati calculation, and the start of the Mahadasha all begin from this nakshatra and pada.",
  },
} as const;

export default function MoonSignClient({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
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
        endpoint: "/api/v1/core/planets/positions",
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

  const planets = data?.planets || [];
  const moon = planets.find((p: ApiData) => p.id === "MOON" || (p.name || p.planet || "").toLowerCase().includes("moon"));

  return (
    <CalculatorPageShell
      slug="moon-sign"
      category="kundli"
      title="Moon Sign & Nakshatra"
      hindiTitle="चंद्र राशि एवं नक्षत्र"
      description={locale === "en" ? "Your Moon sign at birth, plus the Nakshatra and Pada that give the first letter of your name." : "जन्म कालीन चंद्र राशि, 27 नक्षत्र एवं 4 चरण आधारित नाम अक्षर।"}
      icon="🌙"
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

            <BirthDataFields value={form} onChange={setForm} />

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

          {!moon && !loading && !error && (
            <div className="bg-card rounded-lg border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">🌙</div>
              <p className="text-sm">{s.emptyHint}</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-lg border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">{s.loadingHint}</p>
            </div>
          )}

          {moon && (
            <div className="space-y-6">
              <ResultSection title={s.resultTitle}>
                <div className="p-6 bg-accent-soft rounded-md border border-line text-center mb-4">
                  <div className="text-xs uppercase tracking-wider text-accent font-semibold mb-1">
                    {s.birthSignLabel}
                  </div>
                  <div className="font-display text-3xl font-medium text-ink">
                    {moon.sign?.name || moon.rashi_name || s.signFallback}
                  </div>
                  <div className="text-xs text-ink-soft mt-1 font-mono-brand">
                    {s.bhogAmshLabel} {Number(moon.norm_degree ?? moon.degree ?? 0).toFixed(2)}°
                  </div>
                </div>

                <ResultRow
                  label={s.nakshatraLabel}
                  value={
                    <span className="flex items-center gap-1.5 font-bold text-accent">
                      <span>{moon.nakshatra?.name || s.nakshatraFallback}</span>
                      {moon.nakshatra?.pada && <ResultBadge tone="accent">{s.padaLabel} {moon.nakshatra.pada}</ResultBadge>}
                    </span>
                  }
                />
                {moon.nakshatra?.lord && (
                  <ResultRow label={s.nakshatraLordLabel} value={moon.nakshatra.lord} />
                )}
                {moon.sign?.ruler && (
                  <ResultRow label={s.signLordLabel} value={moon.sign.ruler} />
                )}
                {moon.pada_char && (
                  <ResultRow
                    label={s.namingSyllableLabel}
                    value={<ResultBadge tone="good">{moon.pada_char}</ResultBadge>}
                  />
                )}
              </ResultSection>

              <ResultSection title={s.significanceTitle}>
                <p className="text-xs text-ink-soft leading-relaxed">
                  {s.significanceBody}
                </p>
              </ResultSection>
            </div>
          )}
        </div>
      </div>
    </CalculatorPageShell>
  );
}
