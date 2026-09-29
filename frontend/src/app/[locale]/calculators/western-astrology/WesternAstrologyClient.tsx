"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { fetchParallelSettled } from "@/lib/calculatorApi";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";
import { ApiData, toApiError } from "@/lib/apiTypes";

const STRINGS = {
  hi: {
    error: "पाश्चात्य ज्योतिष गणना विफल रही।",
    calculating: "ट्रॉपिकल राशि गणना जारी...",
    submit: "वेस्टर्न बिग-थ्री जानें",
    emptyHint: "जन्म समय अनुसार वेस्टर्न ट्रॉपिकल ज़ोडिएक (Sun, Moon & Rising Sign) और नेटल व्हील देखें।",
    loadingHint: "ट्रॉपिकल एफेमेरिस (सायन पद्धति) गणना जारी है...",
    sunLabel: "सूर्य राशि (Sun Sign)",
    moonLabel: "चंद्र राशि (Moon Sign)",
    risingLabel: "लग्न (Rising / Asc)",
    sunFallback: "सिंह",
    moonFallback: "वृश्चिक",
    risingFallback: "धनु",
    wheelTitle: "वेस्टर्न नेटल व्हील (Tropical Natal Wheel)",
    elementsTitle: "तत्व वितरण (Elements)",
    fire: "अग्नि (Fire)",
    earth: "पृथ्वी (Earth)",
    air: "वायु (Air)",
    water: "जल (Water)",
  },
  en: {
    error: "Western astrology calculation failed.",
    calculating: "Calculating tropical signs...",
    submit: "Get Western Big-Three",
    emptyHint: "See your Western Tropical zodiac Big-Three (Sun, Moon & Rising Sign) and natal wheel for your birth time.",
    loadingHint: "Calculating the Tropical ephemeris...",
    sunLabel: "Sun Sign",
    moonLabel: "Moon Sign",
    risingLabel: "Rising / Ascendant",
    sunFallback: "Leo",
    moonFallback: "Scorpio",
    risingFallback: "Sagittarius",
    wheelTitle: "Western Natal Wheel (Tropical)",
    elementsTitle: "Element Distribution",
    fire: "Fire",
    earth: "Earth",
    air: "Air",
    water: "Water",
  },
} as const;

export default function WesternAstrologyClient({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiData>(null);
  const [wheelSvg, setWheelSvg] = useState<string>("");

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
      const [resData, resSvg] = await fetchParallelSettled([
        axios.post("/api/proxy", {
          endpoint: "/api/v1/western/big-three",
          payload,
          method: "POST",
        }),
        axios.post(
          "/api/proxy",
          {
            endpoint: "/api/v1/western/chart/wheel-svg",
            payload,
            method: "POST",
          },
          { responseType: "text" }
        ),
      ]);

      if (!resData) throw new Error(s.error);

      setData(resData);

      if (resSvg && typeof resSvg === "string" && resSvg.includes("<svg")) {
        setWheelSvg(resSvg);
      }
    } catch (errCaught) { const err = toApiError(errCaught);
      setError(err?.response?.data?.message || err?.message || s.error);
    } finally {
      setLoading(false);
    }
  };

  const sun = data?.sun || data?.sun_sign;
  const moon = data?.moon || data?.moon_sign;
  const rising = data?.rising || data?.ascendant_sign || data?.ascendant;

  const formContent = (
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
  );

  const resultsContent = (
    <>
      {error && <ErrorNote message={error} />}

      {!data && !loading && !error && (
        <div className="bg-card rounded-lg border border-line p-10 text-center text-ink-muted">
          <div className="text-4xl mb-3">♈</div>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-card border border-line rounded-md text-center">
                  <div className="text-[11px] uppercase font-bold text-ink-muted mb-1">{s.sunLabel}</div>
                  <div className="font-display text-xl font-medium text-ink">
                    {typeof sun === "object" ? sun?.sign || sun?.name : sun || s.sunFallback}
                  </div>
                  {typeof sun === "object" && sun?.degree && (
                    <div className="text-xs text-accent font-mono-brand mt-1">{Number(sun.degree).toFixed(2)}°</div>
                  )}
                </div>

                <div className="p-4 bg-card border border-line rounded-md text-center">
                  <div className="text-[11px] uppercase font-bold text-ink-muted mb-1">{s.moonLabel}</div>
                  <div className="font-display text-xl font-medium text-ink">
                    {typeof moon === "object" ? moon?.sign || moon?.name : moon || s.moonFallback}
                  </div>
                  {typeof moon === "object" && moon?.degree && (
                    <div className="text-xs text-accent font-mono-brand mt-1">{Number(moon.degree).toFixed(2)}°</div>
                  )}
                </div>

                <div className="p-4 bg-card border border-line rounded-md text-center">
                  <div className="text-[11px] uppercase font-bold text-ink-muted mb-1">{s.risingLabel}</div>
                  <div className="font-display text-xl font-medium text-ink">
                    {typeof rising === "object" ? rising?.sign || rising?.name : rising || s.risingFallback}
                  </div>
                  {typeof rising === "object" && rising?.degree && (
                    <div className="text-xs text-accent font-mono-brand mt-1">{Number(rising.degree).toFixed(2)}°</div>
                  )}
                </div>
              </div>

              {wheelSvg && (
                <ResultSection title={s.wheelTitle}>
                  <div
                    className="w-full max-w-md mx-auto aspect-square flex items-center justify-center bg-surface-alt/50 rounded-md p-2 border border-line/60"
                    dangerouslySetInnerHTML={{ __html: wheelSvg }}
                  />
                </ResultSection>
              )}

              {data.element_distribution && (
                <ResultSection title={s.elementsTitle}>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-lg bg-surface-alt border border-line">
                      <div className="font-semibold text-rose-600">{s.fire}</div>
                      <div className="text-sm font-bold text-ink mt-0.5">{data.element_distribution.fire || 0}%</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-alt border border-line">
                      <div className="font-semibold text-amber-600">{s.earth}</div>
                      <div className="text-sm font-bold text-ink mt-0.5">{data.element_distribution.earth || 0}%</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-alt border border-line">
                      <div className="font-semibold text-sky-600">{s.air}</div>
                      <div className="text-sm font-bold text-ink mt-0.5">{data.element_distribution.air || 0}%</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-alt border border-line">
                      <div className="font-semibold text-accent">{s.water}</div>
                      <div className="text-sm font-bold text-ink mt-0.5">{data.element_distribution.water || 0}%</div>
                    </div>
                  </div>
                </ResultSection>
              )}
            </div>
          )}
    </>
  );

  return (
    <CalculatorPageShell
      slug="western-astrology"
      category="western"
      title="Western Tropical Big-Three"
      hindiTitle="पाश्चात्य ज्योतिष (सूर्य-चंद्र-लग्न)"
      description={locale === "en" ? "Sun, Moon, and Rising sign calculated using the Tropical zodiac system." : "उष्णकटिबंधीय (Tropical) राशि पद्धति अनुसार सूर्य, चंद्र एवं लग्न राशि की गणना।"}
      icon="♈"
      locale={locale}
      layout="5-7"
      form={formContent}
      results={resultsContent}
    />
  );
}
