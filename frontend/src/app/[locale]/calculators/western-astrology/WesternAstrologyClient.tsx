"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

export default function WesternAstrologyClient({ locale }: { locale: Locale }) {
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
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
      const [resData, resSvg] = await Promise.all([
        axios.post("/api/demo/proxy", {
          endpoint: "/api/v1/western/big-three",
          payload,
          method: "POST",
        }),
        axios.post(
          "/api/demo/proxy",
          {
            endpoint: "/api/v1/western/chart/wheel-svg",
            payload,
            method: "POST",
          },
          { responseType: "text" }
        ).catch(() => null),
      ]);

      if (resData.data?.data) {
        setData(resData.data.data);
      } else {
        setData(resData.data);
      }

      if (resSvg?.data && typeof resSvg.data === "string" && resSvg.data.includes("<svg")) {
        setWheelSvg(resSvg.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "पाश्चात्य ज्योतिष गणना विफल रही।");
    } finally {
      setLoading(false);
    }
  };

  const sun = data?.sun || data?.sun_sign;
  const moon = data?.moon || data?.moon_sign;
  const rising = data?.rising || data?.ascendant_sign || data?.ascendant;

  return (
    <CalculatorPageShell
      slug="western-astrology"
      category="western"
      title="Western Tropical Big-Three"
      hindiTitle="पाश्चात्य ज्योतिष (सूर्य-चंद्र-लग्न)"
      description="उष्णकटिबंधीय (Tropical) राशि पद्धति अनुसार सूर्य, चंद्र एवं लग्न राशि की गणना।"
      icon="♈"
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
                  <Loader2 className="w-4 h-4 animate-spin" /> ट्रॉपिकल राशि गणना जारी...
                </>
              ) : (
                "वेस्टर्न बिग-थ्री जानें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {error && <ErrorNote message={error} />}

          {!data && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">♈</div>
              <p className="text-sm">जन्म समय अनुसार वेस्टर्न ट्रॉपिकल ज़ोडिएक (Sun, Moon & Rising Sign) और नेटल व्हील देखें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">ट्रॉपिकल एफेमेरिस (सायन पद्धति) गणना जारी है...</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl text-center">
                  <div className="text-[11px] uppercase font-bold text-amber-800 mb-1">सूर्य राशि (Sun Sign)</div>
                  <div className="text-xl font-extrabold text-amber-950">
                    {typeof sun === "object" ? sun?.sign || sun?.name : sun || "Leo"}
                  </div>
                  {typeof sun === "object" && sun?.degree && (
                    <div className="text-xs text-amber-700 font-mono mt-1">{Number(sun.degree).toFixed(2)}°</div>
                  )}
                </div>

                <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl text-center">
                  <div className="text-[11px] uppercase font-bold text-indigo-800 mb-1">चंद्र राशि (Moon Sign)</div>
                  <div className="text-xl font-extrabold text-indigo-950">
                    {typeof moon === "object" ? moon?.sign || moon?.name : moon || "Scorpio"}
                  </div>
                  {typeof moon === "object" && moon?.degree && (
                    <div className="text-xs text-indigo-700 font-mono mt-1">{Number(moon.degree).toFixed(2)}°</div>
                  )}
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl text-center">
                  <div className="text-[11px] uppercase font-bold text-purple-800 mb-1">लग्न (Rising / Asc)</div>
                  <div className="text-xl font-extrabold text-purple-950">
                    {typeof rising === "object" ? rising?.sign || rising?.name : rising || "Sagittarius"}
                  </div>
                  {typeof rising === "object" && rising?.degree && (
                    <div className="text-xs text-purple-700 font-mono mt-1">{Number(rising.degree).toFixed(2)}°</div>
                  )}
                </div>
              </div>

              {wheelSvg && (
                <ResultSection title="वेस्टर्न नेटल व्हील (Tropical Natal Wheel)">
                  <div
                    className="w-full max-w-md mx-auto aspect-square flex items-center justify-center bg-surface-alt/50 rounded-xl p-2 border border-line/60"
                    dangerouslySetInnerHTML={{ __html: wheelSvg }}
                  />
                </ResultSection>
              )}

              {data.element_distribution && (
                <ResultSection title="तत्व वितरण (Elements)">
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-lg bg-surface-alt border border-line">
                      <div className="font-semibold text-rose-600">अग्नि (Fire)</div>
                      <div className="text-sm font-bold text-ink mt-0.5">{data.element_distribution.fire || 0}%</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-alt border border-line">
                      <div className="font-semibold text-amber-600">पृथ्वी (Earth)</div>
                      <div className="text-sm font-bold text-ink mt-0.5">{data.element_distribution.earth || 0}%</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-alt border border-line">
                      <div className="font-semibold text-sky-600">वायु (Air)</div>
                      <div className="text-sm font-bold text-ink mt-0.5">{data.element_distribution.air || 0}%</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-alt border border-line">
                      <div className="font-semibold text-blue-600">जल (Water)</div>
                      <div className="text-sm font-bold text-ink mt-0.5">{data.element_distribution.water || 0}%</div>
                    </div>
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
