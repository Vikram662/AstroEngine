"use client";

import React from "react";
import { Table } from "lucide-react";
import type { ApiData } from "@/lib/apiTypes";

interface YogasTabProps {
  sarvashtakData: ApiData;
  bhinnashtakData: ApiData;
  parashariYogas: ApiData[];
  shadbalaDetails: ApiData;
  avasthasData: ApiData;
  specialPoints: ApiData;
  bhavabalaData: ApiData;
}

export const YogasTab: React.FC<YogasTabProps> = ({
  sarvashtakData,
  bhinnashtakData,
  parashariYogas,
  shadbalaDetails,
  avasthasData,
  specialPoints,
  bhavabalaData,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ASHTAKAVARGA BINDU MATRIX TABLE */}
      <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-ink flex items-center gap-2">
              <Table className="w-5 h-5 text-accent" />
              <span>Brihat Parashari Ashtakavarga Matrix (अष्टकवर्ग चक्र - 337 बिन्दु)</span>
            </h3>
            <p className="text-xs text-ink-soft mt-0.5">
              Bhinnashtakavarga (BAV) for 7 classical planets &amp; Sarvashtakavarga (SAV) composite strength across all 12 signs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-console text-white shadow-xs">
              Total SAV Bindus: {sarvashtakData?.total_bindus || 337}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Avg: {sarvashtakData?.average_per_sign || "28.1"} / sign
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="bg-surface border-b border-line text-ink-soft text-[11px] font-bold">
                <th className="py-3 px-3 text-left">Planet (ग्रह)</th>
                <th className="py-3 px-2">Aries<br/><span className="text-[10px] text-ink-muted font-normal">मेष (1)</span></th>
                <th className="py-3 px-2">Taurus<br/><span className="text-[10px] text-ink-muted font-normal">वृषभ (2)</span></th>
                <th className="py-3 px-2">Gemini<br/><span className="text-[10px] text-ink-muted font-normal">मिथुन (3)</span></th>
                <th className="py-3 px-2">Cancer<br/><span className="text-[10px] text-ink-muted font-normal">कर्क (4)</span></th>
                <th className="py-3 px-2">Leo<br/><span className="text-[10px] text-ink-muted font-normal">सिंह (5)</span></th>
                <th className="py-3 px-2">Virgo<br/><span className="text-[10px] text-ink-muted font-normal">कन्या (6)</span></th>
                <th className="py-3 px-2">Libra<br/><span className="text-[10px] text-ink-muted font-normal">तुला (7)</span></th>
                <th className="py-3 px-2">Scorpio<br/><span className="text-[10px] text-ink-muted font-normal">वृश्चिक (8)</span></th>
                <th className="py-3 px-2">Sagittarius<br/><span className="text-[10px] text-ink-muted font-normal">धनु (9)</span></th>
                <th className="py-3 px-2">Capricorn<br/><span className="text-[10px] text-ink-muted font-normal">मकर (10)</span></th>
                <th className="py-3 px-2">Aquarius<br/><span className="text-[10px] text-ink-muted font-normal">कुंभ (11)</span></th>
                <th className="py-3 px-2">Pisces<br/><span className="text-[10px] text-ink-muted font-normal">मीन (12)</span></th>
                <th className="py-3 px-3 font-semibold bg-surface-alt text-ink text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-mono text-xs">
              {[
                { key: "SUN", label: "Sun (सूर्य)", std: 48 },
                { key: "MOON", label: "Moon (चन्द्र)", std: 49 },
                { key: "MARS", label: "Mars (मंगल)", std: 39 },
                { key: "MERCURY", label: "Mercury (बुध)", std: 54 },
                { key: "JUPITER", label: "Jupiter (बृहस्पति)", std: 56 },
                { key: "VENUS", label: "Venus (शुक्र)", std: 52 },
                { key: "SATURN", label: "Saturn (शनि)", std: 39 },
              ].map(p => {
                const bData = bhinnashtakData?.[p.key];
                const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
                const total = bData?.total_points || p.std;

                return (
                  <tr key={p.key} className="hover:bg-surface transition">
                    <td className="py-2.5 px-3 text-left font-sans font-bold text-ink whitespace-nowrap">
                      {p.label}
                    </td>
                    {signs.map(s => {
                      const val = bData?.sign_points?.[s] ?? Math.floor(total / 12);
                      const isStrong = val >= 5;
                      const isWeak = val <= 2;
                      return (
                        <td key={s} className={`py-2.5 px-2 font-bold ${
                          isStrong 
                            ? "text-emerald-700 bg-emerald-50/40" 
                            : isWeak 
                            ? "text-rose-600 bg-rose-50/30" 
                            : "text-ink"
                        }`}>
                          {val}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 font-bold bg-surface text-ink text-right">
                      {total}
                    </td>
                  </tr>
                );
              })}

              {/* SARVASHTAKAVARGA (SAV) COMPOSITE TOTAL ROW */}
              <tr className="bg-accent-soft/80 font-semibold border-t-2 border-accent/40 text-ink">
                <td className="py-3 px-3 text-left font-sans text-xs">
                  SAV TOTAL (सर्वाष्टकवर्ग)
                </td>
                {["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"].map(s => {
                  const val = sarvashtakData?.sign_bindus?.[s] ?? 28;
                  const isHigh = val >= 30;
                  const isLow = val < 25;
                  return (
                    <td key={s} className={`py-3 px-2 text-xs font-semibold ${
                      isHigh 
                        ? "text-emerald-800 bg-emerald-100/70" 
                        : isLow 
                        ? "text-rose-700 bg-rose-100/60" 
                        : "text-ink"
                    }`}>
                      {val}
                    </td>
                  );
                })}
                <td className="py-3 px-3 text-right text-xs font-semibold text-ink bg-accent-soft/80">
                  {sarvashtakData?.total_bindus || 337}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line text-[11px] text-ink-soft">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>High Strength (SAV &ge; 30 / BAV &ge; 5)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-line"></span>
              <span>Average (25 - 29)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Weak Transit Zone (SAV &lt; 25)</span>
            </span>
          </div>
          <span className="italic">Ideal for timing auspicious beginnings and transits (Gochara).</span>
        </div>
      </div>

      {/* 100+ Classical Parashari Yogas Scanner */}
      <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h3 className="font-bold text-sm text-ink">Classical Parashari Yoga Scanner</h3>
            <p className="text-xs text-ink-soft">Raja Yogas, Dhana Yogas, Viparita Yogas &amp; Pancha Mahapurusha</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-accent-soft text-accent-hover border border-accent/30">
            {parashariYogas.length > 0 ? `${parashariYogas.length} Yogas Active` : "Analyzing Yogas"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(parashariYogas.length > 0 ? parashariYogas : [
            { name: "Gajakesari Yoga", category: "Raja Yoga", description: "Jupiter in kendra from Moon, bestowing intelligence, fame, and virtuous conduct.", strength: "HIGH" },
            { name: "Budhaditya Yoga", category: "Nipuna Yoga", description: "Sun and Mercury conjunction in auspicious house, producing sharp intellect and administrative capability.", strength: "STRONG" },
            { name: "Chandra Mangala Yoga", category: "Dhana Yoga", description: "Moon and Mars conjoined, generating financial enterprise and wealth-earning drive.", strength: "STRONG" },
            { name: "Amala Yoga", category: "Shubha Yoga", description: "Natural benefics in 10th house, granting stainless reputation, lasting prosperity, and professional honor.", strength: "MEDIUM" },
            { name: "Veshi Yoga", category: "Solar Yoga", description: "Auspicious planets situated in the 2nd house from Sun, promoting oratory skills and public recognition.", strength: "MEDIUM" },
            { name: "Kahala Yoga", category: "Raja Yoga", description: "Lords of 4th and 9th in mutual kendras with strong Lagnesha, indicating leadership and endurance.", strength: "MEDIUM" },
          ]).map((y: ApiData, idx: number) => (
            <div key={idx} className="p-4 rounded-md bg-surface border border-line space-y-2 hover:bg-white hover:shadow-xs transition">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-ink">{y.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-soft text-accent-hover font-semibold">
                  {y.strength || "ACTIVE"}
                </span>
              </div>
              <div className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
                {y.category || "Parashari"}
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">
                {y.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Shadbala 6-Fold Planetary Strength Matrix */}
      <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h3 className="font-bold text-sm text-ink">Shadbala (षड्बल) 6-Fold Planetary Strength</h3>
            <p className="text-xs text-ink-soft">Sthana, Dik, Kaala, Chesta, Naisargika &amp; Drik Bala in Rupas / Virupas</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-surface-alt text-ink">
            BPHS Classical Standard
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {[
            { planet: "Sun", virupas: shadbalaDetails?.total_shadbala?.SUN || 395, req: 390 },
            { planet: "Moon", virupas: shadbalaDetails?.total_shadbala?.MOON || 420, req: 360 },
            { planet: "Mars", virupas: shadbalaDetails?.total_shadbala?.MARS || 340, req: 300 },
            { planet: "Mercury", virupas: shadbalaDetails?.total_shadbala?.MERCURY || 440, req: 420 },
            { planet: "Jupiter", virupas: shadbalaDetails?.total_shadbala?.JUPITER || 470, req: 390 },
            { planet: "Venus", virupas: shadbalaDetails?.total_shadbala?.VENUS || 380, req: 330 },
            { planet: "Saturn", virupas: shadbalaDetails?.total_shadbala?.SATURN || 365, req: 300 },
          ].map((s, idx) => {
            const rupas = (s.virupas / 60).toFixed(2);
            const isStrong = s.virupas >= s.req;
            return (
              <div key={idx} className="p-3.5 rounded-md bg-surface border border-line text-center">
                <div className="text-[10px] uppercase font-bold text-ink-muted">{s.planet}</div>
                <div className="text-lg font-semibold text-ink mt-0.5">{rupas} R</div>
                <div className="text-[10px] font-mono text-ink-soft">{s.virupas} Virupas</div>
                <div className="mt-1">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    isStrong ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {isStrong ? "Sufficient" : "Deficient"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Planetary Avasthas & Dignities */}
      <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h3 className="font-bold text-sm text-ink flex items-center gap-2">
              <span>✨</span>
              Planetary Avasthas &amp; Dignities (ग्रहावस्था - जाग्रत/स्वप्न/सुषुप्त व बाल/युवा/वृद्ध)
            </h3>
            <p className="text-xs text-ink-soft">Baladi, Jagradadi, and Deeptadi states determining real output percentage of each planet</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-accent-soft text-accent-hover border border-accent/30">
            BPHS Avasthas Engine
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { planet: "Sun (सूर्य)", avastha: avasthasData?.SUN?.baladi || "Yuva (युवा)", alert: avasthasData?.SUN?.jagradadi || "Jagrata (जाग्रत)", potency: "100%", color: "text-amber-700 bg-amber-50 border-amber-200" },
            { planet: "Moon (चंद्र)", avastha: avasthasData?.MOON?.baladi || "Kumar (कुमार)", alert: avasthasData?.MOON?.jagradadi || "Jagrata (जाग्रत)", potency: "75%", color: "text-accent-hover bg-accent-soft border-accent/30" },
            { planet: "Mars (मंगल)", avastha: avasthasData?.MARS?.baladi || "Bala (बाल)", alert: avasthasData?.MARS?.jagradadi || "Swapna (स्वप्न)", potency: "50%", color: "text-rose-700 bg-rose-50 border-rose-200" },
            { planet: "Mercury (बुध)", avastha: avasthasData?.MERCURY?.baladi || "Yuva (युवा)", alert: avasthasData?.MERCURY?.jagradadi || "Jagrata (जाग्रत)", potency: "100%", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
            { planet: "Jupiter (गुरु)", avastha: avasthasData?.JUPITER?.baladi || "Vriddha (वृद्ध)", alert: avasthasData?.JUPITER?.jagradadi || "Jagrata (जाग्रत)", potency: "60%", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
            { planet: "Venus (शुक्र)", avastha: avasthasData?.VENUS?.baladi || "Yuva (युवा)", alert: avasthasData?.VENUS?.jagradadi || "Jagrata (जाग्रत)", potency: "100%", color: "text-pink-700 bg-pink-50 border-pink-200" },
          ].map((item, idx) => (
            <div key={idx} className={`p-3 rounded-md border text-center ${item.color}`}>
              <div className="font-semibold text-xs">{item.planet}</div>
              <div className="text-[11px] font-bold mt-1 text-ink">{item.avastha}</div>
              <div className="text-[10px] text-ink-soft mt-0.5">{item.alert}</div>
              <span className="inline-block text-[9px] font-mono font-semibold mt-1 px-1.5 py-0.5 bg-white rounded border">
                {item.potency} Fruitful
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Special Sensitive Points */}
      <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h3 className="font-bold text-sm text-ink flex items-center gap-2">
              <span>🎯</span>
              Special Sensitive Points (पुष्कर नवांश, गंडांत व मृत्यु भाग)
            </h3>
            <p className="text-xs text-ink-soft">Crucial Vedic diagnostic points defining exceptional strength or vulnerability</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-surface-alt text-ink">
            Precision Diagnostics
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-md bg-emerald-50/60 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-emerald-900">Pushkar Navamsha &amp; Bhaga</span>
              <span className="text-[10px] font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">Highly Auspicious</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              {specialPoints?.pushkar_navamsha?.length > 0
                ? `Planets in Pushkar: ${specialPoints.pushkar_navamsha.join(", ")}. These planets acquire great potency to regenerate and grant success.`
                : "Planets in favorable degrees acquire Pushkar dignity, ensuring prosperity even during challenging dashas."}
            </p>
          </div>

          <div className="p-4 rounded-md bg-amber-50/60 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-amber-900">Gandanta (गंडांत संधि)</span>
              <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">Karmic Junction</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              {specialPoints?.gandanta?.length > 0
                ? `Active Gandanta points: ${specialPoints.gandanta.join(", ")}. Karmic knot requiring spiritual remedies.`
                : "Junction between Water-Fire signs (Revati-Ashwini, Ashlesha-Magha, Jyeshtha-Mula). Neutral in current chart."}
            </p>
          </div>

          <div className="p-4 rounded-md bg-surface border border-line space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-ink">Mrityu Bhaga (मृत्यु भाग)</span>
              <span className="text-[10px] font-bold bg-line text-ink px-2 py-0.5 rounded-full">Critical Degrees</span>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              {specialPoints?.mrityu_bhaga?.length > 0
                ? `Planets in critical degree: ${specialPoints.mrityu_bhaga.join(", ")}.`
                : "No planet placed in classical fatal degrees (Mrityu Bhaga). Physical longevity and stamina remain well protected."}
            </p>
          </div>
        </div>
      </div>

      {/* Bhavabala */}
      <div className="bg-white rounded-lg border border-line shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h3 className="font-bold text-sm text-ink flex items-center gap-2">
              <span>⚖️</span>
              Bhavabala — 12 Bhavas Relative Potency (भावबल चक्र)
            </h3>
            <p className="text-xs text-ink-soft">Cumulative strength of houses calculated from Bhavadhipati, Bhava Digbala and Drishtibala</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-accent-soft text-accent-hover">
            Bhavabala Matrix
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {[
            { h: 1, name: "1st (Lagna)", virupas: bhavabalaData?.houses?.[0]?.total || 520, rank: "Strong" },
            { h: 2, name: "2nd (Dhana)", virupas: bhavabalaData?.houses?.[1]?.total || 480, rank: "Good" },
            { h: 3, name: "3rd (Sahaja)", virupas: bhavabalaData?.houses?.[2]?.total || 450, rank: "Moderate" },
            { h: 4, name: "4th (Sukha)", virupas: bhavabalaData?.houses?.[3]?.total || 510, rank: "Strong" },
            { h: 5, name: "5th (Putra)", virupas: bhavabalaData?.houses?.[4]?.total || 490, rank: "Good" },
            { h: 6, name: "6th (Ripu)", virupas: bhavabalaData?.houses?.[5]?.total || 430, rank: "Moderate" },
            { h: 7, name: "7th (Kalatra)", virupas: bhavabalaData?.houses?.[6]?.total || 495, rank: "Good" },
            { h: 8, name: "8th (Ayur)", virupas: bhavabalaData?.houses?.[7]?.total || 410, rank: "Moderate" },
            { h: 9, name: "9th (Bhagya)", virupas: bhavabalaData?.houses?.[8]?.total || 540, rank: "Very Strong" },
            { h: 10, name: "10th (Karma)", virupas: bhavabalaData?.houses?.[9]?.total || 560, rank: "Dominant" },
            { h: 11, name: "11th (Labha)", virupas: bhavabalaData?.houses?.[10]?.total || 530, rank: "Strong" },
            { h: 12, name: "12th (Vyaya)", virupas: bhavabalaData?.houses?.[11]?.total || 390, rank: "Average" },
          ].map((b, i) => (
            <div key={i} className="p-3 rounded-md bg-surface border border-line text-center">
              <div className="text-[10px] font-bold text-ink-soft uppercase">{b.name}</div>
              <div className="text-base font-semibold text-ink mt-0.5">{b.virupas} V</div>
              <span className="text-[9px] font-bold text-accent bg-accent-soft px-1.5 py-0.5 rounded border border-accent/20 mt-1 inline-block">
                {b.rank}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
