"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

export default function PlanetaryPositionsPage() {
  const [form, setForm] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [lang, setLang] = useState<"hi" | "en">("hi");
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
      const res = await axios.post("/api/demo/proxy", {
        endpoint: "/api/v1/core/planets/positions",
        payload,
        method: "POST",
      });

      if (res.data?.data) {
        setData(res.data.data);
      } else {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "ग्रह स्थिति गणना विफल रही।");
    } finally {
      setLoading(false);
    }
  };

  const planets = data?.planets || [];
  const ayanamsa = data?.ayanamsa_degree ?? data?.ayanamsa_value ?? data?.ayanamsa;

  return (
    <CalculatorPageShell
      slug="planetary-positions"
      category="kundli"
      title="Planetary Degrees & Sphuta"
      hindiTitle="ग्रह स्पष्ट एवं वक्री स्थिति"
      description="9 वैदिक ग्रह + राहु-केतु के सटीक अंश, वक्री/मार्गी स्थिति एवं गति।"
      icon="🔭"
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
                  <Loader2 className="w-4 h-4 animate-spin" /> ग्रह स्थिति गणना जारी...
                </>
              ) : (
                "ग्रह स्पष्ट गणना करें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {error && <ErrorNote message={error} />}

          {!planets.length && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">🔭</div>
              <p className="text-sm">जन्म समय व स्थान दर्ज करें और स्विस एफेमेरिस आधारित ग्रह स्पष्ट तालिका देखें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">ग्रहों के निरयण स्फुट एवं अयनांश की गणना हो रही है...</p>
            </div>
          )}

          {planets.length > 0 && (
            <div className="space-y-6">
              <ResultSection title="ग्रह स्फुट तालिका (Ephemeris Planetary Degrees)">
                {ayanamsa && (
                  <div className="text-xs text-ink-soft mb-3 flex items-center justify-between pb-2 border-b border-line">
                    <span>लाहिड़ी अयनांश (Lahiri Ayanamsa)</span>
                    <span className="font-mono font-bold text-accent">{Number(ayanamsa).toFixed(4)}°</span>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                      <tr>
                        <th className="py-2.5 px-3">ग्रह</th>
                        <th className="py-2.5 px-3">राशि</th>
                        <th className="py-2.5 px-3">अंश (Degree)</th>
                        <th className="py-2.5 px-3">नक्षत्र</th>
                        <th className="py-2.5 px-3">गति/अवस्था</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {planets.map((p: any, idx: number) => {
                        const isRet = p.is_retrograde || p.speed < 0;
                        return (
                          <tr key={idx} className="hover:bg-surface-alt/40 transition">
                            <td className="py-2.5 px-3 font-bold text-ink">{p.name || p.planet}</td>
                            <td className="py-2.5 px-3">{p.sign?.name || p.rashi_name}</td>
                            <td className="py-2.5 px-3 font-mono font-semibold">
                              {Number(p.norm_degree ?? p.degree ?? 0).toFixed(2)}°
                            </td>
                            <td className="py-2.5 px-3">
                              {p.nakshatra?.name ? `${p.nakshatra.name} (प ${p.nakshatra.pada || 1})` : "-"}
                            </td>
                            <td className="py-2.5 px-3">
                              {isRet ? (
                                <ResultBadge tone="bad">वक्री (R)</ResultBadge>
                              ) : (
                                <ResultBadge tone="good">मार्गी (D)</ResultBadge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </ResultSection>
            </div>
          )}
        </div>
      </div>
    </CalculatorPageShell>
  );
}
