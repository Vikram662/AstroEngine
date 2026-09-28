"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Sparkles, HelpCircle, Loader2 } from "lucide-react";

const STRINGS = {
  hi: {
    defaultQuestion: "मेरे करियर और भविष्य में आगे क्या संभावनाएं हैं?",
    error: "टैरो कार्ड परामर्श विफल रहा।",
    modeLabel: "स्प्रेड प्रकार (Spread Mode)",
    modeDaily: "दैनिक कार्ड (Single Daily Card)",
    modeTime: "3-कार्ड: अतीत, वर्तमान, भविष्य (Time Spread)",
    modeMind: "3-कार्ड: मन, शरीर, आत्मा (Mind-Body-Spirit)",
    modeCeltic: "10-कार्ड सेल्टिक क्रॉस (Celtic Cross Comprehensive)",
    questionLabel: "आपका प्रश्न (Your Question)",
    questionPlaceholder: "उदा. क्या मुझे नई नौकरी में सफलता मिलेगी?",
    calculating: "कार्ड निकाले जा रहे हैं...",
    submit: "टैरो कार्ड ड्रा करें",
    emptyHint: "अपना प्रश्न सोचें, स्प्रेड चुनें और रहस्यमयी राइडर-वेट टैरो डेक से मार्गदर्शन प्राप्त करें।",
    loadingHint: "78 टैरो आर्काना कार्डों का फेरबदल एवं स्प्रेड मैपिंग जारी है...",
    interpretationTitle: "समग्र फलादेश (Overall Interpretation)",
    reversed: "उल्टा (Reversed)",
    upright: "सीधा (Upright)",
    positionLabel: "स्थिति:",
    keywordsLabel: "मुख्य संकेत:",
  },
  en: {
    defaultQuestion: "What possibilities lie ahead for my career and future?",
    error: "Tarot reading failed.",
    modeLabel: "Spread Mode",
    modeDaily: "Single Daily Card",
    modeTime: "3-Card: Past, Present, Future (Time Spread)",
    modeMind: "3-Card: Mind, Body, Spirit",
    modeCeltic: "10-Card Celtic Cross (Comprehensive)",
    questionLabel: "Your Question",
    questionPlaceholder: "e.g. Will I succeed in my new job?",
    calculating: "Drawing your cards...",
    submit: "Draw Tarot Cards",
    emptyHint: "Think of your question, choose a spread, and get guidance from the mystical Rider-Waite tarot deck.",
    loadingHint: "Shuffling all 78 tarot arcana and mapping the spread...",
    interpretationTitle: "Overall Interpretation",
    reversed: "Reversed",
    upright: "Upright",
    positionLabel: "Position:",
    keywordsLabel: "Key Signs:",
  },
} as const;

export default function TarotReadingClient({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  const [question, setQuestion] = useState<string>(s.defaultQuestion);
  const [mode, setMode] = useState<"daily" | "3_card_time" | "3_card_mind" | "celtic_cross">("daily");
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let endpoint = "/api/v1/tarot/daily-card";
    const payload: any = { question, lang };

    if (mode === "celtic_cross") {
      endpoint = "/api/v1/tarot/spread/celtic-cross";
    } else if (mode === "3_card_time") {
      endpoint = "/api/v1/tarot/spread/3-card";
      payload.spread_mode = "time";
    } else if (mode === "3_card_mind") {
      endpoint = "/api/v1/tarot/spread/3-card";
      payload.spread_mode = "mind_body_spirit";
    }

    try {
      const res = await axios.post("/api/proxy", {
        endpoint,
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

  const cards = data?.cards || (data?.card ? [data.card] : []);

  return (
    <CalculatorPageShell
      slug="tarot-reading"
      category="tarot"
      title="Tarot Card Reading"
      hindiTitle="टैरो कार्ड परामर्श"
      description={locale === "en" ? "Get an answer to your question through a daily card, 3-card spread, or Celtic Cross." : "दैनिक कार्ड, 3-कार्ड स्प्रेड एवं सेल्टिक क्रॉस से अपने प्रश्न का उत्तर पाएं।"}
      icon="🔮"
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
              <label htmlFor="tarot_mode" className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>{s.modeLabel}</span>
              </label>
              <select
                id="tarot_mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
              >
                <option value="daily">{s.modeDaily}</option>
                <option value="3_card_time">{s.modeTime}</option>
                <option value="3_card_mind">{s.modeMind}</option>
                <option value="celtic_cross">{s.modeCeltic}</option>
              </select>
            </div>

            <div>
              <label htmlFor="tarot_q" className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-accent" />
                <span>{s.questionLabel}</span>
              </label>
              <textarea
                id="tarot_q"
                rows={3}
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={s.questionPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition resize-none"
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
              <div className="text-4xl mb-3">🔮</div>
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
              {data.interpretation && (
                <ResultSection title={s.interpretationTitle}>
                  <p className="text-xs text-ink-soft leading-relaxed">{data.interpretation}</p>
                </ResultSection>
              )}

              {Array.isArray(cards) && cards.length > 0 && (
                <div className="space-y-4">
                  {cards.map((c: any, idx: number) => {
                    const isRev = c.is_reversed || c.reversed;
                    return (
                      <div key={idx} className="p-5 bg-card rounded-2xl border border-line shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-base text-ink">{c.name || c.card_name}</span>
                          <ResultBadge tone={isRev ? "bad" : "good"}>
                            {isRev ? s.reversed : s.upright}
                          </ResultBadge>
                        </div>
                        {c.position && (
                          <div className="text-xs font-semibold text-accent mb-2">
                            {s.positionLabel} {c.position}
                          </div>
                        )}
                        <p className="text-xs text-ink-soft leading-relaxed mb-2">
                          {c.meaning || c.description}
                        </p>
                        {c.keywords && (
                          <div className="text-[11px] text-ink-muted">
                            <span className="font-semibold text-ink">{s.keywordsLabel}</span>{" "}
                            {Array.isArray(c.keywords) ? c.keywords.join(", ") : c.keywords}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </CalculatorPageShell>
  );
}
