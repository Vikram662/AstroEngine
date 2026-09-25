"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  X
} from "lucide-react";
import { BirthDataFields, DEFAULT_BIRTH_DATA, type BirthDataValue } from "@/components/calculators/BirthDataFields";

interface PdfJobRecord {
  id: string;
  reportType: string;
  subjectName: string | null;
  language: string;
  status: "COMPLETED" | "PROCESSING" | "PENDING" | "FAILED";
  fileUrl?: string;
  createdAt: string;
}

const REPORT_TYPES: { value: string; label: string }[] = [
  { value: "kundli_basic", label: "Basic Kundli (15-20 pages)" },
  { value: "kundli_brihat", label: "Brihat Kundli (60-100 pages)" },
  { value: "matching_report", label: "Matchmaking Dossier" },
  { value: "lalkitab_full", label: "Lal Kitab Full Report" },
  { value: "varshphal_annual", label: "Varshphal (Annual Chart)" },
  { value: "numerology_report", label: "Numerology Report" },
  { value: "sadesati_guide", label: "Sade Sati Guide" }
];

export default function PdfReportsPage() {
  const [jobs, setJobs] = useState<PdfJobRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [reportType, setReportType] = useState("kundli_brihat");
  const [birthData, setBirthData] = useState<BirthDataValue>(DEFAULT_BIRTH_DATA);
  const [lang, setLang] = useState<"hi" | "en">("hi");
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [bride, setBride] = useState<BirthDataValue>({ ...DEFAULT_BIRTH_DATA, gender: "female" });

  const fetchJobs = () => {
    axios.get("/api/pdf/queue")
      .then(res => {
        if (res.data?.jobs) {
          setJobs(res.data.jobs);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleGenerateLivePdf = async () => {
    setIsGenerating(true);
    setGenerationNotice(null);

    const payload: Record<string, unknown> = {
      dob: birthData.dob,
      tob: birthData.tob,
      lat: birthData.lat,
      lon: birthData.lon,
      tz: birthData.tz
    };
    if (reportType === "matching_report") {
      payload.girl_dob = bride.dob;
      payload.girl_tob = bride.tob;
      payload.girl_lat = bride.lat;
      payload.girl_lon = bride.lon;
      payload.girl_tz = bride.tz;
    }
    if (reportType === "varshphal_annual") {
      payload.target_year = targetYear;
    }

    try {
      const res = await axios.post("/api/pdf/queue", {
        reportType,
        subjectName: birthData.name,
        birthData: payload,
        lang
      });

      const newJob = res.data?.job;
      if (newJob) {
        fetchJobs();
        setGenerationNotice(`New PDF generated successfully! Job ID: ${newJob.job_id}`);
        setFormOpen(false);
      } else {
        setGenerationNotice(`Generation failed: ${res.data?.message || "Engine error"}`);
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setGenerationNotice(`Generation failed: ${error.message || "Engine error"}`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationNotice(null), 6000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">White-Label PDF Engine</h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Real-time async pipeline rendering Jinja2 templates, embedded SVG charts, and automated Cloudflare R2 uploads.
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow flex items-center gap-2 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New PDF Report</span>
        </button>
      </div>

      {generationNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 shadow-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{generationNotice}</span>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-bold text-sm text-slate-900">Generate PDF Report</h3>
              <button onClick={() => setFormOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                >
                  {REPORT_TYPES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <BirthDataFields
                value={birthData}
                onChange={setBirthData}
                personLabel={reportType === "matching_report" ? "Groom" : undefined}
              />

              {reportType === "matching_report" && (
                <div className="pt-2 border-t border-slate-200">
                  <BirthDataFields
                    value={bride}
                    onChange={setBride}
                    personLabel="Bride"
                    idPrefix="p2_"
                  />
                </div>
              )}

              {reportType === "varshphal_annual" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Target Year</label>
                  <input
                    type="number"
                    value={targetYear}
                    onChange={(e) => setTargetYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Report Language</label>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as "hi" | "en")}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                >
                  <option value="hi">Hindi</option>
                  <option value="en">English</option>
                </select>
              </div>

              <button
                onClick={handleGenerateLivePdf}
                disabled={isGenerating || !birthData.dob}
                className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering PDF...</span>
                  </>
                ) : (
                  <span>Generate Report</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">Job Execution Queue & Downloads</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-sans font-bold">
              <tr>
                <th className="px-6 py-3.5">Job ID</th>
                <th className="px-6 py-3.5">Report Type</th>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Language</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center font-sans text-slate-400">
                    No reports generated yet — click &quot;New PDF Report&quot; to create one.
                  </td>
                </tr>
              ) : jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4 text-slate-600 font-mono">{job.id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 uppercase text-slate-900 font-bold">{job.reportType}</td>
                  <td className="px-6 py-4 font-sans text-slate-900 font-medium">{job.subjectName || "—"}</td>
                  <td className="px-6 py-4 uppercase text-slate-600 font-semibold">{job.language}</td>
                  <td className="px-6 py-4">
                    {job.status === "COMPLETED" && (
                      <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 w-max font-sans font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Ready
                      </span>
                    )}
                    {(job.status === "PROCESSING" || job.status === "PENDING") && (
                      <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5 w-max font-sans font-semibold text-[11px]">
                        <Clock className="w-3.5 h-3.5 animate-spin text-amber-700" /> Rendering
                      </span>
                    )}
                    {job.status === "FAILED" && (
                      <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5 w-max font-sans font-semibold text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-700" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-sans">
                    {job.fileUrl ? (
                      <a
                        href={job.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
