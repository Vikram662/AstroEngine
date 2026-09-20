"use client";

import React from "react";
import { FileDown, Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

interface PdfTabProps {
  pdfJobs: Record<string, any>;
  pdfLoading: Record<string, boolean>;
  generatePdf: (endpoint: string, key: string, payload: any) => Promise<void>;
  openPdfDownload: (jobId: string) => void;
}

export const PdfTab: React.FC<PdfTabProps> = ({
  pdfJobs,
  pdfLoading,
  generatePdf,
  openPdfDownload,
}) => {
  const PDF_REPORTS = [
    {
      key: "kundli_basic",
      title: "Basic Kundli Report",
      hindi: "बेसिक कुंडली रिपोर्ट",
      desc: "Complete birth chart with D1/D9, planets, dashas, and Parashari yogas",
      pages: "15–20 Pages",
      credits: 5,
      endpoint: "/api/v1/pdf/kundli/basic",
      color: "indigo",
      icon: "📄",
    },
    {
      key: "kundli_brihat",
      title: "Grand Brihat Kundli",
      hindi: "बृहत् कुंडली (Grand Report)",
      desc: "Comprehensive 60–100 page report: all vargas, full dasha drill, yogas, remedies, predictions",
      pages: "60–100 Pages",
      credits: 12,
      endpoint: "/api/v1/pdf/kundli/brihat",
      color: "violet",
      icon: "📚",
    },
    {
      key: "matchmaking",
      title: "Kundli Milan Report",
      hindi: "कुंडली मिलान रिपोर्ट",
      desc: "36 Guna Ashtakoot matching, dosha analysis, compatibility score for both profiles",
      pages: "20–30 Pages",
      credits: 8,
      endpoint: "/api/v1/pdf/matching/report",
      color: "rose",
      icon: "💑",
      extraPayload: {
        girl_dob: "1997-04-18",
        girl_tob: "08:15",
        girl_lat: 28.6139,
        girl_lon: 77.209,
        girl_tz: 5.5,
      },
    },
    {
      key: "lalkitab",
      title: "Lal Kitab Full Report",
      hindi: "लाल किताब पूर्ण रिपोर्ट",
      desc: "Complete Lal Kitab analysis with rin (debt) assessment, upay remedies, planet strengths",
      pages: "25–35 Pages",
      credits: 7,
      endpoint: "/api/v1/pdf/lalkitab/full",
      color: "red",
      icon: "📕",
    },
    {
      key: "varshphal",
      title: "Varshphal Annual Report",
      hindi: "वर्षफल वार्षिक रिपोर्ट",
      desc: "Tajik solar return chart, Muntha analysis, Varshesh, annual predictions for 2026",
      pages: "15–20 Pages",
      credits: 6,
      endpoint: "/api/v1/pdf/varshphal/annual",
      color: "amber",
      icon: "📅",
      extraPayload: { target_year: 2026 },
    },
    {
      key: "numerology",
      title: "Numerology Report",
      hindi: "अंक ज्योतिष रिपोर्ट",
      desc: "Life path, destiny, soul urge, Lo Shu grid, lucky numbers and years analysis",
      pages: "10–15 Pages",
      credits: 4,
      endpoint: "/api/v1/pdf/numerology/report",
      color: "emerald",
      icon: "🔢",
    },
  ];

  const colorMap: Record<string, { card: string; btn: string; badge: string; ring: string }> = {
    indigo: { card: "border-indigo-100 bg-indigo-50/30", btn: "bg-indigo-600 hover:bg-indigo-500 text-white", badge: "bg-indigo-100 text-indigo-700", ring: "text-indigo-600" },
    violet: { card: "border-violet-100 bg-violet-50/30", btn: "bg-violet-600 hover:bg-violet-500 text-white", badge: "bg-violet-100 text-violet-700", ring: "text-violet-600" },
    rose: { card: "border-rose-100 bg-rose-50/30", btn: "bg-rose-600 hover:bg-rose-500 text-white", badge: "bg-rose-100 text-rose-700", ring: "text-rose-600" },
    red: { card: "border-red-100 bg-red-50/30", btn: "bg-red-600 hover:bg-red-500 text-white", badge: "bg-red-100 text-red-700", ring: "text-red-600" },
    amber: { card: "border-amber-100 bg-amber-50/30", btn: "bg-amber-600 hover:bg-amber-500 text-white", badge: "bg-amber-100 text-amber-700", ring: "text-amber-600" },
    emerald: { card: "border-emerald-100 bg-emerald-50/30", btn: "bg-emerald-600 hover:bg-emerald-500 text-white", badge: "bg-emerald-100 text-emerald-700", ring: "text-emerald-600" },
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-emerald-100 text-emerald-800",
    FAILED: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <FileDown className="w-6 h-6 text-indigo-400" />
          <div>
            <h2 className="text-lg font-black">White-Label PDF Report Engine</h2>
            <p className="text-slate-400 text-xs mt-0.5">Module 12 — Async background job system. Generate → Poll status → Download PDF</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { label: "Async Jobs", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
            { label: "Background Processing", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
            { label: "White-Label Branding", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
            { label: "Auto-Poll Status", color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
          ].map((b, i) => (
            <span key={i} className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${b.color}`}>{b.label}</span>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <h3 className="font-bold text-sm text-slate-900 mb-3">How it works (3-Step Async Flow)</h3>
        <div className="flex items-center gap-0 flex-wrap">
          {[
            { step: "1", label: "POST /pdf/kundli/basic", desc: "Returns job_id instantly (202)", color: "bg-indigo-50 border-indigo-200" },
            { step: "→", label: "", desc: "", color: "" },
            { step: "2", label: "GET /pdf/status/{job_id}", desc: "Poll until COMPLETED", color: "bg-amber-50 border-amber-200" },
            { step: "→", label: "", desc: "", color: "" },
            { step: "3", label: "GET /pdf/download/{job_id}", desc: "Stream binary PDF", color: "bg-emerald-50 border-emerald-200" },
          ].map((s, i) => s.label ? (
            <div key={i} className={`p-3 rounded-xl border text-center flex-1 min-w-[140px] ${s.color}`}>
              <div className="text-[10px] font-black text-slate-500 mb-0.5">STEP {s.step}</div>
              <div className="text-xs font-bold text-slate-800 font-mono">{s.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{s.desc}</div>
            </div>
          ) : (
            <div key={i} className="text-slate-300 font-bold text-lg px-2">→</div>
          ))}
        </div>
      </div>

      {/* PDF Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {PDF_REPORTS.map((report) => {
          const job = pdfJobs[report.key];
          const isLoading = pdfLoading[report.key];
          const c = colorMap[report.color];

          return (
            <div key={report.key} className={`bg-white rounded-2xl border shadow-xs p-5 space-y-4 ${c.card}`}>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl mb-1">{report.icon}</div>
                  <h3 className="font-black text-sm text-slate-900">{report.title}</h3>
                  <p className="text-[11px] text-slate-500">{report.hindi}</p>
                </div>
                <div className="text-right space-y-1">
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.badge}`}>{report.pages}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{report.credits} credits</div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600">{report.desc}</p>

              {/* Endpoint badge */}
              <div className="bg-slate-900/5 rounded-lg px-3 py-2">
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">API Endpoint</div>
                <div className="text-[10px] font-mono text-slate-700 break-all">{report.endpoint}</div>
              </div>

              {/* Status indicator */}
              {job && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${statusColors[job.status] || "bg-slate-100 text-slate-600"}`}>
                      {(job.status === "PENDING" || job.status === "PROCESSING") && (
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      )}
                      {job.status === "COMPLETED" && <CheckCircle2 className="w-2.5 h-2.5" />}
                      {job.status === "FAILED" && <AlertCircle className="w-2.5 h-2.5" />}
                      {job.status}
                    </span>
                    {job.jobId && (
                      <span className="text-[10px] font-mono text-slate-400 truncate">{job.jobId}</span>
                    )}
                  </div>
                  {job.status === "PROCESSING" && (
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full animate-pulse w-3/4" />
                    </div>
                  )}
                  {job.error && (
                    <p className="text-[11px] text-red-600">{job.error}</p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => generatePdf(report.endpoint, report.key, report.extraPayload || {})}
                  disabled={isLoading}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50 ${c.btn}`}
                >
                  {isLoading ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
                  ) : (
                    <><FileDown className="w-3 h-3" /> Generate PDF</>
                  )}
                </button>

                {job?.status === "COMPLETED" && (
                  <button
                    onClick={() => openPdfDownload(job.jobId)}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition"
                  >
                    <ArrowRight className="w-3 h-3" /> Download
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Module 12 Info */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-sm text-slate-900 mb-3">Module 12 — All PDF Endpoints</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { ep: "POST /api/v1/pdf/kundli/basic", desc: "Endpoint 93 — Basic Kundli (202 Accepted)", badge: "✓" },
            { ep: "POST /api/v1/pdf/kundli/brihat", desc: "Endpoint 94 — Grand Brihat (202 Accepted)", badge: "✓" },
            { ep: "POST /api/v1/pdf/matching/report", desc: "Endpoint 95 — Matchmaking PDF", badge: "✓" },
            { ep: "POST /api/v1/pdf/lalkitab/full", desc: "Endpoint 96 — Lal Kitab PDF", badge: "✓" },
            { ep: "POST /api/v1/pdf/varshphal/annual", desc: "Endpoint 97 — Varshphal PDF", badge: "✓" },
            { ep: "POST /api/v1/pdf/numerology/report", desc: "Endpoint 98 — Numerology PDF", badge: "✓" },
            { ep: "GET /api/v1/pdf/status/{job_id}", desc: "Endpoint 100 — Job Status Poll", badge: "⟳" },
            { ep: "GET /api/v1/pdf/download/{job_id}", desc: "Endpoint 101 — Binary Download", badge: "⬇" },
          ].map((e, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] font-bold text-emerald-600 mt-0.5">{e.badge}</span>
              <div>
                <div className="text-[10px] font-mono font-bold text-slate-800">{e.ep}</div>
                <div className="text-[10px] text-slate-400">{e.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
