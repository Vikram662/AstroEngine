"use client";

import React from "react";
import type { ApiData } from "@/lib/apiTypes";

interface NumerologyTabProps {
  numerology: ApiData;
  profile: ApiData;
  loshuGrid: ApiData;
  missingNumbersData: ApiData;
  favorableData: ApiData;
  numerologyForecastData: ApiData;
  pinnaclesData: ApiData;
  nameAnalysisData: ApiData;
}

export const NumerologyTab: React.FC<NumerologyTabProps> = ({
  numerology,
  profile,
  loshuGrid,
  missingNumbersData,
  favorableData,
  numerologyForecastData,
  pinnaclesData,
  nameAnalysisData,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Core Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg border border-line shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Mulank (Birth / Psychic)</span>
          <div className="text-3xl font-semibold text-accent font-mono mt-1">
            {typeof numerology?.mulank === "object" ? numerology.mulank.number : numerology?.mulank || "5"}
          </div>
          <div className="text-xs text-ink-soft mt-1">
            {typeof numerology?.mulank === "object" && numerology.mulank.ruler
              ? `Ruled by ${numerology.mulank.ruler}. ${numerology.mulank.traits || "Adaptable, witty, communicator."}`
              : "Ruled by Mercury (बुध). Adaptable, witty, communicator."}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-line shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Bhagyank (Destiny Number)</span>
          <div className="text-3xl font-semibold text-accent font-mono mt-1">
            {typeof numerology?.bhagyank === "object" ? numerology.bhagyank.number : numerology?.bhagyank || "8"}
          </div>
          <div className="text-xs text-ink-soft mt-1">
            {typeof numerology?.bhagyank === "object" && numerology.bhagyank.ruler
              ? `Ruled by ${numerology.bhagyank.ruler}. ${numerology.bhagyank.traits || "Resilient, disciplined leader."}`
              : "Ruled by Saturn (शनि). Resilient, disciplined leader."}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-line shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Namank (Chaldean Name)</span>
          <div className="text-3xl font-semibold text-emerald-600 font-mono mt-1">
            {typeof numerology?.namank === "object" ? numerology.namank.number : numerology?.namank || "1"}
          </div>
          <div className="text-xs text-ink-soft mt-1">
            {typeof numerology?.namank === "object" && numerology.namank.ruler
              ? `Ruled by ${numerology.namank.ruler}. Ambition, pioneer spirit.`
              : "Ruled by Sun (सूर्य). Ambition, pioneer spirit."}
          </div>
        </div>
      </div>

      {/* Lo Shu 3x3 Magic Grid & Elemental Planes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3x3 Grid */}
        <div className="lg:col-span-6 bg-white p-6 rounded-lg border border-line shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-ink">3x3 Lo Shu Magic Grid (लो शू चक्र)</h3>
              <p className="text-xs text-ink-soft">Vedic Lo Shu grid mapping active date of birth vibrations</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-accent-soft text-accent-hover">Module 10</span>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-console p-4 rounded-lg max-w-[320px] mx-auto w-full">
            {["4", "9", "2", "3", "5", "7", "8", "1", "6"].map((num) => {
              const present = profile.dob.replace(/-/g, "").includes(num);
              return (
                <div
                  key={num}
                  className={`aspect-square rounded-md flex flex-col items-center justify-center font-mono font-semibold text-xl transition ${
                    present
                      ? "bg-accent text-white  shadow-indigo-500/30"
                      : "bg-console-line/80 text-ink-soft border border-console-line/50"
                  }`}
                >
                  <span>{num}</span>
                  <span className="text-[9px] font-sans font-normal opacity-80 mt-0.5">
                    {present ? "Active" : "Missing"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-ink-soft text-center">
            Row 1: Mental • Row 2: Emotional • Row 3: Practical
          </div>
        </div>

        {/* Lo Shu Planes Analysis */}
        <div className="lg:col-span-6 bg-white p-6 rounded-lg border border-line shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="font-bold text-sm text-ink">Elemental Planes &amp; Arrows (प्लेन विश्लेषण)</h3>
              <p className="text-xs text-ink-soft">Horizontal, Vertical &amp; Diagonal harmony planes</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-surface-alt text-ink">8 Planes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: "Mental Plane (4-9-2)", desc: "Intellect, sharp memory, analytical prowess", key: "mental_plane_4_9_2" },
              { name: "Emotional Plane (3-5-7)", desc: "Heart feelings, spirituality, intuition", key: "emotional_plane_3_5_7" },
              { name: "Practical Plane (8-1-6)", desc: "Material success, physical execution", key: "practical_plane_8_1_6" },
              { name: "Thought Plane (4-3-8)", desc: "Vision, planning, big ideas and foresight", key: "thought_plane_4_3_8" },
              { name: "Will Plane (9-5-1)", desc: "Determination, persistence, inner grit", key: "will_plane_9_5_1" },
              { name: "Action Plane (2-7-6)", desc: "Immediate execution and movement", key: "action_plane_2_7_6" },
            ].map((pl, idx) => {
              const isActive = loshuGrid?.planes ? loshuGrid.planes[pl.key] : false;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-md border ${
                    isActive ? "bg-emerald-50/60 border-emerald-200" : "bg-surface border-line"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">{pl.name}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isActive ? "bg-emerald-100 text-emerald-800" : "bg-line text-ink-soft"
                      }`}
                    >
                      {isActive ? "Active (पूर्ण)" : "Incomplete"}
                    </span>
                  </div>
                  <p className="text-[10px] text-ink-soft mt-1 leading-snug">{pl.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Missing Numbers & Practical Balancing Remedies */}
      {missingNumbersData && (
        <div className="bg-white p-6 rounded-lg border border-line shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="font-bold text-sm text-ink">
                Missing Numbers &amp; Vedic Remedial Balancing (अंक दोष निवारण)
              </h3>
              <p className="text-xs text-ink-soft">Balancing cosmic vibrations for absent Lo Shu numbers</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-rose-50 text-rose-700">Endpoint 80</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(Array.isArray(missingNumbersData?.remedies) ? missingNumbersData.remedies : []).map(
              (rem: string, idx: number) => {
                const num = missingNumbersData?.missing_numbers?.[idx];
                return (
                  <div key={idx} className="p-3.5 rounded-md bg-rose-50/40 border border-rose-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-rose-900">Missing Number {num ?? idx + 1}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-200/80 text-rose-900">Deficiency</span>
                    </div>
                    <p className="text-[11px] text-ink leading-snug">{rem}</p>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Favorable Elements & Annual Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Favorable Elements */}
        {favorableData && (
          <div className="lg:col-span-7 bg-white p-6 rounded-lg border border-line shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-bold text-sm text-ink">Favorable Cosmic Elements (शुभ तत्व व अंक)</h3>
                <p className="text-xs text-ink-soft">Lucky dates, days, colors and harmonizing frequencies</p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700">Endpoint 85</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-md bg-surface border border-line">
                <span className="text-[10px] uppercase font-bold text-ink-muted block">Lucky Dates</span>
                <div className="font-bold text-ink text-xs mt-1">
                  {(favorableData.lucky_dates || []).join(", ") || "5, 14, 23"}
                </div>
              </div>
              <div className="p-3 rounded-md bg-surface border border-line">
                <span className="text-[10px] uppercase font-bold text-ink-muted block">Favorable Days</span>
                <div className="font-bold text-ink text-xs mt-1">
                  {(favorableData.favorable_days || []).join(", ") || "Wednesday, Friday"}
                </div>
              </div>
              <div className="p-3 rounded-md bg-surface border border-line">
                <span className="text-[10px] uppercase font-bold text-ink-muted block">Favorable Colors</span>
                <div className="font-bold text-ink text-xs mt-1">
                  {(favorableData.favorable_colors || []).join(", ") || "Green, Emerald"}
                </div>
              </div>
              <div className="p-3 rounded-md bg-surface border border-line">
                <span className="text-[10px] uppercase font-bold text-ink-muted block">Neutral Numbers</span>
                <div className="font-bold text-ink text-xs mt-1">
                  {(favorableData.neutral_numbers || []).join(", ") || "1, 3, 9"}
                </div>
              </div>
              <div className="p-3 rounded-md bg-surface border border-line">
                <span className="text-[10px] uppercase font-bold text-ink-muted block">Numbers to Avoid</span>
                <div className="font-bold text-rose-600 text-xs mt-1">
                  {(favorableData.avoid_numbers || []).join(", ") || "8"}
                </div>
              </div>
              <div className="p-3 rounded-md bg-surface border border-line">
                <span className="text-[10px] uppercase font-bold text-ink-muted block">Psychic Number</span>
                <div className="font-bold text-accent text-xs mt-1">
                  {favorableData.psychic_number || 5}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Personal Year Forecast */}
        {numerologyForecastData && (
          <div className="lg:col-span-5 bg-white p-6 rounded-lg border border-line shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <h3 className="font-bold text-sm text-ink">Personal Year Cycle (व्यक्तिगत वर्ष)</h3>
                  <p className="text-xs text-ink-soft">Yearly cyclic resonance for {numerologyForecastData.target_year || 2026}</p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-accent-soft text-accent-hover">Endpoint 83</span>
              </div>

              <div className="p-5 rounded-lg bg-accent-soft border border-accent/20 text-center my-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent block">Personal Year Vibration</span>
                <div className="text-4xl font-semibold text-accent-hover font-mono">
                  Year {numerologyForecastData.personal_year || 1}
                </div>
                <p className="text-xs text-ink font-medium leading-snug">
                  {numerologyForecastData.theme || "New beginnings, dynamic initiative, leadership and career breakthroughs."}
                </p>
              </div>
            </div>

            <div className="text-[10px] text-ink-muted text-center">
              Calculated using universal 9-year epicycle transitions
            </div>
          </div>
        )}
      </div>

      {/* 4 Life Pinnacles & Challenges */}
      {pinnaclesData && (
        <div className="bg-white p-6 rounded-lg border border-line shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="font-bold text-sm text-ink">4 Life Pinnacles &amp; Challenges (जीवन के 4 शिखर व चुनौतियाँ)</h3>
              <p className="text-xs text-ink-soft">Age milestones, peak prosperity cycles, and life tests</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-surface-alt text-ink">Endpoint 84</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(Array.isArray(pinnaclesData?.pinnacles) ? pinnaclesData.pinnacles : []).map((pin: ApiData, idx: number) => {
              const chal = pinnaclesData?.challenges?.[idx];
              return (
                <div key={idx} className="p-4 rounded-md bg-surface border border-line text-center space-y-1.5">
                  <div className="text-[10px] font-bold uppercase text-ink-muted">Pinnacle {pin.pinnacle || idx + 1}</div>
                  <div className="text-xs font-semibold text-ink-soft font-mono">Age: {pin.age_span || "—"}</div>
                  <div className="text-xl font-semibold text-accent font-mono mt-1">Number {pin.number}</div>
                  {chal && (
                    <div className="text-[10px] text-rose-600 font-medium pt-1 border-t border-line">
                      Challenge #{chal.challenge}: <strong>{chal.number}</strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Compound Name Analysis */}
      {nameAnalysisData && (
        <div className="bg-white p-6 rounded-lg border border-line shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="font-bold text-sm text-ink">Dual Compound Name Vibration (नामांक कम्पाउंड विश्लेषण)</h3>
              <p className="text-xs text-ink-soft">Chaldean &amp; Pythagorean esoteric name vibration for &quot;{nameAnalysisData.name || "Aditya Sharma"}&quot;</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-accent-soft text-accent-hover">Endpoint 81</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-md bg-accent-soft/50 border border-accent/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink">Chaldean System</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent/20 text-ink">Ancient Babylonian</span>
              </div>
              <div className="text-2xl font-semibold text-accent-hover font-mono">
                Compound: {nameAnalysisData?.chaldean?.compound_number || 23} › Single: {nameAnalysisData?.chaldean?.single_digit || 5}
              </div>
              <p className="text-[11px] text-ink-soft">
                {nameAnalysisData.vibration || "Harmonious resonance with psychic and destiny numbers."}
              </p>
            </div>

            <div className="p-4 rounded-md bg-accent-soft/50 border border-accent/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink">Pythagorean System</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent/20 text-ink">Western Classical</span>
              </div>
              <div className="text-2xl font-semibold text-accent-hover font-mono">
                Compound: {nameAnalysisData?.pythagorean?.compound_number || 32} › Single: {nameAnalysisData?.pythagorean?.single_digit || 5}
              </div>
              <p className="text-[11px] text-ink-soft">
                Expression vibration representing intellectual mastery and communication strength.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
