"use client";

import React from "react";

interface RemediesTabProps {
  gemstones: any;
  rudrakshaList: any[];
  fastingRecs: any;
  mantrasList: any[];
  yantraData: any;
  gemRestrictions: any;
}

export const RemediesTab: React.FC<RemediesTabProps> = ({
  gemstones,
  rudrakshaList,
  fastingRecs,
  mantrasList,
  yantraData,
  gemRestrictions,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Gemstone Triad */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Life Stone (Lagna)</span>
          <div className="text-xl font-black text-slate-900">
            {gemstones?.life_stone?.name || "Yellow Sapphire (पुखराज)"}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Enhances physical vitality, confidence, and longevity. Wear on right index finger.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lucky Stone (9th Bhava)</span>
          <div className="text-xl font-black text-slate-900">
            {gemstones?.lucky_stone?.name || "Ruby (माणिक)"}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Activates Bhagya, fortunes, and high recognition in government affairs.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Benefic Stone (5th Bhava)</span>
          <div className="text-xl font-black text-slate-900">
            {gemstones?.benefic_stone?.name || "Red Coral (मूंगा)"}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sharpens intellect, decision making, and protects progeny.
          </p>
        </div>
      </div>

      {/* Rudraksha & Vedic Beej Mantras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rudraksha Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Prescribed Rudraksha (1–14 Mukhi)</h3>
              <p className="text-xs text-slate-500">Selected based on Lagna lord and functional benefics</p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-800">
              Module 9 Live
            </span>
          </div>

          <div className="space-y-3">
            {(rudrakshaList.length > 0 ? rudrakshaList : [
              { mukhi: "5 Mukhi (पंचमुखी)", deity: "Kalagni Rudra", ruling_planet: "JUPITER", benefits: "Purifies thoughts, regulates blood pressure, grants academic wisdom." },
              { mukhi: "1 Mukhi (एकमुखी)", deity: "Lord Shiva", ruling_planet: "SUN", benefits: "Heightens consciousness, leadership aura, and spiritual liberation." },
              { mukhi: "7 Mukhi (सातमुखी)", deity: "Goddess Mahalakshmi", ruling_planet: "SATURN", benefits: "Neutralizes Saturn afflictions, grants financial recovery." }
            ]).map((r: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{r.mukhi}</span>
                  <span className="text-[10px] font-mono text-slate-500">{r.deity}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{r.benefits}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Vedic Mantras & Weekly Fasting */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Vedic Beej Mantras &amp; Weekly Fasting (व्रत)</h3>
              <p className="text-xs text-slate-500">Harmonizing planetary frequencies through sound vibrations</p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700">
              Mantras
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-indigo-700 block">Recommended Weekly Vrat:</span>
              <div className="text-sm font-black text-indigo-950">
                {fastingRecs?.recommended_weekly_vrat?.day || "Thursday (गुरुवार व्रत)"}
              </div>
              <p className="text-[11px] text-indigo-900 mt-0.5">
                {fastingRecs?.recommended_weekly_vrat?.purpose || "Consume yellow food, offer water to banana tree to strengthen Guru's divine blessings."}
              </p>
            </div>

            {((Array.isArray(mantrasList) && mantrasList.slice(0, 3).length > 0) ? mantrasList.slice(0, 3) : [
              { planet: "Jupiter (बृहस्पति)", mantra: "ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः", counts: "19,000 times" },
              { planet: "Saturn (शनि)", mantra: "ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः", counts: "23,000 times" },
              { planet: "Sun (सूर्य)", mantra: "ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः", counts: "7,000 times" }
            ]).map((m: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{m.planet}</span>
                  <span className="font-serif text-indigo-700 font-semibold text-[13px]">{m.mantra}</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500 px-2 py-1 bg-white rounded border border-slate-200">
                  {m.counts}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Yantras & Gemstone Restrictions */}
      {(yantraData || gemRestrictions) && (
        <div className="space-y-6 mt-6">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">🔯 Complete Remedies Suite</h2>

          {/* Yantras */}
          {yantraData && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Yantra Recommendations (यंत्र)</h3>
                  <p className="text-xs text-slate-500">Sacred geometric diagrams for planetary remediation & cosmic abundance</p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-50 text-amber-700">Remedies API</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(() => {
                  const yList: any[] = [];
                  if (yantraData?.primary_planetary_yantra) {
                    yList.push({ ...yantraData.primary_planetary_yantra, tag: "Primary Lagna Yantra" });
                  }
                  if (yantraData?.cosmic_abundance_yantra) {
                    yList.push({ ...yantraData.cosmic_abundance_yantra, tag: "Cosmic Abundance Yantra" });
                  }
                  if (Array.isArray(yantraData?.yantras)) {
                    yList.push(...yantraData.yantras);
                  }
                  return yList.map((y: any, i: number) => (
                    <div key={i} className="p-4 rounded-xl bg-amber-50/40 border border-amber-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-amber-950">🔯 {y.name || y.yantra}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200/80 text-amber-900">
                          {y.tag || y.planet || "Auspicious"}
                        </span>
                      </div>
                      {y.purpose && <p className="text-xs text-slate-700 font-medium">{y.purpose}</p>}
                      {y.metal && <div className="text-[11px] text-amber-800">Ideal Metal / Medium: <strong>{y.metal}</strong></div>}
                      {y.mantra && (
                        <div className="text-[10px] font-mono bg-white/80 p-2 rounded border border-amber-200 text-amber-900">
                          Mantra: {y.mantra}
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
              {yantraData?.installation_guide && (
                <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  💡 <strong>Installation Guide:</strong> {yantraData.installation_guide}
                </div>
              )}
            </div>
          )}

          {/* Gemstone Restrictions */}
          {gemRestrictions && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Gemstone Restrictions & Cautions (रत्न निषेध)</h3>
                  <p className="text-xs text-slate-500">
                    Maraka, Badhaka & Dusthana gemstones to strictly avoid based on your Lagna
                    {gemRestrictions?.ascendant_sign ? ` (${gemRestrictions.ascendant_sign})` : ""}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-red-50 text-red-700">Remedies API</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(
                  Array.isArray(gemRestrictions?.prohibitions)
                    ? gemRestrictions.prohibitions
                    : Array.isArray(gemRestrictions?.restrictions)
                    ? gemRestrictions.restrictions
                    : Array.isArray(gemRestrictions)
                    ? gemRestrictions
                    : []
                ).map((r: any, i: number) => {
                  const reasons = Array.isArray(r.conflict_reasons) ? r.conflict_reasons : r.reason ? [r.reason] : [];
                  const isStrict = r.severity === "STRICTLY_PROHIBITED";

                  return (
                    <div key={i} className="p-4 rounded-xl bg-red-50/40 border border-red-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-red-950">⛔ {r.gemstone || r.name || "Restricted Stone"}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isStrict ? "bg-red-600 text-white" : "bg-red-100 text-red-800"}`}>
                          {r.severity || "AVOID"}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-red-800">
                        Planet: {r.planet}
                      </div>
                      {reasons.length > 0 && (
                        <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc list-inside">
                          {reasons.map((rs: string, idx: number) => (
                            <li key={idx} className="leading-snug">{rs}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
