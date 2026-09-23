"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

export default function VimshottariDashaClient({ locale }: { locale: Locale }) {
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDasha, setCurrentDasha] = useState<any>(null);
  const [mahadashas, setMahadashas] = useState<any[]>([]);

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
      const [resCurrent, resMaha] = await Promise.all([
        axios.post("/api/demo/proxy", {
          endpoint: "/api/v1/dasha/vimshottari/current",
          payload,
          method: "POST",
        }).catch(() => null),
        axios.post("/api/demo/proxy", {
          endpoint: "/api/v1/dasha/vimshottari/mahadasha",
          payload,
          method: "POST",
        }),
      ]);

      const currentPayload = resCurrent?.data?.data || resCurrent?.data;
      if (currentPayload?.running_dasha) {
        setCurrentDasha(currentPayload.running_dasha);
      } else {
        setCurrentDasha(currentPayload || null);
      }

      const list = resMaha.data?.data?.mahadashas || resMaha.data?.mahadashas || resMaha.data?.data || [];
      const today = new Date();
      const withCurrentFlag = (Array.isArray(list) ? list : []).map((m: any) => {
        const start = m.start_date ? new Date(m.start_date) : null;
        const end = m.end_date ? new Date(m.end_date) : null;
        const isCurrent = start && end ? today >= start && today <= end : false;
        return { ...m, is_current: isCurrent };
      });
      setMahadashas(withCurrentFlag);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "विंशोत्तरी दशा गणना विफल रही।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CalculatorPageShell
      slug="vimshottari-dasha"
      category="dasha"
      title="120-Year Vimshottari Dasha"
      hindiTitle="120 वर्षीय विंशोत्तरी महादशा"
      description="महादशा, अंतर्दशा, प्रत्यंतर, सूक्ष्म एवं प्राण दशा का 5-स्तरीय सूक्ष्म चक्र।"
      icon="⏳"
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
                  <Loader2 className="w-4 h-4 animate-spin" /> दशा चक्र गणना जारी...
                </>
              ) : (
                "विंशोत्तरी दशा चक्र निकालें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {error && <ErrorNote message={error} />}

          {!mahadashas.length && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">⏳</div>
              <p className="text-sm">जन्म समय अनुसार 120 वर्षीय विंशोत्तरी महादशा व वर्तमान अंतर्दशा देखें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">जन्म नक्षत्र शेष दशा एवं 9 महादशाओं के आरंभ काल की गणना हो रही है...</p>
            </div>
          )}

          {currentDasha && (
            <ResultSection title="वर्तमान सक्रिय दशा (Current Operating Dasha)">
              <div className="p-4 bg-accent-soft/40 border border-accent/30 rounded-xl mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-ink-soft">वर्तमान महादशा स्वामी</div>
                  <div className="text-xl font-bold text-accent">
                    {currentDasha.mahadasha?.planet_name || currentDasha.mahadasha || "-"}
                  </div>
                </div>
                {currentDasha.antardasha && (
                  <div>
                    <div className="text-xs text-ink-soft">वर्तमान अंतर्दशा</div>
                    <div className="text-base font-bold text-ink">
                      {currentDasha.antardasha?.antardasha_name || currentDasha.antardasha}
                    </div>
                  </div>
                )}
                {currentDasha.pratyantar_dasha && (
                  <div>
                    <div className="text-xs text-ink-soft">प्रत्यंतर दशा</div>
                    <div className="text-sm font-semibold text-ink-soft">
                      {currentDasha.pratyantar_dasha?.pratyantar_name}
                    </div>
                  </div>
                )}
              </div>
              {currentDasha.mahadasha?.end_date && (
                <ResultRow label="महादशा अवधि समाप्ति" value={currentDasha.mahadasha.end_date} />
              )}
            </ResultSection>
          )}

          {mahadashas.length > 0 && (
            <ResultSection title="120 वर्षीय विंशोत्तरी महादशा चक्र">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                    <tr>
                      <th className="py-2.5 px-3">महादशा स्वामी</th>
                      <th className="py-2.5 px-3">अवधि (वर्ष)</th>
                      <th className="py-2.5 px-3">आरंभ तिथि</th>
                      <th className="py-2.5 px-3">समाप्ति तिथि</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {mahadashas.map((m: any, idx: number) => (
                      <tr key={idx} className="hover:bg-surface-alt/40 transition">
                        <td className="py-2.5 px-3 font-bold text-ink flex items-center gap-2">
                          <span>{m.planet_name || m.planet || m.lord || m.name}</span>
                          {m.is_current && <ResultBadge tone="accent">वर्तमान</ResultBadge>}
                        </td>
                        <td className="py-2.5 px-3 font-semibold">{m.duration_years || m.years || "-"} वर्ष</td>
                        <td className="py-2.5 px-3 font-mono">{m.start_date || m.from || "-"}</td>
                        <td className="py-2.5 px-3 font-mono">{m.end_date || m.to || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ResultSection>
          )}
        </div>
      </div>
    </CalculatorPageShell>
  );
}
