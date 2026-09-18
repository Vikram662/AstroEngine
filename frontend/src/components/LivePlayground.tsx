"use client";

import React, { useState } from "react";
import axios from "axios";
import { Play, Copy, Check, Terminal, Loader2, AlertCircle } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<PlaygroundTab>("kundli");
  const [inputJson, setInputJson] = useState<string>(TEMPLATES["kundli"].json);
  const [responseJson, setResponseJson] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const handleTabChange = (tab: PlaygroundTab) => {
    setActiveTab(tab);
    setInputJson(TEMPLATES[tab].json);
    setError(null);
  };

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const parsedPayload = JSON.parse(inputJson);
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
    <section id="playground" className="py-16 border-t border-zinc-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
          <div>
            <div className="text-xs font-mono font-medium text-zinc-500 uppercase tracking-wider">
              Interactive Test Console
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mt-1">
              Test Live Calculations
            </h2>
            <p className="text-zinc-600 text-xs sm:text-sm mt-1 max-w-xl">
              Modify the JSON request below to inspect real-time outputs from the Swiss Ephemeris calculation engine.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200 self-start">
            <button
              onClick={() => handleTabChange("kundli")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                activeTab === "kundli"
                  ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/80"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Lagna Kundli (D1)
            </button>
            <button
              onClick={() => handleTabChange("panchang")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                activeTab === "panchang"
                  ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/80"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Daily Panchang
            </button>
            <button
              onClick={() => handleTabChange("matching")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                activeTab === "matching"
                  ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/80"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              36-Guna Milan
            </button>
          </div>
        </div>

        {/* Clean Light Console Box */}
        <div className="grid grid-cols-1 lg:grid-cols-2 rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          {/* Request Panel (Left) */}
          <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-zinc-200">
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  POST
                </span>
                <span className="text-zinc-600 text-[11px] truncate">{TEMPLATES[activeTab].endpoint}</span>
              </div>
              <button
                onClick={handleExecute}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-sans font-medium text-xs transition disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Send Request</span>
              </button>
            </div>

            <div className="p-3 flex-1 flex flex-col bg-white">
              <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                Request Body (JSON)
              </label>
              <textarea
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
                className="w-full h-80 bg-zinc-50/70 border border-zinc-200 rounded-md p-3 font-mono text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 focus:bg-white resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Response Panel (Right) */}
          <div className="flex flex-col bg-zinc-50/40">
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-zinc-600 font-sans text-xs">Response</span>
                {latencyMs !== null && (
                  <span className="text-[11px] text-zinc-600 bg-white px-2 py-0.5 rounded border border-zinc-200">
                    {latencyMs}ms
                  </span>
                )}
              </div>
              {responseJson ? (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-zinc-500 hover:text-zinc-800 transition font-sans text-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              ) : null}
            </div>

            <div className="p-3 flex-1 overflow-auto max-h-[380px] font-mono text-xs">
              {error ? (
                <div className="p-3 rounded border border-rose-200 bg-rose-50 text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold font-sans text-xs">Request Failed</div>
                    <div className="text-[11px] mt-0.5 text-rose-700">{error}</div>
                  </div>
                </div>
              ) : responseJson ? (
                <pre className="text-zinc-800 leading-relaxed text-[11px]">
                  {JSON.stringify(responseJson, null, 2)}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 py-20 font-sans text-xs text-center">
                  <Terminal className="w-6 h-6 text-zinc-300 mb-2 stroke-[1.5]" />
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
