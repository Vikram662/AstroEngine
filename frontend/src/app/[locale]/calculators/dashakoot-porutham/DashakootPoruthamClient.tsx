"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

export default function DashakootPoruthamClient({ locale }: { locale: Locale }) {
  const [boyForm, setBoyForm] = useState<BirthDataValue>({
    ...DEFAULT_BIRTH_DATA,
    name: "वर",
    gender: "male",
    dob: "1994-08-12",
    tob: "10:15",
  });
  const [girlForm, setGirlForm] = useState<BirthDataValue>({
    ...DEFAULT_BIRTH_DATA,
    name: "कन्या",
    gender: "female",
    dob: "1996-03-24",
    tob: "18:45",
    cityName: "मुंबई, भारत",
    lat: 19.076,
    lon: 72.8777,
  });
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      groom_dob: boyForm.dob,
      groom_tob: boyForm.tob,
      groom_lat: boyForm.lat,
      groom_lon: boyForm.lon,
      groom_tz: boyForm.tz,
      bride_dob: girlForm.dob,
      bride_tob: girlForm.tob,
      bride_lat: girlForm.lat,
      bride_lon: girlForm.lon,
      bride_tz: girlForm.tz,
      lang,
    };

    try {
      const res = await axios.post("/api/proxy", {
        endpoint: "/api/v1/dosha-matching/matchmaking/dashakoot",
        payload,
        method: "POST",
      });

      if (res.data?.data) {
        setData(res.data.data);
      } else {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "दशकूट पोरुथम गणना विफल रही।");
    } finally {
      setLoading(false);
    }
  };

  const poruthams = data?.poruthams_breakdown || data?.poruthams || data?.kootas || [];
  const score = data?.passed_poruthams_count ?? data?.score ?? data?.favorable_count ?? 0;
  const total = data?.total_poruthams || 10;

  return (
    <CalculatorPageShell
      slug="dashakoot-porutham"
      category="matching"
      title="Dashakoota 10-Porutham"
      hindiTitle="दक्षिण भारतीय 10 पोरुथम"
      description="दीर्घम, रज्जू, वेधाई आदि दक्षिण भारतीय परंपरा अनुसार विवाह अनुकूलता।"
      icon="🪷"
      locale={locale}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 bg-card p-6 rounded-2xl border border-line h-fit">
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="p-4 rounded-xl bg-surface border border-line">
              <BirthDataFields
                value={boyForm}
                onChange={setBoyForm}
                personLabel="वर विवरण (Groom Details)"
                idPrefix="boy_"
              />
            </div>

            <div className="p-4 rounded-xl bg-surface border border-line">
              <BirthDataFields
                value={girlForm}
                onChange={setGirlForm}
                personLabel="कन्या विवरण (Bride Details)"
                idPrefix="girl_"
              />
            </div>

            <SubmitButton loading={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> 10 पोरुथम गणना जारी...
                </>
              ) : (
                "10 पोरुथम मिलान निकालें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-6 space-y-6">
          {error && <ErrorNote message={error} />}

          {!data && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">🪷</div>
              <p className="text-sm">दीनम, गणम, माहेन्द्रम, स्त्री दीर्घम, योनि, राशि, राशिअधिपति, वश्य, रज्जू एवं वेधाई 10 पोरुथम देखें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">दक्षिण भारतीय नक्षत्र सिद्धांतों अनुसार पोरुथम अनुकूलता की गणना हो रही है...</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              <ResultSection title="10 पोरुथम सारांश (Dashakoota Summary)">
                <div
                  className={`p-6 rounded-xl border text-center mb-4 ${
                    score >= 6
                      ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                      : "bg-amber-50 border-amber-200 text-amber-950"
                  }`}
                >
                  <div className="text-xs uppercase font-bold tracking-wider mb-1">
                    अनुकूल पोरुथम (Favorable Poruthams)
                  </div>
                  <div className="text-4xl font-extrabold">
                    {score} / {total}
                  </div>
                  <div className="text-sm font-semibold mt-2">
                    {data.verdict || (score >= 6 ? "विवाह हेतु उत्तम अनुकूलता (Good Compatibility)" : "मध्यम / रज्जू शुद्धि आवश्यक")}
                  </div>
                </div>

                {data.is_rajju_porutham_passed !== undefined && (
                  <ResultRow
                    label="रज्जू पोरुथम (अति महत्वपूर्ण)"
                    value={
                      data.is_rajju_porutham_passed ? (
                        <ResultBadge tone="good">अनुकूल (शुभ)</ResultBadge>
                      ) : (
                        <ResultBadge tone="bad">प्रतिकूल (दोष)</ResultBadge>
                      )
                    }
                    accent
                  />
                )}
              </ResultSection>

              {Array.isArray(poruthams) && poruthams.length > 0 && (
                <ResultSection title="प्रत्येक पोरुथम का फल">
                  <div className="divide-y divide-line/60">
                    {poruthams.map((p: any, idx: number) => {
                      const isGood = p.is_compatible ?? (p.status === "good" || p.favorable || p.is_match);
                      return (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-ink">{p.name || p.porutham}</div>
                            {(p.aspect || p.significance) && <div className="text-[11px] text-ink-muted">{p.aspect || p.significance}</div>}
                          </div>
                          <ResultBadge tone={isGood ? "good" : "bad"}>
                            {isGood ? "अनुकूल" : "प्रतिकूल"}
                          </ResultBadge>
                        </div>
                      );
                    })}
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
