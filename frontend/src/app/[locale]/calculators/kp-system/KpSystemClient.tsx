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
    error: "केपी पद्धति गणना विफल रही।",
    calculating: "केपी सब-लॉर्ड गणना जारी...",
    submit: "केपी सारिणी निकालें",
    emptyHint: "कृष्णमूर्ति पद्धति अनुसार 12 भाव कस्प और 9 ग्रहों के साइन, स्टार और सब-लॉर्ड का सूक्ष्म विभाजन देखें।",
    loadingHint: "प्लैसिडस भाव संधि एवं 249 सब-डिवीजनों की गणना जारी है...",
    planetsTitle: "ग्रह केपी स्वामी (Planets Sub-Lords)",
    cuspsTitle: "12 भाव कस्प स्वामी (Placidus Cuspal Sub-Lords)",
    colPlanet: "ग्रह",
    colSign: "राशि (Sign)",
    colSignLord: "साइन स्वामी",
    colStarLord: "स्टार स्वामी",
    colSubLord: "सब लॉर्ड",
    colCusp: "भाव (Cusp)",
    colDegree: "अंश (Degree)",
    cuspPrefix: "भाव",
  },
  en: {
    error: "KP system calculation failed.",
    calculating: "Calculating KP sub-lords...",
    submit: "Get KP Sub-Lord Table",
    emptyHint: "See the fine-grained sign, star, and sub-lord breakdown for all 12 house cusps and 9 planets per the Krishnamurti Paddhati.",
    loadingHint: "Calculating Placidus house cusps and all 249 sub-divisions...",
    planetsTitle: "Planet Sub-Lords",
    cuspsTitle: "12 House Cuspal Sub-Lords (Placidus)",
    colPlanet: "Planet",
    colSign: "Sign",
    colSignLord: "Sign Lord",
    colStarLord: "Star Lord",
    colSubLord: "Sub Lord",
    colCusp: "Cusp",
    colDegree: "Degree",
    cuspPrefix: "Cusp",
  },
} as const;

export default function KpSystemClient({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kpPlanets, setKpPlanets] = useState<any[]>([]);
  const [kpCusps, setKpCusps] = useState<any[]>([]);

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
      const [resPlanets, resCusps] = await Promise.all([
        axios.post("/api/proxy", {
          endpoint: "/api/v1/kp/planets",
          payload,
          method: "POST",
        }),
        axios.post("/api/proxy", {
          endpoint: "/api/v1/kp/cusps",
          payload,
          method: "POST",
        }),
      ]);

      const pList = resPlanets.data?.data?.planets || resPlanets.data?.planets || resPlanets.data?.data || [];
      const cList = resCusps.data?.data?.cusps || resCusps.data?.cusps || resCusps.data?.data || [];

      setKpPlanets(Array.isArray(pList) ? pList : []);
      setKpCusps(Array.isArray(cList) ? cList : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || s.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CalculatorPageShell
      slug="kp-system"
      category="kp"
      title="KP Sub-Lord Table"
      hindiTitle="केपी पद्धति (सब-लॉर्ड)"
      description={locale === "en" ? "Nakshatra, sub-lord, and sub-sub-lord for every planet and house cusp, per the KP system." : "कृष्णमूर्ति पद्धति अनुसार ग्रहों एवं भाव कस्प के नक्षत्र, सब व सब-सब स्वामी।"}
      icon="🎯"
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

          {!kpPlanets.length && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-sm">{s.emptyHint}</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">{s.loadingHint}</p>
            </div>
          )}

          {kpPlanets.length > 0 && (
            <div className="space-y-6">
              <ResultSection title={s.planetsTitle}>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                      <tr>
                        <th className="py-2 px-2.5">{s.colPlanet}</th>
                        <th className="py-2 px-2.5">{s.colSign}</th>
                        <th className="py-2 px-2.5">{s.colSignLord}</th>
                        <th className="py-2 px-2.5">{s.colStarLord}</th>
                        <th className="py-2 px-2.5 font-bold text-accent">{s.colSubLord}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {kpPlanets.map((p: any, idx: number) => (
                        <tr key={idx} className="hover:bg-surface-alt/40 transition">
                          <td className="py-2.5 px-2.5 font-bold text-ink">{p.planet_name || p.name || p.planet}</td>
                          <td className="py-2.5 px-2.5">{p.sign?.name || p.rashi_name}</td>
                          <td className="py-2.5 px-2.5">{p.sign_lord || p.rashi_lord}</td>
                          <td className="py-2.5 px-2.5">{p.star_lord || p.nakshatra_lord}</td>
                          <td className="py-2.5 px-2.5 font-bold text-accent">{p.sub_lord || p.sub}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ResultSection>

              {kpCusps.length > 0 && (
                <ResultSection title={s.cuspsTitle}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                        <tr>
                          <th className="py-2 px-2.5">{s.colCusp}</th>
                          <th className="py-2 px-2.5">{s.colDegree}</th>
                          <th className="py-2 px-2.5">{s.colSignLord}</th>
                          <th className="py-2 px-2.5">{s.colStarLord}</th>
                          <th className="py-2 px-2.5 font-bold text-accent">{s.colSubLord}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {kpCusps.map((c: any, idx: number) => (
                          <tr key={idx} className="hover:bg-surface-alt/40 transition">
                            <td className="py-2.5 px-2.5 font-bold text-ink">{s.cuspPrefix} {c.cusp || c.house || idx + 1}</td>
                            <td className="py-2.5 px-2.5 font-mono-brand">{Number(c.degree_in_sign ?? c.degree ?? 0).toFixed(2)}°</td>
                            <td className="py-2.5 px-2.5">{c.sign_lord || c.rashi_lord}</td>
                            <td className="py-2.5 px-2.5">{c.star_lord || c.nakshatra_lord}</td>
                            <td className="py-2.5 px-2.5 font-bold text-accent">{c.sub_lord || c.sub}</td>
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
