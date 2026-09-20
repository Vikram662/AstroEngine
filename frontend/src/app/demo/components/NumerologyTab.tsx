"use client";

import React from "react";

interface NumerologyTabProps {
  numerology: any;
  profile: any;
  loshuGrid: any;
  missingNumbersData: any;
  favorableData: any;
  numerologyForecastData: any;
  pinnaclesData: any;
  nameAnalysisData: any;
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
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mulank (Birth / Psychic)</span>
          <div className="text-3xl font-black text-indigo-600 font-mono mt-1">
            {typeof numerology?.mulank === "object" ? numerology.mulank.number : numerology?.mulank || "5"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {typeof numerology?.mulank === "object" && numerology.mulank.ruler
              ? `Ruled by ${numerology.mulank.ruler}. ${numerology.mulank.traits || "Adaptable, witty, communicator."}`
              : "Ruled by Mercury (बुध). Adaptable, witty, communicator."}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bhagyank (Destiny Number)</span>
          <div className="text-3xl font-black text-purple-600 font-mono mt-1">
            {typeof numerology?.bhagyank === "object" ? numerology.bhagyank.number : numerology?.bhagyank || "8"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {typeof numerology?.bhagyank === "object" && numerology.bhagyank.ruler
              ? `Ruled by ${numerology.bhagyank.ruler}. ${numerology.bhagyank.traits || "Resilient, disciplined leader."}`
              : "Ruled by Saturn (शनि). Resilient, disciplined leader."}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Namank (Chaldean Name)</span>
          <div className="text-3xl font-black text-emerald-600 font-mono mt-1">
            {typeof numerology?.namank === "object" ? numerology.namank.number : numerology?.namank || "1"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {typeof numerology?.namank === "object" && numerology.namank.ruler
              ? `Ruled by ${numerology.namank.ruler}. Ambition, pioneer spirit.`
              : "Ruled by Sun (सूर्य). Ambition, pioneer spirit."}
          </div>
        </div>
      </div>

      {/* Lo Shu 3x3 Magic Grid & Elemental Planes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3x3 Grid */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">3x3 Lo Shu Magic Grid (लो शू चक्र)</h3>
              <p className="text-xs text-slate-500">Vedic Lo Shu grid mapping active date of birth vibrations</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700">Module 10</span>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-900 p-4 rounded-2xl max-w-[320px] mx-auto w-full">
            {["4", "9", "2", "3", "5", "7", "8", "1", "6"].map((num) => {
              const present = profile.dob.replace(/-/g, "").includes(num);
              return (
                <div
                  key={num}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center font-mono font-black text-xl transition ${
                    present
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                      : "bg-slate-800/80 text-slate-600 border border-slate-700/50"
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

          <div className="text-[11px] text-slate-500 text-center">
            Row 1: Mental • Row 2: Emotional • Row 3: Practical
          </div>
        </div>

        {/* Lo Shu Planes Analysis */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Elemental Planes &amp; Arrows (प्लेन विश्लेषण)</h3>
              <p className="text-xs text-slate-500">Horizontal, Vertical &amp; Diagonal harmony planes</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700">8 Planes</span>
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
                  className={`p-3 rounded-xl border ${
                    isActive ? "bg-emerald-50/60 border-emerald-200" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{pl.name}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {isActive ? "Active (पूर्ण)" : "Incomplete"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">{pl.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Missing Numbers & Practical Balancing Remedies */}
      {missingNumbersData && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Missing Numbers &amp; Vedic Remedial Balancing (अंक दोष निवारण)
              </h3>
              <p className="text-xs text-slate-500">Balancing cosmic vibrations for absent Lo Shu numbers</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-rose-50 text-rose-700">Endpoint 80</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(Array.isArray(missingNumbersData?.remedies) ? missingNumbersData.remedies : []).map(
              (rem: string, idx: number) => {
                const num = missingNumbersData?.missing_numbers?.[idx];
                return (
                  <div key={idx} className="p-3.5 rounded-xl bg-rose-50/40 border border-rose-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-rose-900">Missing Number {num ?? idx + 1}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-200/80 text-rose-900">Deficiency</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-snug">{rem}</p>
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
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Favorable Cosmic Elements (शुभ तत्व व अंक)</h3>
                <p className="text-xs text-slate-500">Lucky dates, days, colors and harmonizing frequencies</p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700">Endpoint 85</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Lucky Dates</span>
                <div className="font-bold text-slate-900 text-xs mt-1">
                  {(favorableData.lucky_dates || []).join(", ") || "5, 14, 23"}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Favorable Days</span>
                <div className="font-bold text-slate-900 text-xs mt-1">
                  {(favorableData.favorable_days || []).join(", ") || "Wednesday, Friday"}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Favorable Colors</span>
                <div className="font-bold text-slate-900 text-xs mt-1">
                  {(favorableData.favorable_colors || []).join(", ") || "Green, Emerald"}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Neutral Numbers</span>
                <div className="font-bold text-slate-900 text-xs mt-1">
                  {(favorableData.neutral_numbers || []).join(", ") || "1, 3, 9"}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Numbers to Avoid</span>
                <div className="font-bold text-rose-600 text-xs mt-1">
                  {(favorableData.avoid_numbers || []).join(", ") || "8"}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Psychic Number</span>
                <div className="font-bold text-indigo-600 text-xs mt-1">
                  {favorableData.psychic_number || 5}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Personal Year Forecast */}
        {numerologyForecastData && (
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Personal Year Cycle (व्यक्तिगत वर्ष)</h3>
                  <p className="text-xs text-slate-500">Yearly cyclic resonance for {numerologyForecastData.target_year || 2026}</p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700">Endpoint 83</span>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 text-center my-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 block">Personal Year Vibration</span>
                <div className="text-4xl font-black text-indigo-700 font-mono">
                  Year {numerologyForecastData.personal_year || 1}
                </div>
                <p className="text-xs text-slate-700 font-medium leading-snug">
                  {numerologyForecastData.theme || "New beginnings, dynamic initiative, leadership and career breakthroughs."}
                </p>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 text-center">
              Calculated using universal 9-year epicycle transitions
            </div>
          </div>
        )}
      </div>

      {/* 4 Life Pinnacles & Challenges */}
      {pinnaclesData && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">4 Life Pinnacles &amp; Challenges (जीवन के 4 शिखर व चुनौतियाँ)</h3>
              <p className="text-xs text-slate-500">Age milestones, peak prosperity cycles, and life tests</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700">Endpoint 84</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(Array.isArray(pinnaclesData?.pinnacles) ? pinnaclesData.pinnacles : []).map((pin: any, idx: number) => {
              const chal = pinnaclesData?.challenges?.[idx];
              return (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Pinnacle {pin.pinnacle || idx + 1}</div>
                  <div className="text-xs font-semibold text-slate-600 font-mono">Age: {pin.age_span || "—"}</div>
                  <div className="text-xl font-black text-indigo-600 font-mono mt-1">Number {pin.number}</div>
                  {chal && (
                    <div className="text-[10px] text-rose-600 font-medium pt-1 border-t border-slate-200">
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Dual Compound Name Vibration (नामांक कम्पाउंड विश्लेषण)</h3>
              <p className="text-xs text-slate-500">Chaldean &amp; Pythagorean esoteric name vibration for "{nameAnalysisData.name || "Aditya Sharma"}"</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-purple-50 text-purple-700">Endpoint 81</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-950">Chaldean System</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-200 text-purple-900">Ancient Babylonian</span>
              </div>
              <div className="text-2xl font-black text-purple-800 font-mono">
                Compound: {nameAnalysisData?.chaldean?.compound_number || 23} › Single: {nameAnalysisData?.chaldean?.single_digit || 5}
              </div>
              <p className="text-[11px] text-slate-600">
                {nameAnalysisData.vibration || "Harmonious resonance with psychic and destiny numbers."}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-950">Pythagorean System</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-200 text-blue-900">Western Classical</span>
              </div>
              <div className="text-2xl font-black text-blue-800 font-mono">
                Compound: {nameAnalysisData?.pythagorean?.compound_number || 32} › Single: {nameAnalysisData?.pythagorean?.single_digit || 5}
              </div>
              <p className="text-[11px] text-slate-600">
                Expression vibration representing intellectual mastery and communication strength.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
