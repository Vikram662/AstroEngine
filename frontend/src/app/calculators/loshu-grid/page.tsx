"use client";

import React, { useState } from "react";
import axios from "axios";
import { CalculatorPageShell } from "@/components/calculators/CalculatorPageShell";
import { ResultSection, ResultRow, ResultBadge, SubmitButton, ErrorNote } from "@/components/calculators/ResultRows";
import { Calendar, Loader2 } from "lucide-react";

export default function LoshuGridPage() {
  const [dob, setDob] = useState("1995-10-05");
  const [lang, setLang] = useState<"hi" | "en">("hi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

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
      const res = await axios.post("/api/demo/proxy", {
        endpoint: "/api/v1/numerology/loshu-grid",
        payload,
        method: "POST",
      });

      if (res.data?.data) {
        setData(res.data.data);
      } else {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "लो शू ग्रिड गणना विफल रही।");
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

  const PLANE_LABELS: Record<string, string> = {
    mental_plane_4_9_2: "मानसिक तल (4-9-2)",
    emotional_plane_3_5_7: "भावनात्मक तल (3-5-7)",
    practical_plane_8_1_6: "व्यावहारिक तल (8-1-6)",
    thought_plane_4_3_8: "विचार तल (4-3-8)",
    will_plane_9_5_1: "इच्छाशक्ति तल (9-5-1)",
    action_plane_2_7_6: "कर्म तल (2-7-6)",
  };
  const planes = planesObj && !Array.isArray(planesObj)
    ? Object.entries(planesObj).map(([key, isComplete]) => ({
        name: PLANE_LABELS[key] || key,
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

  return (
    <CalculatorPageShell
      slug="loshu-grid"
      category="numerology"
      title="3x3 Lo Shu Magic Grid"
      hindiTitle="लो शू ग्रिड विश्लेषण"
      description="मानसिक, भावनात्मक, व्यावहारिक एवं इच्छा शक्ति के 8 योग प्लेन।"
      icon="🧮"
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

            <div>
              <label htmlFor="grid_dob" className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-accent" />
                <span>जन्म तिथि (Date of Birth)</span>
              </label>
              <input
                id="grid_dob"
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
              />
            </div>

            <SubmitButton loading={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> लो शू ग्रिड तैयार हो रहा है...
                </>
              ) : (
                "3x3 लो शू ग्रिड बनाएं"
              )}
            </SubmitButton>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {error && <ErrorNote message={error} />}

          {!data && !loading && !error && (
            <div className="bg-card rounded-2xl border border-line p-10 text-center text-ink-muted">
              <div className="text-4xl mb-3">🧮</div>
              <p className="text-sm">जन्मतिथि दर्ज करें और चीनी 3x3 जादुई लो-शू वर्ग के 8 प्लेन्स (मानसिक, इच्छा, कर्म) का फल देखें।</p>
            </div>
          )}

          {loading && (
            <div className="bg-card rounded-2xl border border-line p-12 text-center text-ink-soft flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
              <p className="text-sm">जन्मतिथि के अंकों का 3x3 मैट्रिक्स में रूपांतरण जारी है...</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              <ResultSection title="3x3 लो शू मैजिक ग्रिड">
                <div className="w-64 mx-auto grid grid-cols-3 gap-2 p-3 bg-surface-alt rounded-2xl border border-line">
                  {GRID_LAYOUT.map((row, rIdx) =>
                    row.map((num, cIdx) => {
                      const displayVal = getCellDigits(num, rIdx, cIdx);
                      const hasVal = displayVal !== "-";
                      return (
                        <div
                          key={num}
                          className={`aspect-square flex flex-col items-center justify-center rounded-xl border font-bold text-sm transition ${
                            hasVal
                              ? "bg-accent/10 border-accent/40 text-accent font-mono text-base"
                              : "bg-surface border-line/60 text-ink-muted/40 font-mono"
                          }`}
                        >
                          <span className="text-[10px] text-ink-muted/60">{num}</span>
                          <span>{displayVal}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </ResultSection>

              {missingNumbers.length > 0 && (
                <ResultSection title="अनुपस्थित अंक (Missing Numbers)">
                  <ResultRow label="ग्रिड में गायब अंक" value={missingNumbers.join(", ")} accent />
                </ResultSection>
              )}

              {Array.isArray(planes) && planes.length > 0 && (
                <ResultSection title="6 योग प्लेन्स का विश्लेषण (Planes of Lo Shu)">
                  <div className="divide-y divide-line/60">
                    {planes.map((p: any, idx: number) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-ink">{p.name || p.plane}</div>
                          {p.numbers && (
                            <div className="text-[11px] text-ink-muted font-mono">अंक: {p.numbers}</div>
                          )}
                        </div>
                        <ResultBadge tone={p.is_complete || p.status === "complete" ? "good" : "neutral"}>
                          {p.is_complete || p.status === "complete" ? "पूर्ण (सक्रिय योग)" : "अपूर्ण"}
                        </ResultBadge>
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
