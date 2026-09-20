"use client";

import React from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface TarotTabProps {
  tarotQuestion: string;
  setTarotQuestion: (q: string) => void;
  tarotSpreadMode: "daily" | "3_card_time" | "3_card_mind" | "celtic_cross";
  setTarotSpreadMode: (m: "daily" | "3_card_time" | "3_card_mind" | "celtic_cross") => void;
  tarotLoading: boolean;
  tarotDailyResult: any;
  tarot3CardResult: any;
  tarotCelticResult: any;
  onDrawTarot: (mode?: any, customQ?: string) => void;
}

export const TarotTab: React.FC<TarotTabProps> = ({
  tarotQuestion,
  setTarotQuestion,
  tarotSpreadMode,
  setTarotSpreadMode,
  tarotLoading,
  tarotDailyResult,
  tarot3CardResult,
  tarotCelticResult,
  onDrawTarot
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-violet-950 via-purple-900 to-indigo-950 text-white p-6 sm:p-8 border border-purple-500/20 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30">
                78 Cards Arcana Suite
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                Upright &amp; Reversed
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-3 flex items-center gap-2">
              <span>✨ टैरो कार्ड मार्गदर्शन (Tarot Card Reading Suite)</span>
            </h2>
            <p className="text-purple-200/80 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              रहस्यमयी टैरो कार्ड्स के माध्यम से अपने अंतर्मन, वर्तमान ऊर्जा और भविष्य की संभावनाओं का आध्यात्मिक मार्गदर्शन प्राप्त करें।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            <button
              onClick={() => onDrawTarot("daily")}
              disabled={tarotLoading}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>दैनिक कार्ड (Daily Draw)</span>
            </button>
            <button
              onClick={() => onDrawTarot("3_card_time")}
              disabled={tarotLoading}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 disabled:opacity-50"
            >
              <span>3-कार्ड स्प्रेड (Past-Present-Future)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Spread Selector & Question Input Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">स्प्रेड का प्रकार चुनें (Select Spread Type)</h3>
            <p className="text-xs text-slate-500">कार्ड्स की स्थिति आपके प्रश्न के विभिन्न पहलुओं को प्रकट करती है</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: "daily", label: "🔮 दैनिक मार्गदर्शन (Daily 1-Card)" },
              { id: "3_card_time", label: "⏳ भूत-वर्तमान-भविष्य (3-Card Time)" },
              { id: "3_card_mind", label: "🧘 मन-तन-आत्मा (Mind-Body-Spirit)" },
              { id: "celtic_cross", label: "✝️ केल्टिक क्रॉस (10-Card Celtic Cross)" }
            ].map(sp => (
              <button
                key={sp.id}
                onClick={() => {
                  setTarotSpreadMode(sp.id as any);
                  onDrawTarot(sp.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  tarotSpreadMode === sp.id
                    ? "bg-purple-900 text-purple-100 ring-2 ring-purple-500/50 shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
          <input
            type="text"
            value={tarotQuestion}
            onChange={(e) => setTarotQuestion(e.target.value)}
            placeholder="अपना प्रश्न या मन का भाव यहाँ लिखें (उदा. क्या मुझे नई नौकरी में सफलता मिलेगी?)"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 font-medium focus:bg-white focus:border-purple-500 outline-hidden"
          />
          <button
            onClick={() => onDrawTarot(tarotSpreadMode, tarotQuestion)}
            disabled={tarotLoading}
            className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
          >
            {tarotLoading ? <Loader2 className="w-4 h-4 animate-spin text-purple-200" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
            <span>कार्ड्स शफल करें व निकालें</span>
          </button>
        </div>
      </div>

      {/* Display Result: Daily Card */}
      {tarotSpreadMode === "daily" && tarotDailyResult && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Daily Cosmic Guidance</span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">{tarotDailyResult.question}</h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
              {tarotDailyResult.card.position_title_hi}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Tarot Card Visual Graphic */}
            <div className="mx-auto w-56 h-88 rounded-2xl bg-linear-to-b from-indigo-950 via-purple-900 to-slate-950 text-amber-100 p-4 border-2 border-amber-400/40 shadow-2xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(217,119,6,0.15),transparent_70%)]"></div>
              
              <div className="flex items-center justify-between text-[11px] font-mono text-amber-300/80 z-10">
                <span>{tarotDailyResult.card.arcana?.toUpperCase()}</span>
                <span>{tarotDailyResult.card.element || "COSMIC"}</span>
              </div>

              <div className="text-center my-auto z-10 space-y-2">
                <div className="w-20 h-20 mx-auto rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-3xl shadow-inner">
                  {tarotDailyResult.card.is_reversed ? "🔄" : "✨"}
                </div>
                <div className="font-serif font-black text-lg text-amber-200 tracking-wide">
                  {tarotDailyResult.card.name}
                </div>
                <div className="text-xs text-amber-100/80 font-medium">
                  {tarotDailyResult.card.name_hi}
                </div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  tarotDailyResult.card.is_reversed 
                    ? "bg-rose-500/20 text-rose-300 border border-rose-400/30" 
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                }`}>
                  {tarotDailyResult.card.is_reversed ? "उल्टा (Reversed)" : "सीधा (Upright)"}
                </span>
              </div>

              <div className="text-center text-[10px] text-amber-300/60 font-mono z-10 border-t border-amber-400/20 pt-2">
                AstroEngine Tarot Suite
              </div>
            </div>

            {/* Interpretation & Guidance Details */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {tarotDailyResult.card.keywords_hi?.map((kw: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    #{kw}
                  </span>
                ))}
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">कार्ड का गूढ़ अर्थ (Core Meaning)</h4>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {tarotDailyResult.card.meaning_hi}
                </p>
                <p className="text-xs text-slate-500 italic mt-1.5">
                  "{tarotDailyResult.card.meaning}"
                </p>
              </div>

              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>दैवीय सलाह (Spiritual Advice)</span>
                </h4>
                <p className="text-xs sm:text-sm text-amber-950 font-semibold leading-relaxed">
                  {tarotDailyResult.card.advice_hi}
                </p>
                <p className="text-xs text-amber-800/80 italic mt-1">
                  "{tarotDailyResult.card.advice}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Display Result: 3-Card Spread */}
      {tarotSpreadMode.startsWith("3_card") && tarot3CardResult && (
        <div className="space-y-6">
          <div className="bg-purple-950 text-purple-100 p-5 rounded-2xl border border-purple-800 shadow-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Spread Synthesis</span>
            <h3 className="text-base font-bold text-white mt-1">{tarot3CardResult.question}</h3>
            <p className="text-xs sm:text-sm text-purple-200/90 mt-2 leading-relaxed">
              {tarot3CardResult.synthesis_hi}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {tarot3CardResult.cards?.map((card: any, idx: number) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col">
                <div className="bg-slate-900 text-white p-3.5 text-center border-b border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    {card.position_title}
                  </span>
                  <h4 className="text-sm font-black mt-0.5">{card.position_title_hi}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{card.position_desc}</p>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-purple-600">{card.arcana?.toUpperCase()}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        card.is_reversed 
                          ? "bg-rose-100 text-rose-800 border border-rose-200" 
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}>
                        {card.is_reversed ? "🔄 उल्टा (Reversed)" : "✨ सीधा (Upright)"}
                      </span>
                    </div>

                    <h5 className="font-serif font-black text-base text-slate-900">{card.name}</h5>
                    <div className="text-xs font-bold text-slate-500">{card.name_hi}</div>

                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {card.keywords_hi?.slice(0, 3).map((kw: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          #{kw}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed mt-3 pt-2 border-t border-slate-100 font-medium">
                      {card.meaning_hi}
                    </p>
                  </div>

                  <div className="bg-amber-50/80 rounded-xl p-3 border border-amber-200/80">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">सलाह:</span>
                    <p className="text-xs text-amber-950 font-semibold mt-0.5">
                      {card.advice_hi}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display Result: Celtic Cross 10-Card Spread */}
      {tarotSpreadMode === "celtic_cross" && tarotCelticResult && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Master 10-Card Celtic Cross</span>
                <h3 className="text-lg font-black mt-0.5">{tarotCelticResult.question}</h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Ultimate Outcome</span>
                <span className="text-sm font-bold text-amber-300">{tarotCelticResult.ultimate_outcome_hi}</span>
              </div>
            </div>
            <div className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              🎯 <strong className="text-white">केंद्रीय स्थिति व टकराव:</strong> {tarotCelticResult.core_conflict_hi}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {tarotCelticResult.cards?.map((card: any, idx: number) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:shadow-sm transition flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">
                    {card.position_title_hi}
                  </div>
                  <div className="font-serif font-black text-sm text-slate-900 mt-1">
                    {card.name}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    {card.name_hi}
                  </div>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase mt-1 ${
                    card.is_reversed ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {card.is_reversed ? "Reversed" : "Upright"}
                  </span>
                  <p className="text-[11px] text-slate-600 mt-2 line-clamp-3">
                    {card.meaning_hi}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] font-semibold text-amber-800 bg-amber-50/60 p-1.5 rounded">
                  💡 {card.advice_hi}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
