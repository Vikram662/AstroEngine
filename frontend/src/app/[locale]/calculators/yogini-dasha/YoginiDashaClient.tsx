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
    error: "योगिनी दशा गणना विफल रही।",
    calculating: "योगिनी दशा गणना जारी...",
    submit: "योगिनी दशा निकालें",
    emptyHint: "36 वर्षीय 8 योगिनी (मंगला से संकटा) दशा क्रम व वर्तमान दशा का फलादेश देखें।",
    loadingHint: "8 योगिनी दशाओं के 36 वर्षीय चक्र की गणना हो रही है...",
    currentTitle: "वर्तमान सक्रिय योगिनी दशा",
    activeLabel: "सक्रिय योगिनी",
    defaultYogini: "सिद्धा",
    lordLabel: "स्वामी:",
    endDateLabel: "समाप्ति तिथि",
    tableTitle: "36-वर्षीय योगिनी दशा तालिका",
    colYogini: "योगिनी",
    colLord: "स्वामी ग्रह",
    colDuration: "अवधि",
    colDates: "आरंभ - समाप्ति",
    years: "वर्ष",
    to: "से",
  },
  en: {
    error: "Yogini Dasha calculation failed.",
    calculating: "Calculating Yogini Dasha...",
    submit: "Get Yogini Dasha",
    emptyHint: "See the 36-year, 8-Yogini (Mangala to Sankata) dasha sequence and the current period's reading.",
    loadingHint: "Calculating the 36-year cycle across all 8 Yogini dashas...",
    currentTitle: "Current Active Yogini Dasha",
    activeLabel: "Active Yogini",
    defaultYogini: "Siddha",
    lordLabel: "Lord:",
    endDateLabel: "End Date",
    tableTitle: "36-Year Yogini Dasha Table",
    colYogini: "Yogini",
    colLord: "Ruling Planet",
    colDuration: "Duration",
    colDates: "Start – End",
    years: "yrs",
    to: "to",
  },
} as const;

export default function YoginiDashaClient({ locale }: { locale: Locale }) {
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
        endpoint: "/api/v1/dasha/yogini/complete",
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

  const cycleList = data?.periods || data?.cycles || data?.yoginis || data?.dashas || [];
  const currentYogini =
    data?.current ||
    data?.current_yogini ||
    (() => {
      const today = new Date();
      return cycleList.find((y: any) => {
        if (!y.start_date || !y.end_date) return false;
        return today >= new Date(y.start_date) && today <= new Date(y.end_date);
      });
    })();

  return (
    <CalculatorPageShell
      slug="yogini-dasha"
      category="dasha"
      title="36-Year Yogini Dasha"
      hindiTitle="36 वर्षीय योगिनी दशा"
      description={locale === "en" ? "The 8-dasha cycle of Mangala, Pingala, Dhanya, Bhramari, Bhadrika, Ulka, Siddha, and Sankata." : "मंगला, पिंगला, धन्या, भ्रामरी, भद्रिका, उल्का, सिद्धा व संकटा का चक्र।"}
      icon="☸️"
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
              <div className="text-4xl mb-3">☸️</div>
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
              {currentYogini && (
                <ResultSection title={s.currentTitle}>
                  <div className="p-4 bg-accent-soft/40 border border-accent/30 rounded-xl mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-ink-soft">{s.activeLabel}</div>
                      <div className="text-2xl font-bold text-accent">
                        {currentYogini.name || currentYogini.yogini || s.defaultYogini}
                      </div>
                      <div className="text-xs text-ink-muted mt-0.5">
                        {s.lordLabel} {currentYogini.ruling_planet || currentYogini.lord || currentYogini.planet || "-"}
                      </div>
                    </div>
                    {currentYogini.end_date && (
                      <div className="text-right">
                        <div className="text-xs text-ink-soft">{s.endDateLabel}</div>
                        <div className="text-sm font-mono-brand font-bold text-ink">
                          {currentYogini.end_date}
                        </div>
                      </div>
                    )}
                  </div>
                </ResultSection>
              )}

              {Array.isArray(cycleList) && cycleList.length > 0 && (
                <ResultSection title={s.tableTitle}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                        <tr>
                          <th className="py-2.5 px-3">{s.colYogini}</th>
                          <th className="py-2.5 px-3">{s.colLord}</th>
                          <th className="py-2.5 px-3">{s.colDuration}</th>
                          <th className="py-2.5 px-3">{s.colDates}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {cycleList.map((y: any, idx: number) => (
                          <tr key={idx} className="hover:bg-surface-alt/40 transition">
                            <td className="py-2.5 px-3 font-bold text-ink">
                              {y.name || y.yogini}
                            </td>
                            <td className="py-2.5 px-3">{y.ruling_planet || y.lord || y.planet}</td>
                            <td className="py-2.5 px-3 font-semibold">
                              {Number(y.actual_duration_years ?? y.full_duration_years ?? y.duration_years ?? y.years ?? 0).toFixed(2)} {s.years}
                            </td>
                            <td className="py-2.5 px-3 font-mono-brand">
                              {y.start_date || y.from || "-"} {s.to} {y.end_date || y.to || "-"}
                            </td>
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
