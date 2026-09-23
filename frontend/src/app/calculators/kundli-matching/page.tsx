"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import { BirthDataFields, DEFAULT_BIRTH_DATA, BirthDataValue } from "@/components/calculators/BirthDataFields";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Loader2 } from "lucide-react";

const DEFAULT_GIRL_DATA: BirthDataValue = {
  name: "कन्या",
  gender: "female",
  dob: "1996-03-24",
  tob: "18:45",
  cityName: "मुंबई, भारत",
  lat: 19.076,
  lon: 72.8777,
  tz: 5.5,
};

export default function KundliMatchingPage() {
  const [boyForm, setBoyForm] = useState<BirthDataValue>({
    ...DEFAULT_BIRTH_DATA,
    name: "वर",
    gender: "male",
    dob: "1994-08-12",
    tob: "10:15",
  });
  const [girlForm, setGirlForm] = useState<BirthDataValue>(DEFAULT_GIRL_DATA);
  const [lang, setLang] = useState<"hi" | "en">("hi");
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
      const res = await axios.post("/api/demo/proxy", {
        endpoint: "/api/v1/dosha-matching/matchmaking/ashtakoot",
        payload,
        method: "POST",
      });

      if (res.data?.data) {
        setData(res.data.data);
      } else {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "कुंडली मिलान गणना विफल रही।");
    } finally {
      setLoading(false);
    }
  };

  const KOOT_LABELS: Record<string, string> = {
    varna: "वर्ण",
    vashya: "वश्य",
    tara: "तारा",
    yoni: "योनि",
    graha_maitri: "ग्रह मैत्री",
    gana: "गण",
    bhakoot: "भकूट",
    nadi: "नाड़ी",
  };

  const totalScore = data?.total_score ?? data?.total_obtained ?? data?.score ?? 0;
  const maxScore = data?.max_score ?? 36;
  const kootas = data?.kootas || {};
  const gunas = Array.isArray(data?.gunas)
    ? data.gunas
    : Object.entries(kootas).map(([key, val]: [string, any]) => ({
        koot: KOOT_LABELS[key] || key,
        obtained: val.points,
        max: val.max,
      }));

  return (
    <CalculatorPageShell
      slug="kundli-matching"
      category="matching"
      title="36 Guna Ashtakoot Milan"
      hindiTitle="अष्टकूट 36 गुण मिलान"
      description="वर्ण, वश्य, तारा, योनि, ग्रह मैत्री, गण, भकूट एवं नाड़ी दोष का 8/8 सटीक मिलान।"
      icon="💍"
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
                  <Loader2 className="w-4 h-4 animate-spin" /> 36 गुणों का मिलान जारी...
                </>
              ) : (
                "36 गुण मिलान करें"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-6 space-y-6">
          {error && <ErrorNote message={error} />}

          {!data && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">💍</div>
              <p className="text-sm">वर एवं कन्या का जन्म विवरण भरें और 8 कूटों में से प्राप्त अंकों का संपूर्ण विवरण देखें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">वर्ण, वश्य, तारा, योनि, मैत्री, गण, भकूट एवं नाड़ी का परीक्षण हो रहा है...</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              <ResultSection title="मिलान परिणाम (Guna Milan Summary)">
                <div
                  className={`p-6 rounded-xl border text-center mb-4 ${
                    totalScore >= 18
                      ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                      : "bg-rose-50 border-rose-200 text-rose-950"
                  }`}
                >
                  <div className="text-xs uppercase font-bold tracking-wider mb-1">
                    कुल प्राप्त अंक (Total Score)
                  </div>
                  <div className="text-4xl font-extrabold">
                    {totalScore} / {maxScore}
                  </div>
                  <div className="text-sm font-semibold mt-2">
                    {totalScore >= 24
                      ? "अति उत्तम मिलान (Excellent Match)"
                      : totalScore >= 18
                      ? "संतोषजनक एवं शुभ मिलान (Acceptable Match)"
                      : "कम अंक / विवाह अनुकूल नहीं (Below Average)"}
                  </div>
                </div>

                {kootas?.nadi?.has_dosha !== undefined && (
                  <ResultRow
                    label="नाड़ी दोष"
                    value={
                      kootas.nadi.has_dosha ? (
                        <ResultBadge tone="bad">उपस्थित</ResultBadge>
                      ) : (
                        <ResultBadge tone="good">दोष नहीं</ResultBadge>
                      )
                    }
                  />
                )}
                {kootas?.bhakoot?.has_dosha !== undefined && (
                  <ResultRow
                    label="भकूट दोष"
                    value={
                      kootas.bhakoot.has_dosha ? (
                        <ResultBadge tone="bad">उपस्थित</ResultBadge>
                      ) : (
                        <ResultBadge tone="good">दोष नहीं</ResultBadge>
                      )
                    }
                  />
                )}
              </ResultSection>

              {Array.isArray(gunas) && gunas.length > 0 && (
                <ResultSection title="8 कूटों का विस्तृत विभाजन (8 Koot Breakdown)">
                  <div className="divide-y divide-line/60">
                    {gunas.map((g: any, idx: number) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-ink">{g.koot || g.name}</div>
                          {g.description && <div className="text-[11px] text-ink-muted">{g.description}</div>}
                        </div>
                        <div className="font-bold font-mono text-sm text-accent">
                          {g.obtained ?? g.score} / {g.max ?? g.total}
                        </div>
                      </div>
                    ))}
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
