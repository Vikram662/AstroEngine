"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

export default function KpSystemClient({ locale }: { locale: Locale }) {
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
        axios.post("/api/demo/proxy", {
          endpoint: "/api/v1/kp/planets",
          payload,
          method: "POST",
        }),
        axios.post("/api/demo/proxy", {
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
      setError(err?.response?.data?.message || err?.message || "केपी पद्धति गणना विफल रही।");
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
      description="कृष्णमूर्ति पद्धति अनुसार ग्रहों एवं भाव कस्प के नक्षत्र, सब व सब-सब स्वामी।"
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
                  <Loader2 className="w-4 h-4 animate-spin" /> केपी सब-लॉर्ड गणना जारी...
                </>
              ) : (
                "केपी सारिणी निकालें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {error && <ErrorNote message={error} />}

          {!kpPlanets.length && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-sm">कृष्णमूर्ति पद्धति अनुसार 12 भाव कस्प और 9 ग्रहों के साइन, स्टार और सब-लॉर्ड का सूक्ष्म विभाजन देखें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">प्लैसिडस भाव संधि एवं 249 सब-डिवीजनों की गणना जारी है...</p>
            </div>
          )}

          {kpPlanets.length > 0 && (
            <div className="space-y-6">
              <ResultSection title="ग्रह केपी स्वामी (Planets Sub-Lords)">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                      <tr>
                        <th className="py-2 px-2.5">ग्रह</th>
                        <th className="py-2 px-2.5">राशि (Sign)</th>
                        <th className="py-2 px-2.5">साइन स्वामी</th>
                        <th className="py-2 px-2.5">स्टार स्वामी</th>
                        <th className="py-2 px-2.5 font-bold text-accent">सब लॉर्ड</th>
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
                <ResultSection title="12 भाव कस्प स्वामी (Placidus Cuspal Sub-Lords)">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                        <tr>
                          <th className="py-2 px-2.5">भाव (Cusp)</th>
                          <th className="py-2 px-2.5">अंश (Degree)</th>
                          <th className="py-2 px-2.5">साइन स्वामी</th>
                          <th className="py-2 px-2.5">स्टार स्वामी</th>
                          <th className="py-2 px-2.5 font-bold text-accent">सब लॉर्ड</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {kpCusps.map((c: any, idx: number) => (
                          <tr key={idx} className="hover:bg-surface-alt/40 transition">
                            <td className="py-2.5 px-2.5 font-bold text-ink">भाव {c.cusp || c.house || idx + 1}</td>
                            <td className="py-2.5 px-2.5 font-mono">{Number(c.degree_in_sign ?? c.degree ?? 0).toFixed(2)}°</td>
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
