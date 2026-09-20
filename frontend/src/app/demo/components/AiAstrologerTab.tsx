"use client";

import React from "react";
import { Bot, Sparkles, Send, Loader2 } from "lucide-react";

interface AiAstrologerTabProps {
  aiQuestion: string;
  setAiQuestion: (q: string) => void;
  aiChatHistory: any[];
  aiChatLoading: boolean;
  aiQuickInsights: any[];
  aiInsightsLoading: boolean;
  onAskQuestion: (customQ?: string, customCat?: string) => void;
  onFetchQuickInsights: () => void;
}

// Helper to cleanly parse and render markdown **bold** text into styled strong tags
export const renderFormattedMarkdown = (text: string) => {
  if (!text) return null;
  const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
  return paragraphs.map((para, pIdx) => {
    const parts = para.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={pIdx} className="leading-relaxed">
        {parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            const cleanBold = part.slice(2, -2);
            return (
              <strong key={i} className="font-bold text-slate-900 bg-amber-50 text-indigo-950 px-1 py-0.5 rounded border border-amber-200/60 mx-0.5">
                {cleanBold}
              </strong>
            );
          }
          return part;
        })}
      </p>
    );
  });
};

export const AiAstrologerTab: React.FC<AiAstrologerTabProps> = ({
  aiQuestion,
  setAiQuestion,
  aiChatHistory,
  aiChatLoading,
  aiQuickInsights,
  aiInsightsLoading,
  onAskQuestion,
  onFetchQuickInsights
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-950 via-purple-900 to-slate-950 text-white p-6 sm:p-8 border border-indigo-500/20 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                AI Kundli Synthesis Engine
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                D1 + Dasha + Gochar
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-3 flex items-center gap-2">
              <span>🤖 AI ज्योतिषी से पूछें सवाल (Interactive AI Astrologer)</span>
            </h2>
            <p className="text-indigo-200/80 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              आपकी वास्तविक लग्न कुंडली (D1), वर्तमान विंशोत्तरी महादशा/अंतर्दशा और संबंधित भाव के स्वामी की स्थिति का सटीक विश्लेषण करके प्राकृतिक भाषा में उत्तर और अनुकूल समय प्रदान करता है।
            </p>
          </div>

          <button
            onClick={onFetchQuickInsights}
            disabled={aiInsightsLoading}
            className="px-5 py-3 rounded-2xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 shrink-0"
          >
            {aiInsightsLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-900" /> : <Sparkles className="w-4 h-4 text-slate-950" />}
            <span>5 प्रमुख क्षेत्रों का सम्पूर्ण ब्लूप्रिंट</span>
          </button>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
            लोकप्रिय प्रश्न (Quick Suggested Prompts)
          </h3>
          <span className="text-[11px] text-slate-400">क्लिक करके तुरंत उत्तर पाएं</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { q: "मेरी नौकरी में पदोन्नति और करियर में आगे क्या योग हैं?", cat: "career", icon: "💼" },
            { q: "विवाह के योग कब बन रहे हैं और जीवनसाथी कैसा होगा?", cat: "marriage", icon: "💍" },
            { q: "मेरी आर्थिक स्थिति और धन लाभ के क्या योग हैं?", cat: "wealth", icon: "💰" },
            { q: "स्वास्थ्य और ऊर्जा के संबंध में क्या सावधानियां रखनी चाहिए?", cat: "health", icon: "🧘" },
            { q: "क्या मेरी कुंडली में विदेश यात्रा या पीआर के योग हैं?", cat: "foreign", icon: "✈️" },
            { q: "क्या नया व्यापार या स्टार्टअप शुरू करना अनुकूल रहेगा?", cat: "career", icon: "🚀" }
          ].map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => onAskQuestion(prompt.q, prompt.cat)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 border border-slate-200 hover:border-indigo-300 transition flex items-center gap-1.5 shadow-2xs"
            >
              <span>{prompt.icon}</span>
              <span>{prompt.q}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex gap-2 pt-2">
          <input
            type="text"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onAskQuestion();
            }}
            placeholder="अपना व्यक्तिगत ज्योतिषीय प्रश्न यहाँ टाइप करें..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 font-medium focus:bg-white focus:border-indigo-500 outline-hidden transition"
          />
          <button
            onClick={() => onAskQuestion()}
            disabled={aiChatLoading}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {aiChatLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
            <span>पूछें</span>
          </button>
        </div>
      </div>

      {/* Answers Stream */}
      {aiChatHistory.length > 0 ? (
        <div className="space-y-5">
          {aiChatHistory.map((ans, aIdx) => (
            <div key={aIdx} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {ans.category_title}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">
                    "{ans.query}"
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">अनुकूलता स्कोर:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                    ans.auspicious_score >= 75 ? "bg-emerald-100 text-emerald-800" : (ans.auspicious_score >= 60 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800")
                  }`}>
                    {ans.auspicious_score}% Auspicious
                  </span>
                </div>
              </div>

              {/* Astrological Breakdown */}
              {ans.astrological_breakdown && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block">लग्न व राशि</span>
                    <strong className="text-slate-900 font-bold">{ans.astrological_breakdown.ascendant}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block">विश्लेषित भाव</span>
                    <strong className="text-indigo-700 font-bold">{ans.astrological_breakdown.primary_house_analyzed} ({ans.astrological_breakdown.house_sign})</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block">भावेश स्थिति</span>
                    <strong className="text-slate-900 font-bold">{ans.astrological_breakdown.house_lord} in {ans.astrological_breakdown.house_lord_placement}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-900">
                    <span className="text-[10px] text-purple-600 font-bold block">सक्रिय दशा काल</span>
                    <strong className="font-bold">{ans.astrological_breakdown.running_mahadasha} / {ans.astrological_breakdown.running_antardasha}</strong>
                  </div>
                </div>
              )}

              {/* Formatted Markdown Body */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed space-y-2.5">
                {renderFormattedMarkdown(ans.prediction_answer)}
              </div>

              {/* Timing & Remedy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <span>⏳</span>
                    <span>शुभ समय व स्वर्णिम काल (Favorable Window):</span>
                  </span>
                  <p className="text-amber-800 font-medium leading-relaxed">
                    {ans.favorable_timing}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <span>📿</span>
                    <span>शास्त्रीय वैदिक उपाय (Prescribed Remedy):</span>
                  </span>
                  <p className="text-emerald-800 font-medium leading-relaxed">
                    {ans.prescribed_remedy}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs space-y-2">
          <Bot className="w-8 h-8 text-indigo-500 mx-auto" />
          <p className="font-semibold text-slate-700">ऊपर दिए गए प्रश्नों में से कोई प्रश्न चुनें या अपना सवाल टाइप करें।</p>
          <p className="text-slate-400">AI ज्योतिषी आपकी D1 कुंडली, दशा और गोचर का संश्लेषण करके तुरंत उत्तर देगा।</p>
        </div>
      )}

      {/* 5 Life Pillars Multi-Report Section */}
      {aiQuickInsights && aiQuickInsights.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>5 Life Pillars Comprehensive Astrological Blueprint</span>
              </h3>
              <p className="text-xs text-slate-500">Career, Marriage, Wealth, Health, and Foreign Travel synthesis</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-900 text-white">
              Complete Blueprint
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiQuickInsights.map((pillar: any, pIdx: number) => (
              <div key={pIdx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-bold text-indigo-700">{pillar.category_title}</strong>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-100 text-indigo-900">
                      {pillar.auspicious_score}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed space-y-1">
                    {renderFormattedMarkdown(pillar.prediction_answer)}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 text-[11px] space-y-1">
                  <div className="text-amber-800 font-medium">⏳ {pillar.favorable_timing}</div>
                  <div className="text-emerald-800 font-medium">📿 {pillar.prescribed_remedy}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
