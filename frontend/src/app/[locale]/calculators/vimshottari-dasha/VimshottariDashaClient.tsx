"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { fetchParallelSettled } from "@/lib/calculatorApi";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";
import { ApiData, toApiError } from "@/lib/apiTypes";

const STRINGS = {
  hi: {
    error: "विंशोत्तरी दशा गणना विफल रही।",
    calculating: "दशा चक्र गणना जारी...",
    submit: "विंशोत्तरी दशा चक्र निकालें",
    emptyHint: "जन्म समय अनुसार 120 वर्षीय विंशोत्तरी महादशा व वर्तमान अंतर्दशा देखें।",
    loadingHint: "जन्म नक्षत्र शेष दशा एवं 9 महादशाओं के आरंभ काल की गणना हो रही है...",
    currentTitle: "वर्तमान सक्रिय दशा (Current Operating Dasha)",
    mahadashaLordLabel: "वर्तमान महादशा स्वामी",
    antardashaLabel: "वर्तमान अंतर्दशा",
    pratyantarLabel: "प्रत्यंतर दशा",
    mahadashaEndLabel: "महादशा अवधि समाप्ति",
    tableTitle: "120 वर्षीय विंशोत्तरी महादशा चक्र",
    colLord: "महादशा स्वामी",
    colDuration: "अवधि (वर्ष)",
    colStart: "आरंभ तिथि",
    colEnd: "समाप्ति तिथि",
    current: "वर्तमान",
    years: "वर्ष",
  },
  en: {
    error: "Vimshottari Dasha calculation failed.",
    calculating: "Calculating the dasha cycle...",
    submit: "Get Vimshottari Dasha Cycle",
    emptyHint: "See the 120-year Vimshottari Mahadasha and current Antardasha for your birth time.",
    loadingHint: "Calculating remaining dasha from your birth nakshatra and the start dates of all 9 Mahadashas...",
    currentTitle: "Current Operating Dasha",
    mahadashaLordLabel: "Current Mahadasha Lord",
    antardashaLabel: "Current Antardasha",
    pratyantarLabel: "Pratyantar Dasha",
    mahadashaEndLabel: "Mahadasha End Date",
    tableTitle: "120-Year Vimshottari Mahadasha Cycle",
    colLord: "Mahadasha Lord",
    colDuration: "Duration (yrs)",
    colStart: "Start Date",
    colEnd: "End Date",
    current: "Current",
    years: "yrs",
  },
} as const;

export default function VimshottariDashaClient({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDasha, setCurrentDasha] = useState<ApiData>(null);
  const [mahadashas, setMahadashas] = useState<ApiData[]>([]);
  const [yoginiData, setYoginiData] = useState<ApiData>(null);

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
      const [current, maha, yogini] = await fetchParallelSettled([
        axios.post("/api/proxy", {
          endpoint: "/api/v1/dasha/vimshottari/current",
          payload,
          method: "POST",
        }),
        axios.post("/api/proxy", {
          endpoint: "/api/v1/dasha/vimshottari/mahadasha",
          payload,
          method: "POST",
        }),
        axios.post("/api/proxy", {
          endpoint: "/api/v1/dasha/yogini/complete",
          payload,
          method: "POST",
        }),
      ]);

      if (current?.running_dasha) {
        setCurrentDasha(current.running_dasha);
      } else {
        setCurrentDasha(current || null);
      }

      if (yogini) {
        setYoginiData(yogini);
      }

      const list = maha?.mahadashas || maha || [];
      const today = new Date();
      const withCurrentFlag = (Array.isArray(list) ? list : []).map((m: ApiData) => {
        const start = m.start_date ? new Date(m.start_date) : null;
        const end = m.end_date ? new Date(m.end_date) : null;
        const isCurrent = start && end ? today >= start && today <= end : false;
        return { ...m, is_current: isCurrent };
      });
      setMahadashas(withCurrentFlag);
    } catch (errCaught) { const err = toApiError(errCaught);
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

      {!mahadashas.length && !loading && !error && (
        <div className="bg-card rounded-lg border border-line p-10 text-center text-ink-muted">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-sm">{s.emptyHint}</p>
        </div>
      )}

      {loading && (
        <div className="bg-card rounded-lg border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
          <p className="text-sm">{s.loadingHint}</p>
        </div>
      )}

      <div className="space-y-6">

      {currentDasha && (
            <ResultSection title={s.currentTitle}>
              <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg mb-3">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-line">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">वर्तमान सक्रिय दशा पदानुक्रम (Live Operating Chain)</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span> सक्रिय (Active)
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-card border border-line rounded-md">
                    <div className="text-[10px] font-bold uppercase text-ink-muted">{s.mahadashaLordLabel}</div>
                    <div className="text-lg font-extrabold text-accent mt-0.5">
                      {currentDasha.mahadasha?.planet_name || currentDasha.mahadasha || "-"}
                    </div>
                    {currentDasha.mahadasha?.end_date && (
                      <div className="text-[10px] text-ink-muted mt-1 font-mono">तक: {currentDasha.mahadasha.end_date}</div>
                    )}
                  </div>
                  <div className="p-3 bg-card border border-line rounded-md">
                    <div className="text-[10px] font-bold uppercase text-ink-muted">{s.antardashaLabel}</div>
                    <div className="text-lg font-extrabold text-ink mt-0.5">
                      {currentDasha.antardasha?.antardasha_name || currentDasha.antardasha || "-"}
                    </div>
                    {currentDasha.antardasha?.end_date && (
                      <div className="text-[10px] text-ink-muted mt-1 font-mono">तक: {currentDasha.antardasha.end_date}</div>
                    )}
                  </div>
                  <div className="p-3 bg-card border border-line rounded-md">
                    <div className="text-[10px] font-bold uppercase text-ink-muted">{s.pratyantarLabel}</div>
                    <div className="text-lg font-extrabold text-ink mt-0.5">
                      {currentDasha.pratyantar_dasha?.pratyantar_name || currentDasha.pratyantar_dasha || "-"}
                    </div>
                    {currentDasha.pratyantar_dasha?.end_date && (
                      <div className="text-[10px] text-ink-muted mt-1 font-mono">तक: {currentDasha.pratyantar_dasha.end_date}</div>
                    )}
                  </div>
                </div>
              </div>
            </ResultSection>
          )}

          {mahadashas.length > 0 && (
            <ResultSection title={s.tableTitle}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                    <tr>
                      <th className="py-2.5 px-3">{s.colLord}</th>
                      <th className="py-2.5 px-3">{s.colDuration}</th>
                      <th className="py-2.5 px-3">{s.colStart}</th>
                      <th className="py-2.5 px-3">{s.colEnd}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {mahadashas.map((m: ApiData, idx: number) => (
                      <tr key={idx} className={`hover:bg-surface-alt/40 transition ${m.is_current ? "bg-accent/5 font-semibold" : ""}`}>
                        <td className="py-2.5 px-3 font-bold text-ink flex items-center gap-2">
                          <span>{m.planet_name || m.planet || m.lord || m.name}</span>
                          {m.is_current && <ResultBadge tone="accent">{s.current}</ResultBadge>}
                        </td>
                        <td className="py-2.5 px-3 font-semibold">{m.duration_years || m.years || "-"} {s.years}</td>
                        <td className="py-2.5 px-3 font-mono-brand">{m.start_date || m.from || "-"}</td>
                        <td className="py-2.5 px-3 font-mono-brand">{m.end_date || m.to || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ResultSection>
          )}

          {/* Yogini Dasha Complete Cycle */}
          {yoginiData && yoginiData.cycles && (
            <ResultSection title={lang === "hi" ? "36 वर्षीय योगिनी दशा चक्र" : "36-Year Yogini Dasha Cycle"}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                    <tr>
                      <th className="py-2.5 px-3">योगिनी / Yogini</th>
                      <th className="py-2.5 px-3">स्वामी ग्रह / Lord</th>
                      <th className="py-2.5 px-3">अवधि / Years</th>
                      <th className="py-2.5 px-3">आरंभ / Start</th>
                      <th className="py-2.5 px-3">समाप्ति / End</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {(yoginiData.cycles || []).map((y: ApiData, idx: number) => (
                      <tr key={idx} className="hover:bg-surface-alt/40 transition">
                        <td className="py-2.5 px-3 font-bold text-ink">{y.yogini_name || y.name}</td>
                        <td className="py-2.5 px-3 font-medium text-ink-soft">{y.ruling_planet}</td>
                        <td className="py-2.5 px-3 font-semibold">{y.duration_years} वर्ष</td>
                        <td className="py-2.5 px-3 font-mono-brand">{y.start_date}</td>
                        <td className="py-2.5 px-3 font-mono-brand">{y.end_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ResultSection>
          )}
        </div>
    </>
  );

  return (
    <CalculatorPageShell
      slug="vimshottari-dasha"
      category="dasha"
      title="120-Year Vimshottari Dasha"
      hindiTitle="विंशोत्तरी एवं योगिनी महादशा (Vimshottari & Yogini Dasha)"
      description={locale === "en" ? "The 5-tier Vimshottari cycle (MD > AD > PD), 120-year timeline, and classical 36-year Yogini Dasha." : "120 वर्षीय विंशोत्तरी महादशा, वर्तमान सूक्ष्म प्रत्यंतर दशा स्तर एवं 36 वर्षीय योगिनी दशा का संपूर्ण विवरण।"}
      icon="⏳"
      locale={locale}
      form={formContent}
      results={resultsContent}
    />
  );
}
