"use client";

import React, { useState } from "react";
import axios from "axios";
import { Play, Copy, Check, Terminal, Loader2, AlertCircle } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";

type PlaygroundTab = "kundli" | "panchang" | "matching";

const TEMPLATES: Record<PlaygroundTab, { endpoint: string; json: string }> = {
  kundli: {
    endpoint: "/api/v1/parashari/chart/d1",
    json: JSON.stringify(
      {
        dob: "1995-10-05",
        tob: "14:30",
        lat: 24.5854,
        lon: 73.7125,
        tz: 5.5,
        lang: "en"
      },
      null,
      2
    )
  },
  panchang: {
    endpoint: "/api/v1/panchang/daily",
    json: JSON.stringify(
      {
        dob: "2026-09-16",
        tob: "06:00",
        lat: 28.6139,
        lon: 77.209,
        tz: 5.5,
        lang: "hi"
      },
      null,
      2
    )
  },
  matching: {
    endpoint: "/api/v1/matchmaking/ashtakoota",
    json: JSON.stringify(
      {
        boy: {
          dob: "1994-08-12",
          tob: "10:15",
          lat: 28.6139,
          lon: 77.209,
          tz: 5.5
        },
        girl: {
          dob: "1996-03-24",
          tob: "18:45",
          lat: 19.076,
          lon: 72.8777,
          tz: 5.5
        },
        lang: "en"
      },
      null,
      2
    )
  }
};

export const LivePlayground = () => {
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<PlaygroundTab>("kundli");
  const [selectedLang, setSelectedLang] = useState<"hi" | "en">(locale);
  const [inputJson, setInputJson] = useState<string>(() => {
    try {
      const obj = JSON.parse(TEMPLATES["kundli"].json);
      obj.lang = locale;
      return JSON.stringify(obj, null, 2);
    } catch {
      return TEMPLATES["kundli"].json;
    }
  });
  const [responseJson, setResponseJson] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const updateJsonLang = (jsonStr: string, lang: "hi" | "en") => {
    try {
      const obj = JSON.parse(jsonStr);
      obj.lang = lang;
      return JSON.stringify(obj, null, 2);
    } catch {
      return jsonStr;
    }
  };

  const handleTabChange = (tab: PlaygroundTab) => {
    setActiveTab(tab);
    setInputJson(updateJsonLang(TEMPLATES[tab].json, selectedLang));
    setError(null);
  };

  const handleLangChange = (lang: "hi" | "en") => {
    setSelectedLang(lang);
    setInputJson(prev => updateJsonLang(prev, lang));
  };

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const parsedPayload = JSON.parse(inputJson);
      parsedPayload.lang = selectedLang;
      const res = await axios.post("/api/playground", {
        endpoint: TEMPLATES[activeTab].endpoint,
        payload: parsedPayload
      });
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      setResponseJson(res.data);
    } catch (err: unknown) {
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        errorObj.response?.data?.message ||
          errorObj.message ||
          "JSON parse error or calculation backend unreachable."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!responseJson) return;
    navigator.clipboard.writeText(JSON.stringify(responseJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="playground" className="py-16 border-t border-line bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
          <div>
            <div className="text-xs font-mono-brand font-medium text-ink-muted uppercase tracking-wider">
              Interactive Test Console
            </div>
            <h2 className="font-display text-2xl font-medium tracking-tight text-ink mt-1">
              Test live calculations
            </h2>
            <p className="text-ink-soft text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              Modify the JSON request below to inspect real-time outputs from the Swiss Ephemeris calculation engine.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start">
            <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-lg border border-line">
              <button
                type="button"
                onClick={() => handleLangChange("hi")}
                className={`px-2.5 py-1 text-xs font-medium rounded transition ${
                  selectedLang === "hi"
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => handleLangChange("en")}
                className={`px-2.5 py-1 text-xs font-medium rounded transition ${
                  selectedLang === "en"
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                English
              </button>
            </div>

            <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-lg border border-line">
              <button
                onClick={() => handleTabChange("kundli")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  activeTab === "kundli"
                    ? "bg-card text-ink shadow-sm border border-line"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                Lagna Kundli (D1)
              </button>
              <button
                onClick={() => handleTabChange("panchang")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  activeTab === "panchang"
                    ? "bg-card text-ink shadow-sm border border-line"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                Daily Panchang
              </button>
              <button
                onClick={() => handleTabChange("matching")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  activeTab === "matching"
                    ? "bg-card text-ink shadow-sm border border-line"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                36-Guna Milan
              </button>
            </div>
          </div>
        </div>

        {/* Dark contextual code console — the one deliberately dark moment on the page */}
        <div className="grid grid-cols-1 lg:grid-cols-2 rounded-md border border-stone-800 bg-stone-900 overflow-hidden shadow-sm">
          {/* Request Panel (Left) */}
          <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-stone-800">
            <div className="flex items-center justify-between px-4 py-2.5 bg-stone-800/60 border-b border-stone-800 text-xs font-mono-brand">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
                  POST
                </span>
                <span className="text-stone-400 text-[11px] truncate">{TEMPLATES[activeTab].endpoint}</span>
              </div>
              <button
                onClick={handleExecute}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-accent hover:bg-accent-hover text-accent-foreground font-brand font-medium text-xs transition disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Send Request</span>
              </button>
            </div>

            <div className="p-3 flex-1 flex flex-col">
              <label className="text-[11px] font-mono-brand text-stone-500 uppercase tracking-wider mb-2">
                Request Body (JSON)
              </label>
              <textarea
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
                className="w-full h-80 bg-stone-950/60 border border-stone-800 rounded-md p-3 font-mono-brand text-xs text-stone-200 focus:outline-none focus:border-stone-600 resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Response Panel (Right) */}
          <div className="flex flex-col bg-stone-950/30">
            <div className="flex items-center justify-between px-4 py-2.5 bg-stone-800/60 border-b border-stone-800 text-xs font-mono-brand">
              <div className="flex items-center gap-3">
                <span className="text-stone-400 font-brand text-xs">Response</span>
                {latencyMs !== null && (
                  <span className="text-[11px] text-stone-400 bg-stone-800 px-2 py-0.5 rounded border border-stone-700">
                    {latencyMs}ms
                  </span>
                )}
              </div>
              {responseJson ? (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-stone-500 hover:text-stone-200 transition font-brand text-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              ) : null}
            </div>

            <div className="p-3 flex-1 overflow-auto max-h-[380px] font-mono-brand text-xs">
              {error ? (
                <div className="p-3 rounded border border-red-900 bg-red-950/40 text-red-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold font-brand text-xs">Request Failed</div>
                    <div className="text-[11px] mt-0.5 text-red-400">{error}</div>
                  </div>
                </div>
              ) : responseJson ? (
                <pre className="text-stone-300 leading-relaxed text-[11px]">
                  {JSON.stringify(responseJson, null, 2)}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-stone-600 py-20 font-brand text-xs text-center">
                  <Terminal className="w-6 h-6 text-stone-700 mb-2 stroke-[1.5]" />
                  <p>Click &quot;Send Request&quot; to inspect real-time JSON response</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
