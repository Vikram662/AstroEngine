"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { fetchParallelSettled } from "@/lib/calculatorApi";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

const STRINGS = {
  hi: {
    error: "रुद्राक्ष सुझाव गणना विफल रही।",
    calculating: "ग्रह बल एवं रुद्राक्ष चयन जारी...",
    submit: "रुद्राक्ष परामर्श प्राप्त करें",
    emptyHint: "अपनी जन्म कुंडली के कमजोर ग्रहों के निवारण हेतु 1 से 14 मुखी रुद्राक्ष की सिफारिश देखें।",
    loadingHint: "ग्रह युति, दृष्टि एवं षड्बल आधार पर रुद्राक्ष मैपिंग जारी है...",
    resultTitle: "अनुशंसित रुद्राक्ष (Recommended Rudraksha)",
    karakaFallback: "कारक ग्रह",
    deityLabel: "अधिष्ठाता देवता:",
    deityFallback: "भगवान शिव",
    rulesTitle: "धारण नियम",
    rulesBody: "रुद्राक्ष को गंगाजल और कच्चे दूध से शुद्ध करके \"ॐ नमः शिवाय\" मंत्र का 108 बार जाप करके लाल धागे या चांदी की चेन में सोमवार या शिवरात्रि के दिन धारण करना परम कल्याणकारी होता है।",
  },
  en: {
    error: "Rudraksha recommendation calculation failed.",
    calculating: "Selecting Rudraksha by planetary strength...",
    submit: "Get Rudraksha Recommendations",
    emptyHint: "See the recommended 1 to 14 Mukhi Rudraksha to remedy the weak planets in your birth chart.",
    loadingHint: "Mapping Rudraksha per planetary conjunctions, aspects, and Shadbala...",
    resultTitle: "Recommended Rudraksha",
    karakaFallback: "Significator Planet",
    deityLabel: "Presiding Deity:",
    deityFallback: "Lord Shiva",
    rulesTitle: "How to Wear It",
    rulesBody: "Purify the Rudraksha with Ganga water and raw milk, chant \"Om Namah Shivaya\" 108 times, and wear it on a red thread or silver chain on a Monday or Shivratri for the best results.",
  },
} as const;

export default function RudrakshaMappingClient({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rudrakshaList, setRudrakshaList] = useState<any[]>([]);
  const [gemData, setGemData] = useState<any>(null);
  const [mantraData, setMantraData] = useState<any>(null);

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
      const [rudraksha, gems, mantras] = await fetchParallelSettled([
        axios.post("/api/proxy", {
          endpoint: "/api/v1/remedies/rudraksha",
          payload,
          method: "POST",
        }),
        axios.post("/api/proxy", {
          endpoint: "/api/v1/remedies/gemstones",
          payload,
          method: "POST",
        }),
        axios.post("/api/proxy", {
          endpoint: "/api/v1/remedies/mantras",
          payload,
          method: "POST",
        }),
      ]);

      const list = rudraksha?.rudraksha_recommendations || rudraksha || [];
      setRudrakshaList(Array.isArray(list) ? list : []);

      if (gems) setGemData(gems);
      if (mantras) setMantraData(mantras);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || s.error);
    } finally {
      setLoading(false);
    }
  };

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

      {!rudrakshaList.length && !loading && !error && (
        <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
          <div className="text-4xl mb-3">📿</div>
          <p className="text-sm">{s.emptyHint}</p>
        </div>
      )}

      {loading && (
        <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
          <p className="text-sm">{s.loadingHint}</p>
        </div>
      )}

      {rudrakshaList.length > 0 && (
        <div className="space-y-6">
              <ResultSection title={s.resultTitle}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rudrakshaList.map((r: any, idx: number) => (
                    <div key={idx} className="p-4 bg-surface-alt/70 border border-line rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-accent text-base">
                          {r.mukhi || r.name}
                        </span>
                        <ResultBadge tone="accent">{r.ruling_planet || r.planet || s.karakaFallback}</ResultBadge>
                      </div>
                      <div className="text-xs text-ink-soft mb-2">
                        <span className="font-semibold text-ink">{s.deityLabel}</span> {r.deity || r.god || s.deityFallback}
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        {r.benefits || r.reason || r.description}
                      </p>
                    </div>
                  ))}
                </div>
              </ResultSection>

              {/* Life Stone and Complementary Gemstone Sync */}
              {gemData?.life_stone && (
                <ResultSection title={lang === "hi" ? "संबंधित जीवन रत्न व धातु संयोग" : "Life Stone & Complementary Metal"}>
                  <div className="p-4 bg-card border border-line rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-ink text-sm">{gemData.life_stone.gemstone}</span>
                      <span className="text-[11px] text-accent font-semibold">{gemData.life_stone.type}</span>
                    </div>
                    <p className="text-ink-soft leading-relaxed">
                      रुद्राक्ष के साथ {gemData.life_stone.gemstone} को {gemData.life_stone.wearing_finger} में {gemData.life_stone.metal} में धारण करने से रुद्राक्ष की चुंबकीय ऊर्जा में कई गुना वृद्धि होती है।
                    </p>
                  </div>
                </ResultSection>
              )}

              <ResultSection title={s.rulesTitle}>
                <div className="p-4 bg-card border border-line rounded-xl space-y-2 text-xs text-ink-soft leading-relaxed">
                  <p>{s.rulesBody}</p>
                  <div className="p-2.5 bg-surface-alt rounded-lg text-[11px] space-y-1">
                    <div><span className="font-bold text-ink">प्राण प्रतिष्ठा मंत्र:</span> ॐ नमः शिवाय (108 जप)</div>
                    <div><span className="font-bold text-ink">शुभ वार:</span> सोमवार अथवा महाशिवरात्रि, प्रदोष काल</div>
                    <div><span className="font-bold text-ink">शुद्धिकरण:</span> पंचामृत (दूध, दही, घी, शहद, गंगाजल) से स्नान कराकर धूप-दीप दिखाएं।</div>
                  </div>
                </div>
              </ResultSection>
            </div>
          )}
    </>
  );

  return (
    <CalculatorPageShell
      slug="rudraksha-mapping"
      category="remedies"
      title="1 to 14 Mukhi Rudraksha"
      hindiTitle="रुद्राक्ष परामर्श एवं कवच (Rudraksha Therapy & Shield)"
      description={locale === "en" ? "Classical Rudraksha prescriptions to strengthen Lagna and pacify afflicted planets, along with consecration rituals." : "लग्न शुद्धि, प्राण-ऊर्जा वृद्धि एवं ग्रह दोष शमन हेतु शास्त्रीय 1 से 14 मुखी रुद्राक्ष परामर्श व धारण विधि।"}
      icon="📿"
      locale={locale}
      form={formContent}
      results={resultsContent}
    />
  );
}
