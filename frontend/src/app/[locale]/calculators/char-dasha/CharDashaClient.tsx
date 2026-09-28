"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

const STRINGS = {
  hi: {
    error: "जैमिनी चर दशा गणना विफल रही।",
    calculating: "चर दशा क्रम गणना जारी...",
    submit: "जैमिनी चर दशा निकालें",
    emptyHint: "महर्षि जैमिनी प्रतिपादित राशि दशा एवं 7 चर कारकों (आत्मकारक आदि) का फल देखें।",
    loadingHint: "चर दशा वर्ष एवं जैमिनी कारक अंशों की गणना जारी है...",
    karakasTitle: "जैमिनी 7 चर कारक (Jaimini Karakas)",
    tableTitle: "जैमिनी चर दशा क्रम (Rashi Dasha Timeline)",
    colSign: "दशा राशि",
    colLord: "स्वामी",
    colDuration: "अवधि (वर्ष)",
    colStart: "आरंभ काल",
    colEnd: "समाप्ति काल",
    years: "वर्ष",
  },
  en: {
    error: "Jaimini Chara Dasha calculation failed.",
    calculating: "Calculating the Chara Dasha sequence...",
    submit: "Get Jaimini Chara Dasha",
    emptyHint: "See Maharishi Jaimini's sign-based dasha and the reading from all 7 Chara Karakas (Atmakaraka and others).",
    loadingHint: "Calculating Chara Dasha years and Jaimini Karaka degrees...",
    karakasTitle: "Jaimini's 7 Chara Karakas",
    tableTitle: "Jaimini Chara Dasha Timeline (Rashi Dasha)",
    colSign: "Dasha Sign",
    colLord: "Lord",
    colDuration: "Duration (yrs)",
    colStart: "Start",
    colEnd: "End",
    years: "yrs",
  },
} as const;

export default function CharDashaClient({ locale }: { locale: Locale }) {
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
        endpoint: "/api/v1/dasha/char/jaimini",
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

  const karakas = data?.karakas || [];
  const charDashaList = data?.char_dasha_timeline || data?.char_dasha || data?.periods || data?.dashas || [];

  return (
    <CalculatorPageShell
      slug="char-dasha"
      category="dasha"
      title="Jaimini Chara Dasha"
      hindiTitle="जैमिनी चर दशा"
      description={locale === "en" ? "Jaimini's sign-based dasha sequence, read through the Atmakaraka and Amatyakaraka significators." : "राशि-आधारित दशा क्रम एवं आत्मकारक, अमात्यकारक ग्रहों के आधार पर फलादेश।"}
      icon="🧭"
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
              <div className="text-4xl mb-3">🧭</div>
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
              {karakas.length > 0 && (
                <ResultSection title={s.karakasTitle}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {karakas.map((k: any, idx: number) => (
                      <div key={idx} className="p-3 bg-surface-alt rounded-xl border border-line/60">
                        <div className="text-[11px] text-ink-muted uppercase font-semibold">
                          {k.karaka || k.name}
                        </div>
                        <div className="text-sm font-bold text-accent mt-0.5">
                          {k.planet || k.graha}
                        </div>
                        {k.degree && (
                          <div className="text-[11px] text-ink-soft font-mono-brand mt-0.5">
                            {Number(k.degree).toFixed(2)}°
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ResultSection>
              )}

              {Array.isArray(charDashaList) && charDashaList.length > 0 && (
                <ResultSection title={s.tableTitle}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                        <tr>
                          <th className="py-2.5 px-3">{s.colSign}</th>
                          <th className="py-2.5 px-3">{s.colLord}</th>
                          <th className="py-2.5 px-3">{s.colDuration}</th>
                          <th className="py-2.5 px-3">{s.colStart}</th>
                          <th className="py-2.5 px-3">{s.colEnd}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {charDashaList.map((d: any, idx: number) => (
                          <tr key={idx} className="hover:bg-surface-alt/40 transition">
                            <td className="py-2.5 px-3 font-bold text-ink">
                              {d.sign || d.rashi || d.name}
                            </td>
                            <td className="py-2.5 px-3">{d.ruler || d.lord || "-"}</td>
                            <td className="py-2.5 px-3 font-semibold">{d.duration_years || d.years || "-"} {s.years}</td>
                            <td className="py-2.5 px-3 font-mono-brand">{d.start_date || d.from || "-"}</td>
                            <td className="py-2.5 px-3 font-mono-brand">{d.end_date || d.to || "-"}</td>
                          </tr>
                        ))}
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
