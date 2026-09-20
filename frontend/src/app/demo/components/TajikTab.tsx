"use client";

import React from "react";

interface TajikTabProps {
  jaiminiKarakas: any[];
  tajikVarshphal: any;
  jaiminiPadas: any;
  charaDasha: any;
  tajikYogas: any;
  jaiminiKarakamsha: any;
  upagrahasData: any;
  tajikSahams: any;
}

export const TajikTab: React.FC<TajikTabProps> = ({
  jaiminiKarakas,
  tajikVarshphal,
  jaiminiPadas,
  charaDasha,
  tajikYogas,
  jaiminiKarakamsha,
  upagrahasData,
  tajikSahams
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 7 Jaimini Chara Karakas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">7 Jaimini Chara Karakas (चर कारक)</h3>
            <p className="text-xs text-slate-500">Highest longitude order from Atmakaraka (Soul) to Darakaraka (Spouse)</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700">
            Jaimini Sutras
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {(jaiminiKarakas.length > 0 ? jaiminiKarakas : [
            { karaka_name: "Atmakaraka (AK)", planet_name: "Saturn", degree_in_sign: 28.45, signifies: "Soul & Karma" },
            { karaka_name: "Amatyakaraka (AmK)", planet_name: "Mercury", degree_in_sign: 24.12, signifies: "Career & Mind" },
            { karaka_name: "Bhatrikaraka (BK)", planet_name: "Jupiter", degree_in_sign: 21.05, signifies: "Guru & Siblings" },
            { karaka_name: "Matrikaraka (MK)", planet_name: "Venus", degree_in_sign: 18.30, signifies: "Mother & Assets" },
            { karaka_name: "Putrakaraka (PK)", planet_name: "Sun", degree_in_sign: 14.28, signifies: "Progeny & Wisdom" },
            { karaka_name: "Gnatikaraka (GK)", planet_name: "Mars", degree_in_sign: 9.15, signifies: "Obstacles & Disease" },
            { karaka_name: "Darakaraka (DK)", planet_name: "Moon", degree_in_sign: 4.50, signifies: "Spouse & Partner" },
          ]).map((k: any, idx: number) => {
            const rawTitle = k.karaka_name || k.karaka || "Karaka";
            const shortTitle = typeof rawTitle === "string" ? rawTitle.split(" ")[0] : String(rawTitle);
            const planetTitle = k.planet_name || k.planet || k.planet_id || "Planet";
            const degVal = k.degree_in_sign != null ? `${Number(k.degree_in_sign).toFixed(2)}°` : (k.degree || "0.00°");
            const signVal = typeof k.sign === "object" ? (k.sign?.name || k.sign?.id || "") : String(k.sign || "");
            return (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">{shortTitle}</div>
                <div className="font-bold text-xs text-slate-900 mt-0.5">{planetTitle}</div>
                <div className="text-[11px] font-mono text-indigo-600 font-semibold">{degVal}</div>
                <div className="text-[10px] text-slate-500 mt-1">{signVal || k.signifies || "Jaimini"}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tajik Annual Varshphal Solar Return */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Tajik Annual Varshphal (वर्षफल) &amp; Muntha</h3>
            <p className="text-xs text-slate-500">Annual solar return chart with Muntha house and Year Lord (Varshesh)</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-900 text-white">
            Year 2026
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Muntha House Placement</span>
            <div className="text-lg font-black text-slate-900">
              {tajikVarshphal?.muntha?.house || "9th House (Bhagya Bhava)"}
            </div>
            <p className="text-slate-500 mt-1">
              Muntha in auspicious 9th house brings pilgrimage, fortunes, and career elevation this year.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Varshesh (Year Lord)</span>
            <div className="text-lg font-black text-indigo-600">
              {tajikVarshphal?.varshesh || "Jupiter (बृहस्पति)"}
            </div>
            <p className="text-slate-500 mt-1">
              Strong Panchadhikari candidate governing major life accomplishments and wealth.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Varsha Lagna</span>
            <div className="text-lg font-black text-slate-900">
              {tajikVarshphal?.varsha_lagna || "Aries 12°24'"}
            </div>
            <p className="text-slate-500 mt-1">
              Active solar ingress ascendant marking the exact start of the personal birthday year.
            </p>
          </div>
        </div>
      </div>

      {/* Jaimini Arudha Padas */}
      {jaiminiPadas && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Jaimini Arudha Padas (आरूढ पद)</h3>
              <p className="text-xs text-slate-500">Image of each house as perceived by the world — AL, A2...A12</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700">Module 7 Live</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {(Array.isArray(jaiminiPadas?.padas) ? jaiminiPadas.padas :
              Object.entries(jaiminiPadas || {}).filter(([k]) => k.startsWith("A") || k === "AL")
                .map(([k, v]: [string, any]) => ({ pada: k, sign: v?.sign || v, house: v?.house }))
            ).map((p: any, i: number) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-[10px] uppercase font-bold text-indigo-500">{p.pada || p.name || `A${i+1}`}</div>
                <div className="font-bold text-xs text-slate-900 mt-0.5">
                  {typeof p.sign === "object" ? (p.sign?.name || p.sign?.id) : (p.sign || "—")}
                </div>
                <div className="text-[10px] text-slate-500">H{p.house || (i+1)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jaimini Chara Dasha */}
      {charaDasha && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Jaimini Chara Dasha (चर दशा)</h3>
              <p className="text-xs text-slate-500">Sign-based dasha system — current and upcoming periods</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-50 text-amber-700">Module 7 Live</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 font-bold text-slate-500 uppercase text-[10px]">Dasha (Rashi)</th>
                  <th className="text-left py-2 font-bold text-slate-500 uppercase text-[10px]">Start</th>
                  <th className="text-left py-2 font-bold text-slate-500 uppercase text-[10px]">End</th>
                  <th className="text-left py-2 font-bold text-slate-500 uppercase text-[10px]">Years</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(Array.isArray(charaDasha?.dashas) ? charaDasha.dashas :
                  Array.isArray(charaDasha) ? charaDasha : []
                ).slice(0, 12).map((d: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2 font-bold text-slate-900">{d.sign || d.rashi || d.dasha || "—"}</td>
                    <td className="py-2 font-mono text-slate-600">{d.start_date || d.start || "—"}</td>
                    <td className="py-2 font-mono text-slate-600">{d.end_date || d.end || "—"}</td>
                    <td className="py-2 text-indigo-600 font-bold">{d.years || d.duration || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tajik Yogas */}
      {tajikYogas && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Tajik Annual Yogas (ताजिक योग)</h3>
              <p className="text-xs text-slate-500">Ithasala, Isharapha, Nakta and other annual chart yogas</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-900 text-white">Year 2026</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Array.isArray(tajikYogas?.yogas) ? tajikYogas.yogas :
              Array.isArray(tajikYogas) ? tajikYogas : []
            ).map((y: any, i: number) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{y.yoga || y.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${y.present || y.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                    {y.present || y.active ? "✓ Present" : "Absent"}
                  </span>
                </div>
                {y.description && <p className="text-[11px] text-slate-500">{y.description}</p>}
                {(y.planets || y.involved_planets) && (
                  <p className="text-[11px] text-indigo-600 font-mono">{(y.planets || y.involved_planets)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jaimini Karakamsha & Swamsha (Module 7 — Endpoint 53) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Jaimini Karakamsha Lagna (कारकांश लग्न - Swamsha)</h3>
            <p className="text-xs text-slate-500">The Navamsha sign occupied by the Atmakaraka (Soul Planet) reveals spiritual destiny</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700">
            Endpoint 53 Live
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Karakamsha Sign</span>
            <strong className="text-lg font-black text-indigo-700 mt-1 block">
              {jaiminiKarakamsha?.karakamsha_lagna?.sign_name || jaiminiKarakamsha?.karakamsha_sign || (typeof jaiminiKarakamsha?.sign === "string" ? jaiminiKarakamsha.sign : "Sagittarius (धनु)")}
            </strong>
            <span className="text-[10px] text-slate-500">Highest spiritual &amp; career inclinations</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Atmakaraka (आत्मकारक)</span>
            <strong className="text-lg font-black text-slate-900 mt-1 block">
              {typeof jaiminiKarakamsha?.atmakaraka === "object"
                ? (jaiminiKarakamsha.atmakaraka.planet || jaiminiKarakamsha.atmakaraka.name || "Saturn (शनि)")
                : (jaiminiKarakamsha?.atmakaraka || "Saturn (शनि)")}
            </strong>
            <span className="text-[10px] text-slate-500 font-mono">
              {jaiminiKarakamsha?.atmakaraka?.degree_in_sign != null
                ? `${Number(jaiminiKarakamsha.atmakaraka.degree_in_sign).toFixed(2)}°`
                : (jaiminiKarakamsha?.degree ? `${Number(jaiminiKarakamsha.degree).toFixed(2)}°` : "28.45° (Highest Arc)")}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Swamsha 12th House (Moksha)</span>
            <strong className="text-lg font-black text-emerald-700 mt-1 block">
              {typeof jaiminiKarakamsha?.moksha_indicator === "object"
                ? (jaiminiKarakamsha.moksha_indicator.planet || jaiminiKarakamsha.moksha_indicator.sign || "Ketu Aspect (मोक्ष कारक)")
                : (jaiminiKarakamsha?.moksha_indicator || "Ketu Aspect (मोक्ष कारक)")}
            </strong>
            <span className="text-[10px] text-slate-500">Spiritual liberation &amp; Ishta Devata</span>
          </div>
        </div>
      </div>

      {/* Classical Upagrahas: Mandi, Gulika, etc. (Module 7 — Endpoint 55) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Classical Upagrahas &amp; Shadow Planets (उपग्रह गणना)</h3>
            <p className="text-xs text-slate-500">Mandi, Gulika, Dhuma, Vyatipata, Parivesha, Indrachapa, Upaketu</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
            Endpoint 55 Live
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs text-center">
          {(upagrahasData?.upagrahas ? (
            Array.isArray(upagrahasData.upagrahas) 
              ? upagrahasData.upagrahas 
              : Object.entries(upagrahasData.upagrahas).map(([k, v]: [string, any]) => ({ name: k, ...v }))
          ) : [
            { name: "Mandi (मांदि)", sign: "Virgo", deg: "18.24°", house: 10 },
            { name: "Gulika (गुलिक)", sign: "Virgo", deg: "14.12°", house: 10 },
            { name: "Dhuma (धूम)", sign: "Capricorn", deg: "27.48°", house: 2 },
            { name: "Vyatipata (व्यतीपात)", sign: "Gemini", deg: "02.12°", house: 7 },
            { name: "Parivesha (परिवेश)", sign: "Sagittarius", deg: "02.12°", house: 1 },
            { name: "Indrachapa (इंद्रचाप)", sign: "Cancer", deg: "27.48°", house: 8 },
            { name: "Upaketu (उपकेतु)", sign: "Leo", deg: "14.28°", house: 9 },
          ]).map((u: any, idx: number) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-indigo-700 uppercase block">{u.name || u.title}</span>
              <strong className="text-xs font-bold text-slate-900 mt-0.5 block">{u.sign || (typeof u.sign_name === "string" ? u.sign_name : "Virgo")}</strong>
              <span className="font-mono text-[10px] text-slate-500 block">{u.deg || (u.degree ? `${Number(u.degree).toFixed(2)}°` : "—")}</span>
              <span className="text-[9px] font-semibold text-slate-400 block mt-0.5">House {u.house || idx + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tajik 36 Sahams / Arabic Sensitive Parts (Module 7 — Endpoint 60) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Tajik 36 Sahams (अरबी सहम - Sensitive Celestial Points)</h3>
            <p className="text-xs text-slate-500">Punya Saham, Vidya Saham, Yashas Saham, Karma Saham, Vivaha Saham</p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-900 text-white">
            Endpoint 60 Live
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          {(tajikSahams?.sahams ? (
            Array.isArray(tajikSahams.sahams)
              ? tajikSahams.sahams
              : Object.entries(tajikSahams.sahams).map(([name, data]: [string, any]) => ({ name, ...data }))
          ) : [
            { name: "Punya Saham (पुण्य सहम)", meaning: "Fortune, Luck & Destiny", sign: "Taurus", deg: "18.32°" },
            { name: "Vidya Saham (विद्या सहम)", meaning: "Higher Knowledge & Intellect", sign: "Virgo", deg: "22.14°" },
            { name: "Yashas Saham (यश सहम)", meaning: "Fame, Glory & Recognition", sign: "Leo", deg: "04.50°" },
            { name: "Karma Saham (कर्म सहम)", meaning: "Profession & Accomplishment", sign: "Aries", deg: "11.20°" },
            { name: "Vivaha Saham (विवाह सहम)", meaning: "Marriage & Life Partner", sign: "Libra", deg: "29.05°" },
            { name: "Artha Saham (अर्थ सहम)", meaning: "Wealth, Cash & Material Flow", sign: "Gemini", deg: "15.40°" },
          ]).map((s: any, idx: number) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <strong className="text-xs font-bold text-slate-900 block truncate">{s.name}</strong>
              <span className="text-[10px] text-slate-500 block leading-tight">{s.meaning || s.significance}</span>
              <div className="pt-1 flex items-center justify-between font-mono text-[10px]">
                <span className="text-indigo-600 font-bold">{s.sign || "Aries"}</span>
                <span className="text-slate-400">{s.deg || (s.degree ? `${Number(s.degree).toFixed(2)}°` : "—")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
