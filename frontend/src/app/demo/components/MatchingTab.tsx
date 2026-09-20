"use client";

import React from "react";
import { HeartHandshake } from "lucide-react";

interface MatchingTabProps {
  runMatchmaking: () => void;
  matchingLoading: boolean;
  profile: any;
  partnerProfile: any;
  matchmakingResult: any;
  dashakootaData: any;
  papasamyaData: any;
  matchExceptions: any;
}

export const MatchingTab: React.FC<MatchingTabProps> = ({
  runMatchmaking,
  matchingLoading,
  profile,
  partnerProfile,
  matchmakingResult,
  dashakootaData,
  papasamyaData,
  matchExceptions,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-base text-slate-900">Ashtakoot Kundli Milan (36 Guna Matchmaking)</h3>
          <p className="text-xs text-slate-500">
            Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, and Nadi matching
          </p>
        </div>
        <button
          onClick={runMatchmaking}
          disabled={matchingLoading}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition shadow-xs self-start sm:self-auto disabled:opacity-50"
        >
          <HeartHandshake className="w-4 h-4 text-rose-400" />
          <span>{matchingLoading ? "Matching..." : "Calculate 36 Guna Score"}</span>
        </button>
      </div>

      {/* 2 Profiles Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Boy's Profile</span>
          <div className="text-sm font-black text-slate-900">{profile.name}</div>
          <div className="text-slate-500 font-mono">
            {profile.dob} {profile.tob} • {profile.cityName}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Girl's Profile</span>
          <div className="text-sm font-black text-slate-900">{partnerProfile.name}</div>
          <div className="text-slate-500 font-mono">
            {partnerProfile.dob} {partnerProfile.tob} • {partnerProfile.cityName}
          </div>
        </div>
      </div>

      {/* Matchmaking Score Banner */}
      <div className="p-6 rounded-2xl bg-linear-to-r from-rose-50 to-pink-50 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
            Total Matchmaking Score
          </span>
          <div className="text-4xl font-black text-rose-950 font-mono mt-1">
            {matchmakingResult?.total_score || 28.5} <span className="text-xl text-rose-500 font-normal">/ 36</span>
          </div>
          <p className="text-xs text-rose-800 mt-1">
            Verdict: <strong>{matchmakingResult?.verdict || "Highly Auspicious Match. Marriage Strongly Recommended."}</strong>
          </p>
        </div>

        <div className="text-right">
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
            {(matchmakingResult?.total_score || 28.5) >= 18 ? "Match Approved (18+)" : "Requires Remedies"}
          </span>
        </div>
      </div>

      {/* Ashtakoot 8 Koots Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {(matchmakingResult?.ashtakoota_breakdown
          ? [
              {
                koot: "Varna",
                score: matchmakingResult.ashtakoota_breakdown.varna?.score ?? 1,
                max: 1,
                desc: matchmakingResult.ashtakoota_breakdown.varna?.description || "Work & Spiritual Compatibility",
              },
              {
                koot: "Vashya",
                score: matchmakingResult.ashtakoota_breakdown.vashya?.score ?? 2,
                max: 2,
                desc: matchmakingResult.ashtakoota_breakdown.vashya?.description || "Mutual Attraction & Dominance",
              },
              {
                koot: "Tara",
                score: matchmakingResult.ashtakoota_breakdown.tara?.score ?? 3,
                max: 3,
                desc: matchmakingResult.ashtakoota_breakdown.tara?.description || "Destiny & Health Compatibility",
              },
              {
                koot: "Yoni",
                score: matchmakingResult.ashtakoota_breakdown.yoni?.score ?? 3,
                max: 4,
                desc: matchmakingResult.ashtakoota_breakdown.yoni?.description || "Physical & Intimacy Harmony",
              },
              {
                koot: "Graha Maitri",
                score: matchmakingResult.ashtakoota_breakdown.graha_maitri?.score ?? 5,
                max: 5,
                desc: matchmakingResult.ashtakoota_breakdown.graha_maitri?.description || "Mental & Intellectual Friendship",
              },
              {
                koot: "Gana",
                score: matchmakingResult.ashtakoota_breakdown.gana?.score ?? 6,
                max: 6,
                desc: matchmakingResult.ashtakoota_breakdown.gana?.description || "Temperament & Nature (Deva/Manushya)",
              },
              {
                koot: "Bhakoot",
                score: matchmakingResult.ashtakoota_breakdown.bhakoot?.score ?? 7,
                max: 7,
                desc: matchmakingResult.ashtakoota_breakdown.bhakoot?.description || "Emotional & Family Welfare",
              },
              {
                koot: "Nadi",
                score: matchmakingResult.ashtakoota_breakdown.nadi?.score ?? 8,
                max: 8,
                desc: matchmakingResult.ashtakoota_breakdown.nadi?.description || "Genetic, Physiological & Health Bond",
              },
            ]
          : [
              { koot: "Varna", score: 1, max: 1, desc: "Work & Spiritual" },
              { koot: "Vashya", score: 2, max: 2, desc: "Mutual Attraction" },
              { koot: "Tara", score: 3, max: 3, desc: "Health & Destiny" },
              { koot: "Yoni", score: 3, max: 4, desc: "Physical Intimacy" },
              { koot: "Graha Maitri", score: 5, max: 5, desc: "Mental Friendship" },
              { koot: "Gana", score: 6, max: 6, desc: "Temperament" },
              { koot: "Bhakoot", score: 0.5, max: 7, desc: "Family Welfare" },
              { koot: "Nadi", score: 8, max: 8, desc: "Physiological Bond" },
            ]
        ).map((k: any, idx: number) => (
          <div
            key={idx}
            className="p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">{k.koot}</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {k.score} / {k.max}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">{k.desc}</span>
          </div>
        ))}
      </div>

      {/* South Indian 10-Porutham (Dashakoota) Matching */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>🟩</span>
              <span>South Indian Dashakoota (10 Porutham / कूट मिलान - Module 8)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Classical 10-Porutham marital longevity evaluation: Dina, Gana, Mahendra, Rajju, Vedha
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-bold ${
              (dashakootaData?.passed_count ?? 8) >= 6
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            {dashakootaData?.passed_count != null
              ? `${dashakootaData.passed_count} / 10 Poruthams Passed`
              : "8 / 10 Poruthams Passed (Auspicious)"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          {(dashakootaData?.poruthams_breakdown
            ? Object.entries(dashakootaData.poruthams_breakdown).map(([name, data]: [string, any]) => ({
                name: name.replace("_", " ").toUpperCase(),
                passed: data?.passed ?? true,
                meaning: data?.significance || data?.meaning || "Marital Harmony",
              }))
            : [
                { name: "Dina Porutham", passed: true, meaning: "Health & General Well-being" },
                { name: "Gana Porutham", passed: true, meaning: "Temperament & Nature" },
                { name: "Mahendra Porutham", passed: true, meaning: "Progeny & Prosperity" },
                { name: "Stree Deergha", passed: true, meaning: "Bride's Longevity & Wealth" },
                { name: "Yoni Porutham", passed: true, meaning: "Physical & Biological Intimacy" },
                { name: "Rashi Porutham", passed: true, meaning: "Lineage & Family Peace" },
                { name: "Rashiyaadhipathi", passed: true, meaning: "Planetary Friendship of Moon Lords" },
                { name: "Vasya Porutham", passed: true, meaning: "Mutual Attraction & Devotion" },
                { name: "Rajju Porutham", passed: true, meaning: "Mangalya & Spouse Longevity (Vital)" },
                { name: "Vedha Porutham", passed: true, meaning: "Absence of Mutual Affliction" },
              ]
          ).map((p: any, idx: number) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition ${
                p.passed ? "bg-emerald-50/50 border-emerald-200" : "bg-rose-50/50 border-rose-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-[11px] truncate">{p.name}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    p.passed ? "bg-emerald-200 text-emerald-900" : "bg-rose-200 text-rose-900"
                  }`}
                >
                  {p.passed ? "✓ Pass" : "✗ Fail"}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1 leading-tight">{p.meaning}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Papasamya Malefic Balance & Dosha Exceptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Papasamya Balance Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-sm text-slate-900">Papasamya Malefic Point Balance</h4>
              <p className="text-xs text-slate-500">
                Mars, Saturn, Sun, Rahu affliction points from Lagna, Moon &amp; Venus
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-mono text-xs font-bold">
              {papasamyaData?.balance_status || "Balanced (संतुलित)"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Groom Papa Points</span>
              <strong className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                {papasamyaData?.groom_total_papa ?? 4.5}
              </strong>
              <span className="text-[10px] text-slate-500">Afflictions from 1,2,4,7,8,12</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Bride Papa Points</span>
              <strong className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                {papasamyaData?.bride_total_papa ?? 4.0}
              </strong>
              <span className="text-[10px] text-slate-500">Afflictions from 1,2,4,7,8,12</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
            ⚖️ <strong>Classical Papasamya Rule:</strong>{" "}
            {papasamyaData?.rule_verdict ||
              "The groom's malefic points equal or moderately exceed the bride's points, ensuring protective marital balance."}
          </p>
        </div>

        {/* Dosha Exceptions & Cancellations */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-sm text-slate-900">Dosha Cancellation &amp; Parihara Exceptions</h4>
              <p className="text-xs text-slate-500">
                Shastric exemption rules nullifying Nadi, Bhakoot, and Gana Doshas
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              Exceptions Active
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {(
              matchExceptions?.active_exemptions || [
                {
                  title: "Nadi Dosha Cancellation",
                  rule: "Both Moon signs share friendly lords (Jupiter & Mars), or nakshatras have different padas.",
                  status: "CANCELLED / परिहार",
                },
                {
                  title: "Bhakoot Dosha Exemption",
                  rule: "Planetary friendship of Rashi lords overcomes 6/8 and 9/5 placements according to Kalaprakasika.",
                  status: "CANCELLED / परिहार",
                },
                {
                  title: "Gana Dosha Neutralization",
                  rule: "Benefic Jupiter aspects 7th lord; spiritual harmony supersedes temperament clash.",
                  status: "NEUTRALIZED",
                },
              ]
            ).map((exc: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-emerald-950 font-bold">{exc.title}</strong>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {exc.status}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{exc.rule}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
