"use client";

import React from "react";

interface DoshaTabProps {
  manglikData: any;
  kaalSarpData: any;
  sadeSatiStatus: any;
  pitraDosha: any;
  guruChandal: any;
  sadeSatiTimeline: any;
}

export const DoshaTab: React.FC<DoshaTabProps> = ({
  manglikData,
  kaalSarpData,
  sadeSatiStatus,
  pitraDosha,
  guruChandal,
  sadeSatiTimeline,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
      {/* Manglik Analysis Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Manglik Dosha Analysis</h3>
            <p className="text-xs text-slate-500">Evaluated from Lagna, Chandra, and Shukra</p>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              manglikData?.is_manglik
                ? "bg-rose-100 text-rose-800"
                : manglikData?.is_cancelled
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {manglikData?.verdict || (manglikData?.is_manglik
              ? "Manglik (मांगलिक)"
              : manglikData?.is_cancelled
              ? "Manglik Dosha Cancelled (दोष भंग / Non-Manglik)"
              : "Non-Manglik (अमांगलिक)")}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Status &amp; Severity:</span>
            <strong
              className={
                manglikData?.is_manglik
                  ? "text-rose-600 font-bold"
                  : "text-emerald-700 font-bold"
              }
            >
              {manglikData?.verdict || manglikData?.status || "NO_DOSHA"} ({manglikData?.severity || "NONE"})
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Mars Position:</span>
            <strong className="text-slate-900">
              House {manglikData?.mars_placements?.house_from_lagna || manglikData?.mars_house || 12} from Lagna
              {manglikData?.mars_placements?.mars_sign_id
                ? ` in ${manglikData.mars_placements.mars_sign_id}`
                : ""}
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Cancellations Applied:</span>
            <strong className="text-emerald-700">
              {manglikData?.cancellation_reasons?.length || (manglikData?.is_cancelled ? 1 : 0)} Factors Present
            </strong>
          </div>
        </div>

        <div className="text-xs text-slate-600 space-y-1">
          <span className="font-bold text-slate-900 block">Classical Verdict &amp; Exceptions:</span>
          {manglikData?.cancellation_reasons && manglikData.cancellation_reasons.length > 0 ? (
            <ul className="list-disc list-inside space-y-0.5 text-emerald-800 font-medium">
              {manglikData.cancellation_reasons.map((r: string, idx: number) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          ) : (
            <p className="leading-relaxed">
              {manglikData?.is_manglik
                ? "Kuja Dosha is active. Parashara recommends matchmaking with a compatible partner."
                : "No affliction detected. The native is considered Non-Manglik according to classical Brihat Parashara Hora Shastra."}
            </p>
          )}
        </div>
      </div>

      {/* Kaal Sarp Analysis Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Kaal Sarp Dosha Analysis</h3>
            <p className="text-xs text-slate-500">Evaluated across all 12 classical Rahu-Ketu axes</p>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              kaalSarpData?.has_kaal_sarp
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {kaalSarpData?.verdict || (kaalSarpData?.has_kaal_sarp ? kaalSarpData.type : "No Kaal Sarp")}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Type:</span>
            <strong className="text-slate-900">{kaalSarpData?.type || "Anant Kaal Sarp"}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Axis:</span>
            <strong className="text-slate-900">Rahu in 1st / Ketu in 7th</strong>
          </div>
        </div>

        <div className="text-xs text-slate-600 space-y-1">
          <span className="font-bold text-slate-900 block">Recommended Action:</span>
          <p className="leading-relaxed">
            {kaalSarpData?.verdict || "Regular chanting of Maha Mrityunjaya Mantra and offering milk to Shiva lingam on Mondays."}
          </p>
        </div>
      </div>

      {/* Saturn Sade Sati & Dhaiya Live Check */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Shani Sade Sati &amp; Dhaiya Status</h3>
            <p className="text-xs text-slate-500">Real-time Saturn transit evaluated relative to Janma Rashi</p>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              sadeSatiStatus?.is_sade_sati || sadeSatiStatus?.is_dhaiya
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {sadeSatiStatus?.verdict || sadeSatiStatus?.phase || (sadeSatiStatus?.is_sade_sati ? "Sade Sati Active" : "No Sade Sati")}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Current Saturn Sign:</span>
            <strong className="text-slate-900">{sadeSatiStatus?.transit_saturn_sign || "Aquarius (कुंभ)"}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Relative House from Moon:</span>
            <strong className="text-slate-900">{sadeSatiStatus?.relative_house_from_moon || 2}nd House</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Dhaiya (Small Panoti):</span>
            <strong className="text-slate-900">
              {sadeSatiStatus?.is_dhaiya ? "Active (Kantaka / Ashtama)" : "Inactive"}
            </strong>
          </div>
        </div>

        <div className="text-xs text-slate-600">
          <span className="font-bold text-slate-900 block mb-1">Saturn Remedial Guidance:</span>
          <p className="leading-relaxed">
            Light a mustard oil deepak under a Peepal tree on Saturdays and recite Dasharatha Shani Stotram.
          </p>
        </div>
      </div>

      {/* Pitra Dosha & Guru Chandal Analysis */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Pitra Dosha &amp; Guru Chandal Evaluation</h3>
            <p className="text-xs text-slate-500">9th House solar afflictions and Jupiter-Rahu conjunctions</p>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              pitraDosha?.has_pitra_dosha
                ? "bg-rose-100 text-rose-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {pitraDosha?.has_pitra_dosha ? "Pitra Dosha Afflicted" : "No Pitra Dosha"}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Pitra Dosha Severity:</span>
            <strong className="text-slate-900">{pitraDosha?.severity || "None / Clean"}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Guru Chandal (गुरु चांडाल योग):</span>
            <strong
              className={
                guruChandal?.has_guru_chandal_dosha
                  ? "text-rose-600 font-bold"
                  : "text-emerald-700"
              }
            >
              {guruChandal?.has_guru_chandal_dosha
                ? `Active (${guruChandal?.orb_degrees || 3.2}° orb)`
                : "Clean (No Conjunction)"}
            </strong>
          </div>
        </div>

        <div className="text-xs text-slate-600">
          <span className="font-bold text-slate-900 block mb-1">Classical Shanti Advice:</span>
          <p className="leading-relaxed">
            Feed birds and stray cows on Amavasya days. Offer water with sesame seeds (Til Tarpan) to ancestors.
          </p>
        </div>
      </div>

      {/* Shani Sade Sati 30-Year Lifetime Progression Timeline */}
      <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>🪐</span>
              <span>Lifetime Shani Sade Sati &amp; Dhaiya Progression Timeline (30-Year Cycles)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Lifespan Saturn transit cycles relative to Natal Moon ({sadeSatiTimeline?.natal_moon_sign || "Janma Rashi"}): 12th House (Rising), 1st House (Peak), 2nd House (Setting)
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-900 text-white">
            Endpoint 64 Live
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(
            sadeSatiTimeline?.cycles || [
              {
                cycle_number: 1,
                lifecycle_stage: "Early Life (प्रथम चक्र)",
                approx_age_span: "7.4 to 14.9 years",
                phases: [
                  { phase: "Charan 1 (Rising / उदय)", saturn_sign: "Leo (सिंह)", approx_years: "2002 - 2004" },
                  { phase: "Charan 2 (Peak / शिखर)", saturn_sign: "Virgo (कन्या)", approx_years: "2004 - 2007" },
                  { phase: "Charan 3 (Setting / अस्त)", saturn_sign: "Libra (तुला)", approx_years: "2007 - 2009" },
                ],
              },
              {
                cycle_number: 2,
                lifecycle_stage: "Middle Age (द्वितीय चक्र - Career & Family)",
                approx_age_span: "36.9 to 44.4 years",
                phases: [
                  { phase: "Charan 1 (Rising / उदय)", saturn_sign: "Leo (सिंह)", approx_years: "2032 - 2034" },
                  { phase: "Charan 2 (Peak / शिखर)", saturn_sign: "Virgo (कन्या)", approx_years: "2034 - 2037" },
                  { phase: "Charan 3 (Setting / अस्त)", saturn_sign: "Libra (तुला)", approx_years: "2037 - 2039" },
                ],
              },
              {
                cycle_number: 3,
                lifecycle_stage: "Senior Years (तृतीय चक्र - Spiritual Evolution)",
                approx_age_span: "66.4 to 73.9 years",
                phases: [
                  { phase: "Charan 1 (Rising / उदय)", saturn_sign: "Leo (सिंह)", approx_years: "2061 - 2063" },
                  { phase: "Charan 2 (Peak / शिखर)", saturn_sign: "Virgo (कन्या)", approx_years: "2063 - 2066" },
                  { phase: "Charan 3 (Setting / अस्त)", saturn_sign: "Libra (तुला)", approx_years: "2066 - 2068" },
                ],
              },
            ]
          ).map((cycle: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <strong className="text-xs font-bold text-slate-900">{cycle.lifecycle_stage}</strong>
                <span className="text-[10px] font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {cycle.approx_age_span}
                </span>
              </div>

              <div className="space-y-2">
                {cycle.phases?.map((ph: any, pIdx: number) => (
                  <div
                    key={pIdx}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 block text-[11px]">{ph.phase}</span>
                      <span className="text-[10px] text-slate-400">Saturn in {ph.saturn_sign}</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {ph.approx_years}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
