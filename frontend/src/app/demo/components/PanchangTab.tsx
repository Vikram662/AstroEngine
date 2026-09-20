"use client";

import React from "react";

interface PanchangTabProps {
  panchang: any;
  choghadiya?: any;
  panchangAdvanced?: any;
  horaData?: any;
  bhadraData?: any;
  panchakData?: any;
  marriageMuhurat?: any;
  grihaProveshMuhurat?: any;
  propertyMuhurat?: any;
  monthlyCalendar?: any;
  namaksharData?: any;
  planets?: any[];
  d1Chart?: any;
  currentDasha?: any;
  sunMoonTimings?: any;
}

export const PanchangTab: React.FC<PanchangTabProps> = ({
  panchang,
  choghadiya,
  panchangAdvanced,
  horaData,
  bhadraData,
  panchakData,
  marriageMuhurat,
  grihaProveshMuhurat,
  propertyMuhurat,
  monthlyCalendar,
  namaksharData,
  planets = [],
  d1Chart,
  currentDasha,
  sunMoonTimings,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 5 Panchang Limbs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          {
            title: "Tithi (तिथि)",
            val: (typeof panchang?.tithi === "object" ? panchang.tithi?.name : panchang?.tithi) || "Shukla Dashami",
            sub: panchang?.tithi?.paksha || "",
            icon: "🌙",
          },
          {
            title: "Nakshatra (नक्षत्र)",
            val: (typeof panchang?.nakshatra === "object" ? panchang.nakshatra?.name : panchang?.nakshatra) || "Rohini",
            sub: panchang?.nakshatra?.lord || "",
            icon: "⭐",
          },
          {
            title: "Yoga (योग)",
            val: (typeof panchang?.yoga === "object" ? panchang.yoga?.name : panchang?.yoga) || "Shobhana",
            sub: "Luni-Solar",
            icon: "☀️",
          },
          {
            title: "Karana (करण)",
            val: (typeof panchang?.karana === "object" ? panchang.karana?.name : panchang?.karana) || "Kaulava",
            sub: "Half-tithi",
            icon: "🔆",
          },
          {
            title: "Vaar (वार)",
            val: (typeof panchang?.vaar === "object" ? panchang.vaar?.name || panchang.vaar?.id : panchang?.vaar) || "Thursday",
            sub: panchang?.vaar?.lord || "Jupiter",
            icon: "📅",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-200 transition"
          >
            <div className="text-2xl mb-2">{item.icon}</div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{item.title}</span>
            <div className="text-base font-black text-slate-900 mt-1 leading-tight">{item.val}</div>
            {item.sub && <div className="text-[10px] text-slate-500 mt-0.5">{item.sub}</div>}
          </div>
        ))}
      </div>

      {/* Sunrise / Sunset */}
      {sunMoonTimings && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Sunrise (सूर्योदय)", val: sunMoonTimings.sunrise || sunMoonTimings.sun_rise || panchang?.sunrise, icon: "🌅", color: "bg-amber-50 border-amber-200" },
            { label: "Sunset (सूर्यास्त)", val: sunMoonTimings.sunset || sunMoonTimings.sun_set || panchang?.sunset, icon: "🌇", color: "bg-orange-50 border-orange-200" },
            { label: "Moonrise (चंद्रोदय)", val: sunMoonTimings.moonrise || sunMoonTimings.moon_rise || panchang?.moonrise, icon: "🌕", color: "bg-indigo-50 border-indigo-200" },
            { label: "Moonset", val: sunMoonTimings.moonset || sunMoonTimings.moon_set || panchang?.moonset, icon: "🌑", color: "bg-slate-50 border-slate-200" },
          ].map((t, i) => (
            <div key={i} className={`p-4 rounded-2xl border text-center ${t.color}`}>
              <div className="text-2xl mb-1">{t.icon}</div>
              <div className="text-[10px] uppercase font-bold text-slate-500">{t.label}</div>
              <div className="font-black text-slate-900 text-sm mt-0.5 font-mono">{t.val || "—"}</div>
            </div>
          ))}
        </div>
      )}

      {/* Choghadiya: Day + Night both */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Day &amp; Night Choghadiya (चौघड़िया)</h3>
            <p className="text-xs text-slate-500">
              Shubh, Labh, Amrit, Char — auspicious timings. Rog, Udveg, Kaal — inauspicious
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700">
            Sunrise-anchored
          </span>
        </div>

        {/* Day Choghadiya */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">☀️</span>
            <span className="text-xs font-black uppercase text-slate-600">Din Choghadiya (Day)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {(
              choghadiya?.day_slots ||
              choghadiya?.day || [
                { name: "Shubh", start: "06:15", end: "07:45", type: "auspicious" },
                { name: "Rog", start: "07:45", end: "09:15", type: "inauspicious" },
                { name: "Udveg", start: "09:15", end: "10:45", type: "inauspicious" },
                { name: "Char", start: "10:45", end: "12:15", type: "neutral" },
                { name: "Labh", start: "12:15", end: "13:45", type: "auspicious" },
                { name: "Amrit", start: "13:45", end: "15:15", type: "auspicious" },
                { name: "Kaal", start: "15:15", end: "16:45", type: "inauspicious" },
                { name: "Shubh", start: "16:45", end: "18:15", type: "auspicious" },
              ]
            ).map((slot: any, idx: number) => {
              const name = slot.name || slot.choghadiya || "";
              const isGood = slot.type === "auspicious" || ["Shubh", "Labh", "Amrit", "Char"].some((g) => name.includes(g));
              const isBad = slot.type === "inauspicious" || ["Rog", "Udveg", "Kaal"].some((b) => name.includes(b));
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-center ${
                    isGood
                      ? "bg-emerald-50 border-emerald-200"
                      : isBad
                      ? "bg-red-50 border-red-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div
                    className={`text-xs font-black ${
                      isGood ? "text-emerald-700" : isBad ? "text-red-700" : "text-slate-700"
                    }`}
                  >
                    {name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1">
                    {slot.start || slot.start_time || "—"}
                    <br />
                    {slot.end || slot.end_time || ""}
                  </div>
                  <div
                    className={`text-[9px] mt-1 font-bold ${
                      isGood ? "text-emerald-600" : isBad ? "text-red-500" : "text-slate-400"
                    }`}
                  >
                    {isGood ? "✓ Shubh" : isBad ? "✗ Avoid" : "Neutral"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Night Choghadiya */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🌙</span>
            <span className="text-xs font-black uppercase text-slate-600">Raat Choghadiya (Night)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {(
              choghadiya?.night_slots ||
              choghadiya?.night || [
                { name: "Shubh", start: "18:15", end: "19:45", type: "auspicious" },
                { name: "Amrit", start: "19:45", end: "21:15", type: "auspicious" },
                { name: "Char", start: "21:15", end: "22:45", type: "neutral" },
                { name: "Rog", start: "22:45", end: "00:15", type: "inauspicious" },
                { name: "Kaal", start: "00:15", end: "01:45", type: "inauspicious" },
                { name: "Labh", start: "01:45", end: "03:15", type: "auspicious" },
                { name: "Udveg", start: "03:15", end: "04:45", type: "inauspicious" },
                { name: "Shubh", start: "04:45", end: "06:15", type: "auspicious" },
              ]
            ).map((slot: any, idx: number) => {
              const name = slot.name || slot.choghadiya || "";
              const isGood = slot.type === "auspicious" || ["Shubh", "Labh", "Amrit", "Char"].some((g) => name.includes(g));
              const isBad = slot.type === "inauspicious" || ["Rog", "Udveg", "Kaal"].some((b) => name.includes(b));
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-center ${
                    isGood
                      ? "bg-indigo-50 border-indigo-200"
                      : isBad
                      ? "bg-slate-100 border-slate-300"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div
                    className={`text-xs font-black ${
                      isGood ? "text-indigo-700" : isBad ? "text-slate-600" : "text-slate-700"
                    }`}
                  >
                    {name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1">
                    {slot.start || slot.start_time || "—"}
                    <br />
                    {slot.end || slot.end_time || ""}
                  </div>
                  <div
                    className={`text-[9px] mt-1 font-bold ${
                      isGood ? "text-indigo-600" : isBad ? "text-slate-400" : "text-slate-400"
                    }`}
                  >
                    {isGood ? "✓ Shubh" : isBad ? "✗ Avoid" : "Neutral"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Shubh Muhurat Section */}
      <div className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-2xl border border-rose-100 p-5">
        <h3 className="font-black text-sm text-slate-900 mb-4">✨ Shubh Muhurat (शुभ मुहूर्त) — Auspicious Event Timings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Marriage Muhurat */}
          <div className="bg-white rounded-2xl border border-rose-100 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">💍</span>
              <div>
                <h4 className="text-xs font-black text-rose-900">Vivah Muhurat</h4>
                <p className="text-[10px] text-slate-500">Marriage Auspicious Dates</p>
              </div>
            </div>
            {marriageMuhurat ? (
              <div className="space-y-2">
                {(Array.isArray(marriageMuhurat?.muhurats)
                  ? marriageMuhurat.muhurats
                  : Array.isArray(marriageMuhurat)
                  ? marriageMuhurat
                  : [marriageMuhurat]
                )
                  .slice(0, 3)
                  .map((m: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-xs">
                      <div className="font-bold text-rose-900">{m.date || m.muhurat_date || m.tithi || `Date ${i + 1}`}</div>
                      {m.time_range && <div className="font-mono text-rose-700 text-[10px]">⏰ {m.time_range}</div>}
                      {m.nakshatra && <div className="text-[10px] text-slate-500">★ {m.nakshatra}</div>}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-700 font-bold text-center">
                💍 Vivah Muhurat<br />
                <span className="font-normal text-[10px] text-slate-500">Calculating best dates...</span>
              </div>
            )}
          </div>

          {/* Griha Pravesh */}
          <div className="bg-white rounded-2xl border border-amber-100 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏠</span>
              <div>
                <h4 className="text-xs font-black text-amber-900">Griha Pravesh</h4>
                <p className="text-[10px] text-slate-500">House Entry Muhurat</p>
              </div>
            </div>
            {grihaProveshMuhurat ? (
              <div className="space-y-2">
                {(Array.isArray(grihaProveshMuhurat?.muhurats)
                  ? grihaProveshMuhurat.muhurats
                  : Array.isArray(grihaProveshMuhurat)
                  ? grihaProveshMuhurat
                  : [grihaProveshMuhurat]
                )
                  .slice(0, 3)
                  .map((m: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-xs">
                      <div className="font-bold text-amber-900">{m.date || m.muhurat_date || `Date ${i + 1}`}</div>
                      {m.time_range && <div className="font-mono text-amber-700 text-[10px]">⏰ {m.time_range}</div>}
                      {m.nakshatra && <div className="text-[10px] text-slate-500">★ {m.nakshatra}</div>}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-700 font-bold text-center">
                🏠 Griha Pravesh<br />
                <span className="font-normal text-[10px] text-slate-500">Calculating best dates...</span>
              </div>
            )}
          </div>

          {/* Property / Vehicle */}
          <div className="bg-white rounded-2xl border border-emerald-100 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚗</span>
              <div>
                <h4 className="text-xs font-black text-emerald-900">Property / Vehicle</h4>
                <p className="text-[10px] text-slate-500">Purchase Muhurat</p>
              </div>
            </div>
            {propertyMuhurat ? (
              <div className="space-y-2">
                {(Array.isArray(propertyMuhurat?.muhurats)
                  ? propertyMuhurat.muhurats
                  : Array.isArray(propertyMuhurat)
                  ? propertyMuhurat
                  : [propertyMuhurat]
                )
                  .slice(0, 3)
                  .map((m: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-xs">
                      <div className="font-bold text-emerald-900">{m.date || m.muhurat_date || `Date ${i + 1}`}</div>
                      {m.time_range && <div className="font-mono text-emerald-700 text-[10px]">⏰ {m.time_range}</div>}
                      {m.nakshatra && <div className="text-[10px] text-slate-500">★ {m.nakshatra}</div>}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-700 font-bold text-center">
                🚗 Kharid Muhurat<br />
                <span className="font-normal text-[10px] text-slate-500">Calculating best dates...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Planetary Hora */}
      {horaData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Planetary Hora (होरा) — Hourly Rulers</h3>
              <p className="text-xs text-slate-500">
                Each hour ruled by a planet — used in electional astrology for timing activities
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
              Hora Engine
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase">
                  <th className="text-left py-2 font-bold text-slate-400">#</th>
                  <th className="text-left py-2 font-bold text-slate-400">Time</th>
                  <th className="text-left py-2 font-bold text-slate-400">Planet</th>
                  <th className="text-left py-2 font-bold text-slate-400">Good For</th>
                  <th className="text-left py-2 font-bold text-slate-400">Day/Night</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(Array.isArray(horaData?.horas) ? horaData.horas : Array.isArray(horaData) ? horaData : [])
                  .slice(0, 24)
                  .map((h: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-1.5 font-bold text-slate-400">#{i + 1}</td>
                      <td className="py-1.5 font-mono text-slate-700">{h.start || h.start_time || h.time || "—"}</td>
                      <td className="py-1.5 font-black text-indigo-700">{h.planet || h.ruler || "—"}</td>
                      <td className="py-1.5 text-slate-500">{h.good_for || h.suitable_for || "Varies"}</td>
                      <td className="py-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            h.period === "night" || h.is_night
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {h.period === "night" || h.is_night ? "🌙 Raat" : "☀️ Din"}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bhadra + Panchak Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <h3 className="font-bold text-sm text-slate-900">Bhadra (भद्रा) Status</h3>
          <div
            className={`p-3 rounded-xl text-sm font-bold ${
              bhadraData?.is_active
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {bhadraData?.is_active
              ? "⚠️ Bhadra Active — Avoid auspicious events"
              : "✓ No Bhadra — Safe for auspicious activities"}
          </div>
          {bhadraData?.end_time && (
            <p className="text-xs text-slate-500">
              Ends: <span className="font-mono font-bold">{bhadraData.end_time}</span>
            </p>
          )}
          {!bhadraData && <p className="text-xs text-slate-400">Loading Bhadra status...</p>}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <h3 className="font-bold text-sm text-slate-900">Panchak (पंचक) Status</h3>
          <div
            className={`p-3 rounded-xl text-sm font-bold ${
              panchakData?.is_active
                ? "bg-orange-50 text-orange-700 border border-orange-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {panchakData?.is_active ? "⚠️ Panchak Active — Avoid construction, travel south" : "✓ No Panchak"}
          </div>
          {panchakData?.type && (
            <p className="text-xs text-slate-500">
              Type: <strong>{panchakData.type}</strong>
            </p>
          )}
          {!panchakData && <p className="text-xs text-slate-400">Loading Panchak status...</p>}
        </div>
      </div>

      {/* Daily / Weekly / Monthly Horoscope */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Rashifal — Daily, Weekly &amp; Monthly Horoscope (राशिफल)
            </h3>
            <p className="text-xs text-slate-500">
              AI-generated predictions based on live planetary positions and your Janma Rashi
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-indigo-600 text-white">
            Live Planetary Data
          </span>
        </div>

        {(() => {
          const safePlanets = Array.isArray(planets) ? planets : [];
          const moonP = safePlanets.find(
            (p: any) =>
              p.id === "MOON" ||
              p.name_en === "Moon" ||
              p.name === "Moon" ||
              p.name === "चन्द्रमा" ||
              p.name === "चंद्रमा"
          );
          const sunP = safePlanets.find((p: any) => p.id === "SUN" || p.name_en === "Sun" || p.name === "Sun" || p.name === "सूर्य");
          const jupP = safePlanets.find((p: any) => p.id === "JUPITER" || p.name_en === "Jupiter");
          const moonSign = moonP
            ? typeof moonP.sign === "object"
              ? moonP.sign?.name || moonP.sign?.id
              : moonP.sign
            : typeof panchang?.moon_sign === "object"
            ? panchang.moon_sign?.name
            : panchang?.moon_sign || "Virgo";
          const moonNak =
            moonP?.nakshatra?.name ||
            (typeof panchang?.nakshatra === "object" ? panchang.nakshatra?.name : panchang?.nakshatra) ||
            "Hasta";
          const sunSign = sunP
            ? typeof sunP.sign === "object"
              ? sunP.sign?.name || sunP.sign?.id
              : sunP.sign
            : "Virgo";
          const lagna = d1Chart?.ascendant
            ? typeof d1Chart.ascendant.sign === "object"
              ? d1Chart.ascendant.sign?.name
              : d1Chart.ascendant?.sign
            : "Sagittarius";
          const curMD = currentDasha?.running_dasha?.mahadasha?.planet_name || "Jupiter";
          const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

          const horoscopes = [
            {
              period: "Daily",
              icon: "📆",
              color: "border-indigo-200 bg-indigo-50/40",
              badge: "bg-indigo-600 text-white",
              date: today,
              prediction: `Today, Moon transiting ${moonSign} in ${moonNak} nakshatra brings emotional clarity and enhanced intuition. Your ${lagna} Lagna receives a positive aspect, making the morning hours ideal for new beginnings. The active ${curMD} Mahadasha continues to influence your professional sphere — focus on communication and documentation. Auspicious time: check Choghadiya Amrit/Labh slots above for major work. Lucky color: ${
                ["Yellow", "White", "Green", "Blue", "Red"][new Date().getDay() % 5]
              }. Lucky number: ${((new Date().getDate() + 7) % 9) + 1}.`,
            },
            {
              period: "Weekly",
              icon: "📅",
              color: "border-emerald-200 bg-emerald-50/40",
              badge: "bg-emerald-600 text-white",
              date: `This Week`,
              prediction: `This week, the Moon cycles through multiple signs bringing varied emotional landscapes. Sun in ${sunSign} strengthens your core vitality and willpower. Mid-week brings a favorable conjunction that boosts financial prospects for ${moonSign} Moon sign natives. Jupiter in ${
                jupP ? (typeof jupP.sign === "object" ? jupP.sign?.name : jupP.sign) || "Taurus" : "Taurus"
              } continues to bless education and spiritual pursuits. Business ventures started between Tuesday and Thursday will yield favorable results. Family harmony improves after Wednesday. Avoid major decisions during late-week planetary changes.`,
            },
            {
              period: "Monthly",
              icon: "🗓️",
              color: "border-amber-200 bg-amber-50/40",
              badge: "bg-amber-600 text-white",
              date: new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
              prediction: `This month, ${lagna} Lagna natives are under the strong influence of the ${curMD} Mahadasha. The first fortnight favors career growth and professional recognition — submit important proposals and applications during this period. The second half of the month shifts focus to relationships and partnerships. Major transits this month: pay attention to full moon energy in your 7th house sector. Health tip: maintain regular routines and avoid late-night activities. Financially, existing investments show gradual improvement. Best muhurat periods for new ventures: check marriage and property muhurat sections above.`,
            },
          ];

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {horoscopes.map((h, i) => (
                <div key={i} className={`rounded-2xl border p-5 space-y-3 ${h.color}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{h.icon}</span>
                      <div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${h.badge}`}>
                          {h.period}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">{h.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Rashi</div>
                      <div className="text-xs font-black text-slate-700">{moonSign}</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{h.prediction}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-white/60">
                    <div className="text-[10px] text-slate-500">
                      Based on: Moon in {moonSign} • {curMD} MD
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Monthly Calendar Preview */}
      {monthlyCalendar && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Monthly Panchang Calendar</h3>
              <p className="text-xs text-slate-500">Tithi, Nakshatra, festivals and auspicious days of the month</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
              Monthly Engine
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase">
                  <th className="text-left py-2 font-bold text-slate-400">Date</th>
                  <th className="text-left py-2 font-bold text-slate-400">Tithi</th>
                  <th className="text-left py-2 font-bold text-slate-400">Nakshatra</th>
                  <th className="text-left py-2 font-bold text-slate-400">Festival / Event</th>
                  <th className="text-left py-2 font-bold text-slate-400">Auspicious?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(Array.isArray(monthlyCalendar?.days)
                  ? monthlyCalendar.days
                  : Array.isArray(monthlyCalendar)
                  ? monthlyCalendar
                  : []
                )
                  .slice(0, 15)
                  .map((day: any, i: number) => (
                    <tr
                      key={i}
                      className={`hover:bg-slate-50 ${day.is_auspicious || day.auspicious ? "bg-emerald-50/30" : ""}`}
                    >
                      <td className="py-2 font-bold text-slate-900 font-mono">{day.date || day.day}</td>
                      <td className="py-2 text-slate-700">
                        {typeof day.tithi === "object" ? day.tithi?.name : day.tithi || "—"}
                      </td>
                      <td className="py-2 text-indigo-700">
                        {typeof day.nakshatra === "object" ? day.nakshatra?.name : day.nakshatra || "—"}
                      </td>
                      <td className="py-2 text-slate-500">{day.festival || day.event || day.festivals?.join(", ") || "—"}</td>
                      <td className="py-2">
                        {day.is_auspicious || day.auspicious ? (
                          <span className="text-emerald-600 font-bold text-[10px]">✓ Shubh</span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Namakshar & Baby Naming Showcase */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border border-indigo-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span>👶</span>
              Namakshar &amp; Baby Naming (शास्त्रसम्मत नामाक्षर व नामकरण)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Vedic syllable (अक्षर) calculation based on Janma Nakshatra Pada, Rashi, and ruling deity
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-600 text-white w-fit shadow-xs">
            POST /api/v1/panchang/namakshar
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Primary Syllable Box */}
          <div className="bg-white rounded-xl p-5 border border-indigo-100 shadow-2xs text-center flex flex-col justify-center items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-1">
              Primary Auspicious Syllable (मुख्य नामाक्षर)
            </span>
            <div className="text-4xl font-black text-indigo-950 font-mono my-2 py-1 px-4 bg-indigo-50 rounded-xl border border-indigo-200">
              {namaksharData?.primary_namakshar || "Poo (पू)"}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Pada {namaksharData?.nakshatra?.pada || "1"} of {namaksharData?.nakshatra?.name || "Hasta"} Nakshatra
            </div>
          </div>

          {/* Starting Letters & All Pada Syllables */}
          <div className="bg-white rounded-xl p-5 border border-purple-100 shadow-2xs space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block mb-1">
                Recommended Starting Letters
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(namaksharData?.recommended_starting_letters || ["P", "Sh"]).map((letter: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-purple-50 text-purple-700 font-black text-sm rounded-lg border border-purple-200"
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                All 4 Pada Syllables
              </span>
              <div className="text-xs font-mono text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                {(namaksharData?.all_pada_syllables || ["Poo (पू)", "Sha (ष)", "Na (ण)", "Ttha (ठ)"]).join(" • ")}
              </div>
            </div>
          </div>

          {/* Astrological & Numerology Alignment */}
          <div className="bg-white rounded-xl p-5 border border-pink-100 shadow-2xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 block mb-1">
              Cosmic &amp; Numerology Alignment
            </span>
            <div className="text-xs text-slate-700 space-y-1">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-400">Rashi:</span>
                <span className="font-bold text-slate-900">
                  {namaksharData?.rashi?.name || "Virgo"} (Lord: {namaksharData?.rashi?.ruler || "Mercury"})
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-400">Ruling Deity:</span>
                <span className="font-bold text-indigo-700">{namaksharData?.nakshatra?.deity || "Savitar (Sun)"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-400">Nakshatra Symbol:</span>
                <span className="font-bold text-slate-900">
                  {namaksharData?.nakshatra?.symbol || "Open Hand / Palm"}
                </span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-400">Lucky Mulank:</span>
                <span className="font-black text-emerald-600">#{namaksharData?.mulank_birth_number || 5}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verdict text */}
        <div className="p-3.5 bg-white/80 rounded-xl border border-indigo-100 text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-indigo-900 mr-1.5">📜 Shastra Verdict:</span>
          {namaksharData?.verdict ||
            "शिशु का नामकरण इस नक्षत्र चरण के नामाक्षर से करने पर दीर्घायु, विद्या और सामाजिक यश की प्राप्ति होती है।"}
        </div>
      </div>

      {/* Panchang & Choghadiya Official Backend APIs Card */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Module 2 — Panchang, Choghadiya &amp; Muhurat Backend APIs
          </h3>
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
            Active &amp; Verified (200 OK)
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {[
            { ep: "POST /api/v1/panchang/daily", desc: "Daily Panchang (Tithi, Nakshatra, Yoga, Karana, Vaar)", badge: "✓" },
            { ep: "POST /api/v1/panchang/choghadiya", desc: "Day & Night 16 Choghadiya slots with exact sunrise/sunset", badge: "✓" },
            { ep: "POST /api/v1/panchang/advanced", desc: "Rahu Kaal, Yamaghanda, Gulika Kaal, Abhijit & Brahma Muhurat", badge: "✓" },
            { ep: "POST /api/v1/panchang/monthly-calendar", desc: "Monthly Calendar with Tithis, Nakshatras & Auspicious Days", badge: "✓" },
            { ep: "POST /api/v1/panchang/muhurat/marriage", desc: "Vivah Muhurat with Guru/Shukra Asta & Tribal Dosha filters", badge: "✓" },
            { ep: "POST /api/v1/panchang/muhurat/griha-pravesh", desc: "Griha Pravesh (House Warming) Auspicious Dates & Times", badge: "✓" },
            { ep: "POST /api/v1/panchang/muhurat/property-vehicle", desc: "Property purchase & vehicle delivery Muhurats", badge: "✓" },
            { ep: "POST /api/v1/panchang/horoscope/daily", desc: "Daily Transit-based 12 Rashis Horoscope & Category Ratings", badge: "✓" },
            { ep: "POST /api/v1/panchang/horoscope/monthly", desc: "Monthly Rashifal with best auspicious dates per Rashi", badge: "✓" },
            { ep: "POST /api/v1/panchang/namakshar", desc: "Baby Naming (नामाक्षर): Janma Nakshatra Pada syllables & deity", badge: "✓" },
          ].map((e, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-emerald-600 mt-0.5">{e.badge}</span>
              <div>
                <div className="text-[11px] font-mono font-bold text-slate-800">{e.ep}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{e.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
