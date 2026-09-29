"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { fetchParallelSettled } from "@/lib/calculatorApi";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Calendar, User, Loader2 } from "lucide-react";
import { ApiData, toApiError } from "@/lib/apiTypes";

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
  const [data, setData] = useState<ApiData>(null);
  const [favorableData, setFavorableData] = useState<ApiData>(null);
  const [loshuData, setLoshuData] = useState<ApiData>(null);
  const [pinnaclesData, setPinnaclesData] = useState<ApiData>(null);
  const [forecastData, setForecastData] = useState<ApiData>(null);

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
      const [resCore, resFav, resLoshu, resPinnacles, resForecast] = await fetchParallelSettled([
        axios.post("/api/proxy", {
          endpoint: "/api/v1/numerology/core-numbers",
          payload,
          queryParams: name ? { name } : null,
          method: "POST",
        }),
        axios.post("/api/proxy", {
          endpoint: "/api/v1/numerology/favorable",
          payload,
          method: "POST",
        }),
        axios.post("/api/proxy", {
          endpoint: "/api/v1/numerology/loshu-grid",
          payload,
          method: "POST",
        }),
        axios.post("/api/proxy", {
          endpoint: "/api/v1/numerology/pinnacles-challenges",
          payload,
          method: "POST",
        }),
        axios.post("/api/proxy", {
          endpoint: "/api/v1/numerology/forecast",
          payload,
          queryParams: { target_year: new Date().getFullYear() },
          method: "POST",
        }),
      ]);

      if (!resCore) throw new Error(s.error);

      setData(resCore);
      if (resFav) setFavorableData(resFav);
      if (resLoshu) setLoshuData(resLoshu);
      if (resPinnacles) setPinnaclesData(resPinnacles);
      if (resForecast) setForecastData(resForecast);
    } catch (errCaught) { const err = toApiError(errCaught);
      setError(err?.response?.data?.message || err?.message || s.error);
    } finally {
      setLoading(false);
    }
  };

  const mulank = data?.mulank;
  const bhagyank = data?.bhagyank;
  const namank = data?.namank;

  const formContent = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-line">
        <span className="text-lg">🔢</span>
        <h2 className="text-sm font-bold text-ink">
          {lang === "en" ? "Enter Numerology Details" : "अंक ज्योतिष विवरण प्रविष्ट करें"}
        </h2>
      </div>

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
            className="w-full px-3.5 py-2.5 rounded-md border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
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
            className="w-full px-3.5 py-2.5 rounded-md border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
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
  );

  const resultsContent = (
    <>
      {error && <ErrorNote message={error} />}

      {!data && !loading && !error && (
        <div className="bg-card rounded-lg border border-line p-12 text-center text-ink-muted">
          <div className="text-5xl mb-4">🔢</div>
          <h3 className="text-base font-bold text-ink mb-1">
            {lang === "en" ? "Complete Numerology Reading" : "संपूर्ण अंकशास्त्र विश्लेषण"}
          </h3>
          <p className="text-sm max-w-md mx-auto text-ink-soft">{s.emptyHint}</p>
        </div>
      )}

      {loading && (
        <div className="bg-card rounded-lg border border-line p-14 text-center text-ink-soft flex flex-col items-center justify-center">
          <Loader2 className="w-9 h-9 text-accent animate-spin mb-3" />
          <p className="text-sm font-semibold text-ink">{s.loadingHint}</p>
        </div>
      )}

          {data && (
            <div className="space-y-6">
              {/* 1. Core Numbers Cards with Ruling Planets & Traits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-card border border-line rounded-md text-center">
                  <div className="text-[11px] uppercase font-bold text-ink-muted mb-1">{s.mulankLabel}</div>
                  <div className="font-display text-4xl font-extrabold text-accent">
                    {mulank?.number ?? 1}
                  </div>
                  <div className="text-xs font-semibold text-ink mt-1.5">
                    {s.lordLabel} <span className="text-accent">{mulank?.ruler || s.mulankLordFallback}</span>
                  </div>
                  {mulank?.traits && (
                    <div className="text-[11px] text-ink-soft mt-1 leading-snug">{mulank.traits}</div>
                  )}
                </div>

                <div className="p-4 bg-card border border-line rounded-md text-center">
                  <div className="text-[11px] uppercase font-bold text-ink-muted mb-1">{s.bhagyankLabel}</div>
                  <div className="font-display text-4xl font-extrabold text-accent">
                    {bhagyank?.number ?? 1}
                  </div>
                  <div className="text-xs font-semibold text-ink mt-1.5">
                    {s.lordLabel} <span className="text-accent">{bhagyank?.ruler || s.bhagyankLordFallback}</span>
                  </div>
                  {bhagyank?.traits && (
                    <div className="text-[11px] text-ink-soft mt-1 leading-snug">{bhagyank.traits}</div>
                  )}
                </div>

                <div className="p-4 bg-card border border-line rounded-md text-center">
                  <div className="text-[11px] uppercase font-bold text-ink-muted mb-1">{s.namankLabel}</div>
                  <div className="font-display text-4xl font-extrabold text-accent">
                    {namank?.number ?? 1}
                  </div>
                  <div className="text-xs font-semibold text-ink mt-1.5">
                    {s.lordLabel} <span className="text-accent">{namank?.ruler || s.namankLordFallback}</span>
                  </div>
                  <div className="text-[11px] text-ink-muted mt-1 font-mono truncate">
                    {namank?.calculated_from || name}
                  </div>
                </div>
              </div>

              {/* 2. Personal Year Cycle & Forecast */}
              {forecastData && (
                <ResultSection title={lang === "en" ? `Annual Forecast (${forecastData.target_year})` : `वार्षिक फलादेश (${forecastData.target_year})`}>
                  <div className="p-4 rounded-md border border-accent/30 bg-accent-soft/30 flex items-start gap-3">
                    <span className="text-2xl">🌟</span>
                    <div>
                      <div className="text-xs font-bold text-ink flex items-center gap-2">
                        <span>{lang === "en" ? "Personal Year Number:" : "व्यक्तिगत वर्ष अंक:"}</span>
                        <ResultBadge tone="accent">{forecastData.personal_year}</ResultBadge>
                      </div>
                      <p className="text-xs leading-5 text-ink-soft mt-1.5">
                        {forecastData.theme}
                      </p>
                    </div>
                  </div>
                </ResultSection>
              )}

              {/* 3. Comprehensive Favorable Profile & Lucky Harmonies */}
              {favorableData && (
                <ResultSection title={s.compatTitle}>
                  <ResultRow
                    label={s.luckyNumbers}
                    value={
                      <div className="flex flex-wrap gap-1">
                        {favorableData.lucky_dates?.map((d: number) => (
                          <ResultBadge key={d} tone="good">{d}</ResultBadge>
                        ))}
                      </div>
                    }
                    accent
                  />
                  <ResultRow
                    label={s.luckyDays}
                    value={Array.isArray(favorableData.favorable_days) ? favorableData.favorable_days.join(", ") : String(favorableData.favorable_days)}
                  />
                  <ResultRow
                    label={s.luckyColors}
                    value={
                      <div className="flex flex-wrap gap-1.5">
                        {favorableData.favorable_colors?.map((c: string) => (
                          <span key={c} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-alt border border-line text-ink">
                            {c}
                          </span>
                        ))}
                      </div>
                    }
                  />
                  <ResultRow
                    label={lang === "en" ? "Friendly Numbers" : "मित्र अंक (अनुकूल)"}
                    value={
                      <div className="flex flex-wrap gap-1">
                        {favorableData.friendly_numbers?.map((n: number) => (
                          <ResultBadge key={n} tone="good">{n}</ResultBadge>
                        ))}
                      </div>
                    }
                  />
                  {favorableData.avoid_numbers?.length > 0 && (
                    <ResultRow
                      label={lang === "en" ? "Numbers to Avoid" : "शत्रु / वर्जित अंक"}
                      value={
                        <div className="flex flex-wrap gap-1">
                          {favorableData.avoid_numbers.map((n: number) => (
                            <ResultBadge key={n} tone="bad">{n}</ResultBadge>
                          ))}
                        </div>
                      }
                    />
                  )}
                </ResultSection>
              )}

              {/* 4. 3x3 Lo Shu Grid & Life Planes */}
              {loshuData && (
                <ResultSection title={lang === "en" ? "Lo Shu 3x3 Magic Grid & Planes" : "लो-शू 3x3 चक्र एवं जीवन तल"}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                    {/* The 3x3 Table */}
                    <div className="w-full max-w-[240px] mx-auto grid grid-cols-3 gap-2 p-3 bg-surface-alt/50 rounded-lg border border-line">
                      {[
                        { pos: 4, label: "4 (Rahu)" },
                        { pos: 9, label: "9 (Mars)" },
                        { pos: 2, label: "2 (Moon)" },
                        { pos: 3, label: "3 (Jup)" },
                        { pos: 5, label: "5 (Merc)" },
                        { pos: 7, label: "7 (Ketu)" },
                        { pos: 8, label: "8 (Sat)" },
                        { pos: 1, label: "1 (Sun)" },
                        { pos: 6, label: "6 (Ven)" },
                      ].map((item) => {
                        const count = loshuData.missing_numbers?.includes(item.pos) ? 0 : 1;
                        return (
                          <div
                            key={item.pos}
                            className={`aspect-square flex flex-col items-center justify-center rounded-md border font-bold text-base transition ${
                              count > 0
                                ? "bg-accent text-white border-accent shadow-xs"
                                : "bg-card text-ink-muted/40 border-line"
                            }`}
                          >
                            <span>{item.pos}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Planes Status */}
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center p-2 rounded-lg bg-card border border-line">
                        <span className="font-semibold text-ink">{lang === "en" ? "Mental Plane (4-9-2)" : "मानसिक तल (4-9-2)"}</span>
                        <ResultBadge tone={loshuData.planes?.mental_plane_4_9_2 ? "good" : "neutral"}>
                          {loshuData.planes?.mental_plane_4_9_2 ? (lang === "en" ? "Active" : "सक्रिय") : (lang === "en" ? "Partial" : "आंशिक")}
                        </ResultBadge>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-card border border-line">
                        <span className="font-semibold text-ink">{lang === "en" ? "Emotional Plane (3-5-7)" : "भावनात्मक तल (3-5-7)"}</span>
                        <ResultBadge tone={loshuData.planes?.emotional_plane_3_5_7 ? "good" : "neutral"}>
                          {loshuData.planes?.emotional_plane_3_5_7 ? (lang === "en" ? "Active" : "सक्रिय") : (lang === "en" ? "Partial" : "आंशिक")}
                        </ResultBadge>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-card border border-line">
                        <span className="font-semibold text-ink">{lang === "en" ? "Practical Plane (8-1-6)" : "व्यावहारिक तल (8-1-6)"}</span>
                        <ResultBadge tone={loshuData.planes?.practical_plane_8_1_6 ? "good" : "neutral"}>
                          {loshuData.planes?.practical_plane_8_1_6 ? (lang === "en" ? "Active" : "सक्रिय") : (lang === "en" ? "Partial" : "आंशिक")}
                        </ResultBadge>
                      </div>
                    </div>
                  </div>
                </ResultSection>
              )}

              {/* 5. 4 Life Pinnacles & Challenges */}
              {pinnaclesData?.pinnacles && (
                <ResultSection title={lang === "en" ? "4 Life Pinnacles (पिनेकल चक्र)" : "जीवन के 4 मुख्य पिनेकल (उत्कर्ष काल)"}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {pinnaclesData.pinnacles.map((p: ApiData) => (
                      <div key={p.pinnacle} className="p-3 bg-card border border-line rounded-md text-center">
                        <span className="text-[10px] text-ink-muted font-bold uppercase block">{lang === "en" ? `Pinnacle ${p.pinnacle}` : `पिनेकल ${p.pinnacle}`}</span>
                        <span className="text-2xl font-semibold text-accent block my-1">{p.number}</span>
                        <span className="text-[11px] text-ink-soft block">{p.age_span}</span>
                      </div>
                    ))}
                  </div>
                </ResultSection>
              )}
            </div>
          )}
    </>
  );

  return (
    <CalculatorPageShell
      slug="core-numerology"
      category="numerology"
      title="Life Path & Destiny Numbers"
      hindiTitle="मूलांक, भाग्यांक एवं संपूर्ण अंक ज्योतिष"
      description={locale === "en" ? "Comprehensive Vedic & Pythagorean numerology — Driver, Conductor, Lo Shu Grid, Pinnacles, and Life Forecast." : "जन्मतिथि व नामांक आधारित मूलांक, भाग्यांक, लो-शू ग्रिड, पिनेकल चक्र एवं संपूर्ण जीवन फलादेश।"}
      icon="🔢"
      locale={locale}
      form={formContent}
      results={resultsContent}
    />
  );
}
