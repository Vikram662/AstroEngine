"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

export default function YoginiDashaPage() {
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
      setError(err?.response?.data?.message || err?.message || "योगिनी दशा गणना विफल रही।");
    } finally {
      setLoading(false);
    }
  };

  const currentYogini = data?.current || data?.current_yogini;
  const cycleList = data?.cycles || data?.yoginis || data?.dashas || [];

  return (
    <CalculatorPageShell
      slug="yogini-dasha"
      category="dasha"
      title="36-Year Yogini Dasha"
      hindiTitle="36 वर्षीय योगिनी दशा"
      description="मंगला, पिंगला, धन्या, भ्रामरी, भद्रिका, उल्का, सिद्धा व संकटा का चक्र।"
      icon="☸️"
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
                  <Loader2 className="w-4 h-4 animate-spin" /> योगिनी दशा गणना जारी...
                </>
              ) : (
                "योगिनी दशा निकालें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {error && <ErrorNote message={error} />}

          {!data && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">☸️</div>
              <p className="text-sm">36 वर्षीय 8 योगिनी (मंगला से संकटा) दशा क्रम व वर्तमान दशा का फलादेश देखें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">8 योगिनी दशाओं के 36 वर्षीय चक्र की गणना हो रही है...</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              {currentYogini && (
                <ResultSection title="वर्तमान सक्रिय योगिनी दशा">
                  <div className="p-4 bg-accent-soft/40 border border-accent/30 rounded-xl mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-ink-soft">सक्रिय योगिनी</div>
                      <div className="text-2xl font-bold text-accent">
                        {currentYogini.name || currentYogini.yogini || "सिद्धा"}
                      </div>
                      <div className="text-xs text-ink-muted mt-0.5">
                        स्वामी: {currentYogini.lord || currentYogini.planet || "-"}
                      </div>
                    </div>
                    {currentYogini.end_date && (
                      <div className="text-right">
                        <div className="text-xs text-ink-soft">समाप्ति तिथि</div>
                        <div className="text-sm font-mono font-bold text-ink">
                          {currentYogini.end_date}
                        </div>
                      </div>
                    )}
                  </div>
                </ResultSection>
              )}

              {Array.isArray(cycleList) && cycleList.length > 0 && (
                <ResultSection title="36-वर्षीय योगिनी दशा तालिका">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                        <tr>
                          <th className="py-2.5 px-3">योगिनी</th>
                          <th className="py-2.5 px-3">स्वामी ग्रह</th>
                          <th className="py-2.5 px-3">अवधि</th>
                          <th className="py-2.5 px-3">आरंभ - समाप्ति</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {cycleList.map((y: any, idx: number) => (
                          <tr key={idx} className="hover:bg-surface-alt/40 transition">
                            <td className="py-2.5 px-3 font-bold text-ink">
                              {y.name || y.yogini}
                            </td>
                            <td className="py-2.5 px-3">{y.lord || y.planet}</td>
                            <td className="py-2.5 px-3 font-semibold">{y.duration_years || y.years || idx + 1} वर्ष</td>
                            <td className="py-2.5 px-3 font-mono">
                              {y.start_date || y.from || "-"} से {y.end_date || y.to || "-"}
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
