"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import type { Locale } from "@/lib/locale";
import { fetchParallelSettled } from "@/lib/calculatorApi";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Calendar, Loader2 } from "lucide-react";
import { ApiData, toApiError } from "@/lib/apiTypes";

const STRINGS = {
  hi: {
    error: "लो शू ग्रिड गणना विफल रही।",
    calculating: "लो शू ग्रिड तैयार हो रहा है...",
    submit: "3x3 लो शू ग्रिड बनाएं",
    emptyHint: "जन्मतिथि दर्ज करें और चीनी 3x3 जादुई लो-शू वर्ग के 8 प्लेन्स (मानसिक, इच्छा, कर्म) का फल देखें।",
    loadingHint: "जन्मतिथि के अंकों का 3x3 मैट्रिक्स में रूपांतरण जारी है...",
    gridTitle: "3x3 लो शू मैजिक ग्रिड",
    missingTitle: "अनुपस्थित अंक (Missing Numbers)",
    missingLabel: "ग्रिड में गायब अंक",
    planesTitle: "6 योग प्लेन्स का विश्लेषण (Planes of Lo Shu)",
    numbersPrefix: "अंक:",
    complete: "पूर्ण (सक्रिय योग)",
    incomplete: "अपूर्ण",
    planeLabels: {
      mental_plane_4_9_2: "मानसिक तल (4-9-2)",
      emotional_plane_3_5_7: "भावनात्मक तल (3-5-7)",
      practical_plane_8_1_6: "व्यावहारिक तल (8-1-6)",
      thought_plane_4_3_8: "विचार तल (4-3-8)",
      will_plane_9_5_1: "इच्छाशक्ति तल (9-5-1)",
      action_plane_2_7_6: "कर्म तल (2-7-6)",
    } as Record<string, string>,
  },
  en: {
    error: "Lo Shu Grid calculation failed.",
    calculating: "Building your Lo Shu Grid...",
    submit: "Build 3x3 Lo Shu Grid",
    emptyHint: "Enter a date of birth to see the reading across all 8 planes (mental, willpower, action) of the Chinese 3x3 magic Lo Shu square.",
    loadingHint: "Converting the digits of your birth date into a 3x3 matrix...",
    gridTitle: "3x3 Lo Shu Magic Grid",
    missingTitle: "Missing Numbers",
    missingLabel: "Numbers missing from the grid",
    planesTitle: "Analysis of the 6 Planes of Lo Shu",
    numbersPrefix: "Numbers:",
    complete: "Complete (Active Yoga)",
    incomplete: "Incomplete",
    planeLabels: {
      mental_plane_4_9_2: "Mental Plane (4-9-2)",
      emotional_plane_3_5_7: "Emotional Plane (3-5-7)",
      practical_plane_8_1_6: "Practical Plane (8-1-6)",
      thought_plane_4_3_8: "Thought Plane (4-3-8)",
      will_plane_9_5_1: "Willpower Plane (9-5-1)",
      action_plane_2_7_6: "Action Plane (2-7-6)",
    } as Record<string, string>,
  },
} as const;

export default function LoshuGridClient({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  const [dob, setDob] = useState("1995-10-05");
  const [lang, setLang] = useState<"hi" | "en">(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiData>(null);

  const [remediesData, setRemediesData] = useState<ApiData>(null);
  const [coreData, setCoreData] = useState<ApiData>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      dob,
      tob: "12:00",
      lat: 28.6139,
      lon: 77.209,
      tz: 5.5,
      lang,
    };

    try {
      const [resGrid, resRemedies, resCore] = await fetchParallelSettled([
        axios.post("/api/proxy", {
          endpoint: "/api/v1/numerology/loshu-grid",
          payload,
          method: "POST",
        }),
        axios.post("/api/proxy", {
          endpoint: "/api/v1/numerology/missing-numbers",
          payload,
          method: "POST",
        }),
        axios.post("/api/proxy", {
          endpoint: "/api/v1/numerology/core-numbers",
          payload,
          method: "POST",
        }),
      ]);

      if (!resGrid) throw new Error(s.error);

      setData(resGrid);
      if (resRemedies) setRemediesData(resRemedies);
      if (resCore) setCoreData(resCore);
    } catch (errCaught) { const err = toApiError(errCaught);
      setError(err?.response?.data?.message || err?.message || s.error);
    } finally {
      setLoading(false);
    }
  };

  const GRID_LAYOUT = [
    [4, 9, 2],
    [3, 5, 7],
    [8, 1, 6],
  ];
  const gridMatrix: number[][] | null = data?.grid_matrix || null;
  const legacyGrid = data?.grid || data?.loshu_grid || {};
  const planesObj = data?.planes;
  const missingNumbers: number[] = data?.missing_numbers || [];

  const planes = planesObj && !Array.isArray(planesObj)
    ? Object.entries(planesObj).map(([key, isComplete]) => ({
        name: s.planeLabels[key] || key,
        is_complete: Boolean(isComplete),
      }))
    : Array.isArray(planesObj)
    ? planesObj
    : [];

  const getCellDigits = (num: number, rIdx: number, cIdx: number) => {
    if (gridMatrix) {
      const val = gridMatrix[rIdx]?.[cIdx];
      if (!val) return "-";
      return String(num).repeat(val);
    }
    const val = legacyGrid[String(num)] ?? legacyGrid[num];
    if (val === undefined || val === null || val === 0) return "-";
    if (typeof val === "number") return String(num).repeat(val);
    return String(val);
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

      <div>
        <label htmlFor="grid_dob" className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-accent" />
          <span>{lang === "en" ? "Date of Birth" : "जन्म तिथि"}</span>
        </label>
        <input
          id="grid_dob"
          type="date"
          required
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-md border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
        />
      </div>

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

      {!data && !loading && !error && (
        <div className="bg-card rounded-lg border border-line p-12 text-center text-ink-muted">
          <div className="text-5xl mb-4">🧮</div>
          <h3 className="text-base font-bold text-ink mb-1">
            {lang === "en" ? "Ready to Build Your Lo Shu Grid" : "लो-शू चक्र निर्माण हेतु तैयार"}
          </h3>
          <p className="text-sm max-w-md mx-auto text-ink-soft">{s.emptyHint}</p>
        </div>
      )}

      {loading && (
        <div className="bg-card rounded-lg border border-line p-14 text-center text-ink-soft flex flex-col items-center justify-center">
          <Loader2 className="w-9 h-9 text-accent animate-spin mb-3" />
          <p className="text-sm font-semibold text-ink">{s.loadingHint}</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
              {/* Core Driver & Conductor Banner */}
              {coreData && (
                <div className="grid grid-cols-2 gap-3 p-1">
                  <div className="p-3.5 bg-card border border-line rounded-md text-center">
                    <span className="text-[11px] uppercase font-bold text-ink-muted block">
                      {lang === "en" ? "Driver (Mulank)" : "मूलांक (Driver)"}
                    </span>
                    <span className="text-3xl font-extrabold text-accent block my-1">
                      {coreData.mulank?.number}
                    </span>
                    <span className="text-xs text-ink-soft">
                      {coreData.mulank?.ruler} ({coreData.mulank?.traits?.split(",")[0]})
                    </span>
                  </div>
                  <div className="p-3.5 bg-card border border-line rounded-md text-center">
                    <span className="text-[11px] uppercase font-bold text-ink-muted block">
                      {lang === "en" ? "Conductor (Bhagyank)" : "भाग्यांक (Conductor)"}
                    </span>
                    <span className="text-3xl font-extrabold text-accent block my-1">
                      {coreData.bhagyank?.number}
                    </span>
                    <span className="text-xs text-ink-soft">
                      {coreData.bhagyank?.ruler} ({coreData.bhagyank?.traits?.split(",")[0]})
                    </span>
                  </div>
                </div>
              )}

              {/* 3x3 Magic Grid Visual */}
              <ResultSection title={s.gridTitle}>
                <div className="w-72 mx-auto grid grid-cols-3 gap-2.5 p-4 bg-surface-alt/50 rounded-lg border border-line">
                  {GRID_LAYOUT.map((row, rIdx) =>
                    row.map((num, cIdx) => {
                      const displayVal = getCellDigits(num, rIdx, cIdx);
                      const hasVal = displayVal !== "-";
                      return (
                        <div
                          key={num}
                          className={`aspect-square flex flex-col items-center justify-center rounded-md border font-bold transition ${
                            hasVal
                              ? "bg-accent text-white border-accent shadow-xs text-lg font-mono"
                              : "bg-card border-line/70 text-ink-muted/30 text-sm font-mono"
                          }`}
                        >
                          <span className={`text-[10px] ${hasVal ? "text-white/80" : "text-ink-muted/50"}`}>{num}</span>
                          <span>{displayVal}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </ResultSection>

              {/* Missing Numbers & Practical Remedies */}
              {missingNumbers.length > 0 && (
                <ResultSection title={s.missingTitle}>
                  <ResultRow
                    label={s.missingLabel}
                    value={
                      <div className="flex flex-wrap gap-1.5">
                        {missingNumbers.map((num) => (
                          <ResultBadge key={num} tone="bad">{num}</ResultBadge>
                        ))}
                      </div>
                    }
                    accent
                  />
                  {remediesData?.remedies && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-line/60">
                      <span className="text-xs font-bold text-ink block">
                        {lang === "en" ? "Balancing Remedies for Missing Numbers" : "अनुपस्थित अंकों के निवारक उपाय"}
                      </span>
                      {missingNumbers.map((num, idx) => (
                        <div key={num} className="p-2.5 rounded-lg bg-surface-alt/40 border border-line text-xs">
                          <span className="font-bold text-accent">अंक {num}: </span>
                          <span className="text-ink-soft">{remediesData.remedies[idx] || "संतुलन हेतु संबंधित ग्रह मंत्र का जप करें।"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </ResultSection>
              )}

              {/* 6 Planes of Life */}
              {Array.isArray(planes) && planes.length > 0 && (
                <ResultSection title={s.planesTitle}>
                  <div className="divide-y divide-line/60">
                    {planes.map((p: ApiData, idx: number) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-ink">{p.name || p.plane}</div>
                          {p.numbers && (
                            <div className="text-[11px] text-ink-muted font-mono">{s.numbersPrefix} {p.numbers}</div>
                          )}
                        </div>
                        <ResultBadge tone={p.is_complete || p.status === "complete" ? "good" : "neutral"}>
                          {p.is_complete || p.status === "complete" ? s.complete : s.incomplete}
                        </ResultBadge>
                      </div>
                    ))}
                  </div>
                </ResultSection>
              )}
            </div>
          )}
    </>
  );

  return (
    <CalculatorPageShell
      slug="loshu-grid"
      category="numerology"
      title="3x3 Lo Shu Magic Grid"
      hindiTitle="लो शू ग्रिड विश्लेषण"
      description={locale === "en" ? "The 8 Lo Shu planes of mental, emotional, practical, and willpower strength." : "मानसिक, भावनात्मक, व्यावहारिक एवं इच्छा शक्ति के 8 योग प्लेन।"}
      icon="🧮"
      locale={locale}
      form={formContent}
      results={resultsContent}
    />
  );
}
