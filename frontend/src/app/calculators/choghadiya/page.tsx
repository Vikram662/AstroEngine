"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

export default function ChoghadiyaPage() {
  const [form, setForm] = useState<BirthDataValue>({
    ...DEFAULT_BIRTH_DATA,
    dob: new Date().toISOString().split("T")[0],
    tob: "06:00",
  });
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
        endpoint: "/api/v1/panchang/choghadiya",
        payload,
        method: "POST",
      });

      if (res.data?.data) {
        setData(res.data.data);
      } else {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "चौघड़िया गणना विफल रही।");
    } finally {
      setLoading(false);
    }
  };

  const dayChoghadiya = data?.day || data?.day_choghadiya || [];
  const nightChoghadiya = data?.night || data?.night_choghadiya || [];

  const getTone = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("amrit") || t.includes("अमृत") || t.includes("shubh") || t.includes("शुभ") || t.includes("labh") || t.includes("लाभ")) {
      return "good";
    }
    if (t.includes("char") || t.includes("chal") || t.includes("चर") || t.includes("चल")) {
      return "neutral";
    }
    return "bad";
  };

  return (
    <CalculatorPageShell
      slug="choghadiya"
      category="panchang"
      title="Day & Night Choghadiya"
      hindiTitle="दिन एवं रात्रि चौघड़िया"
      description="शुभ, अमृत, लाभ, चर, रोग, काल एवं उद्वेग के 16 दैनिक समय खंड।"
      icon="⏱️"
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

            <BirthDataFields
              value={form}
              onChange={setForm}
              requireName={false}
              requireGender={false}
              dateLabel="तारीख (Select Date)"
            />

            <SubmitButton loading={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> चौघड़िया समय निकाला जा रहा है...
                </>
              ) : (
                "चौघड़िया मुहूर्त देखें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {error && <ErrorNote message={error} />}

          {!data && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">⏱️</div>
              <p className="text-sm">तिथि व शहर चुनें और दिन व रात के 16 चौघड़िया मुहूर्त (शुभ, लाभ, अमृत आदि) देखें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">दिनमान एवं रात्रिमान के 8-8 समान खंडों की गणना जारी है...</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              {Array.isArray(dayChoghadiya) && dayChoghadiya.length > 0 && (
                <ResultSection title="दिन का चौघड़िया (Day Choghadiya)">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                        <tr>
                          <th className="py-2 px-3">मुहूर्त</th>
                          <th className="py-2 px-3">समय (Time)</th>
                          <th className="py-2 px-3">प्रकृति</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {dayChoghadiya.map((c: any, idx: number) => {
                          const name = c.choghadiya || c.name;
                          return (
                            <tr key={idx} className="hover:bg-surface-alt/40 transition">
                              <td className="py-2.5 px-3 font-bold text-ink">{name}</td>
                              <td className="py-2.5 px-3 font-mono">{c.start_time || c.start || c.from} - {c.end_time || c.end || c.to}</td>
                              <td className="py-2.5 px-3">
                                <ResultBadge tone={getTone(name)}>{c.nature || c.type || name}</ResultBadge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </ResultSection>
              )}

              {Array.isArray(nightChoghadiya) && nightChoghadiya.length > 0 && (
                <ResultSection title="रात्रि का चौघड़िया (Night Choghadiya)">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase bg-surface-alt/80 text-ink-soft">
                        <tr>
                          <th className="py-2 px-3">मुहूर्त</th>
                          <th className="py-2 px-3">समय (Time)</th>
                          <th className="py-2 px-3">प्रकृति</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60">
                        {nightChoghadiya.map((c: any, idx: number) => {
                          const name = c.choghadiya || c.name;
                          return (
                            <tr key={idx} className="hover:bg-surface-alt/40 transition">
                              <td className="py-2.5 px-3 font-bold text-ink">{name}</td>
                              <td className="py-2.5 px-3 font-mono">{c.start_time || c.start || c.from} - {c.end_time || c.end || c.to}</td>
                              <td className="py-2.5 px-3">
                                <ResultBadge tone={getTone(name)}>{c.nature || c.type || name}</ResultBadge>
                              </td>
                            </tr>
                          );
                        })}
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
