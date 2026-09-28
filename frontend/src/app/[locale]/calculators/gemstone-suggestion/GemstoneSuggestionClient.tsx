"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

const STRINGS = {
  hi: {
    error: "रत्न परामर्श गणना विफल रही।",
    calculating: "कुंडली अनुसार शुभ रत्न जांचे जा रहे हैं...",
    submit: "अनुकूल रत्न जानें",
    emptyHint: "लग्न, पंचम व नवम भाव के त्रिकोण स्वामियों के आधार पर जीवन, भाग्य व कारक रत्न प्राप्त करें।",
    loadingHint: "त्रिकोण, मारक एवं बाधक भाव नियमों की जांच जारी है...",
    lifeStoneLabel: "जीवन रत्न (Life Stone)",
    lifeStoneSub: "लग्नेश हेतु",
    luckyStoneLabel: "शुभ रत्न (Lucky Stone)",
    luckyStoneSub: "पंचमेश हेतु",
    fortuneStoneLabel: "भाग्य रत्न (Fortune Stone)",
    fortuneStoneSub: "नवमेश हेतु",
    avoidTitle: "वर्जित रत्न (Strictly Avoid)",
    marakaLabel: "मारक ग्रह वर्जना (Maraka Lords):",
    wearingTitle: "धारण विधि व सावधानियां",
    wearingBody: "रत्न हमेशा शुक्ल पक्ष के शुभ वार एवं नक्षत्र में, प्राण-प्रतिष्ठा व संबंधित ग्रह के बीज मंत्रों के 108 जप के उपरांत ही धारण करें। खंडित या दोषयुक्त रत्न धारण न करें।",
  },
  en: {
    error: "Gemstone recommendation calculation failed.",
    calculating: "Checking auspicious gemstones from your chart...",
    submit: "Get Recommended Gemstones",
    emptyHint: "Get your Life, Lucky, and Fortune gemstones based on the Lagna, 5th, and 9th house trikona lords.",
    loadingHint: "Checking Trikona, Maraka, and Badhak house rules...",
    lifeStoneLabel: "Life Stone",
    lifeStoneSub: "For the Lagna Lord",
    luckyStoneLabel: "Lucky Stone",
    luckyStoneSub: "For the 5th Lord",
    fortuneStoneLabel: "Fortune Stone",
    fortuneStoneSub: "For the 9th Lord",
    avoidTitle: "Strictly Avoid",
    marakaLabel: "Maraka Lord Restrictions:",
    wearingTitle: "How to Wear It",
    wearingBody: "Always wear a gemstone during the waxing moon (Shukla Paksha) on an auspicious day and nakshatra, after consecration (Prana Pratishtha) and 108 chants of the relevant planet's Beej Mantra. Never wear a cracked or flawed gemstone.",
  },
} as const;

export default function GemstoneSuggestionClient({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
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
        endpoint: "/api/v1/remedies/gemstones",
        payload,
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

  const lifeStone = data?.life_stone || data?.lifeStone;
  const luckyStone = data?.lucky_stone || data?.luckyStone;
  const bhagyaStone = data?.benefic_stone || data?.bhagya_stone || data?.fortune_stone;
  const restrictions = data?.restrictions || data?.forbidden_gemstones || data?.maraka_caution?.maraka_lords || [];
  const marakaWarning = data?.maraka_caution?.warning;

  return (
    <CalculatorPageShell
      slug="gemstone-suggestion"
      category="remedies"
      title="Lucky Gemstone Recommender"
      hindiTitle="रत्न परामर्श (Life / Lucky Stone)"
      description={locale === "en" ? "Precise gemstone matches, with Maraka and Badhak house cautions flagged." : "मारक व बाधक भावों की वर्जनाओं के साथ शुभ व अनुकूल रत्नों की सटीक पहचान।"}
      icon="💎"
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
              <div className="text-4xl mb-3">💎</div>
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
                {lifeStone && (
                  <div className="p-4 bg-card rounded-2xl border border-line shadow-sm text-center">
                    <div className="text-[11px] uppercase font-bold text-accent mb-1">{lifeStone.type || s.lifeStoneLabel}</div>
                    <div className="text-lg font-extrabold text-ink">{lifeStone.gemstone || lifeStone.name || lifeStone}</div>
                    <div className="text-xs text-ink-muted mt-1">{lifeStone.planet || s.lifeStoneSub}</div>
                  </div>
                )}
                {luckyStone && (
                  <div className="p-4 bg-card rounded-2xl border border-line shadow-sm text-center">
                    <div className="text-[11px] uppercase font-bold text-emerald-600 mb-1">{luckyStone.type || s.luckyStoneLabel}</div>
                    <div className="text-lg font-extrabold text-ink">{luckyStone.gemstone || luckyStone.name || luckyStone}</div>
                    <div className="text-xs text-ink-muted mt-1">{luckyStone.planet || s.luckyStoneSub}</div>
                  </div>
                )}
                {bhagyaStone && (
                  <div className="p-4 bg-card rounded-2xl border border-line shadow-sm text-center">
                    <div className="text-[11px] uppercase font-bold text-ink-soft mb-1">{bhagyaStone.type || s.fortuneStoneLabel}</div>
                    <div className="text-lg font-extrabold text-ink">{bhagyaStone.gemstone || bhagyaStone.name || bhagyaStone}</div>
                    <div className="text-xs text-ink-muted mt-1">{bhagyaStone.planet || s.fortuneStoneSub}</div>
                  </div>
                )}
              </div>

              {restrictions.length > 0 && (
                <ResultSection title={s.avoidTitle}>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs">
                    <div className="font-bold mb-1">{s.marakaLabel}</div>
                    <ul className="list-disc list-inside space-y-1">
                      {restrictions.map((r: any, idx: number) => (
                        <li key={idx}>{typeof r === "string" ? r : r.gemstone || r.name}</li>
                      ))}
                    </ul>
                    {marakaWarning && <p className="mt-2 text-[11px] leading-relaxed">{marakaWarning}</p>}
                  </div>
                </ResultSection>
              )}

              <ResultSection title={s.wearingTitle}>
                <p className="text-xs text-ink-soft leading-relaxed">
                  {s.wearingBody}
                </p>
              </ResultSection>
            </div>
          )}
        </div>
      </div>
    </CalculatorPageShell>
  );
}
