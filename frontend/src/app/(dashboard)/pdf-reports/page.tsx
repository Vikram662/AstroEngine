"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  FileText, 
  Download, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus,
  Loader2
} from "lucide-react";

interface PdfJobRecord {
  id: string;
  reportType: string;
  name: string;
  language: string;
  status: "COMPLETED" | "PROCESSING" | "FAILED";
  fileUrl?: string;
  createdAt: string;
}

export default function PdfReportsPage() {
  const [jobs, setJobs] = useState<PdfJobRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

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

    try {
      const res = await axios.post("/api/pdf/queue", {
        reportType: "brihat_kundli",
        birthData: {
          dob: "1995-10-05",
          tob: "14:30",
          lat: 24.5854,
          lon: 73.7125,
          tz: 5.5
        },
        lang: "hi"
      });

      const newJob = res.data?.job;
      if (newJob) {
        fetchJobs();
        setGenerationNotice(`New PDF generated successfully! Job ID: ${newJob.job_id}`);
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setGenerationNotice(`Generation failed: ${error.message || "Engine error"}`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationNotice(null), 4000);
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
          onClick={handleGenerateLivePdf}
          disabled={isGenerating}
          className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow flex items-center gap-2 transition disabled:opacity-50 self-start sm:self-auto"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Rendering 80-Page Kundli...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Trigger Live PDF Job</span>
            </>
          )}
        </button>
      </div>

      {generationNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 shadow-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{generationNotice}</span>
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
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4 text-slate-600 font-mono">{job.id}</td>
                  <td className="px-6 py-4 uppercase text-slate-900 font-bold">{job.reportType}</td>
                  <td className="px-6 py-4 font-sans text-slate-900 font-medium">{job.name}</td>
                  <td className="px-6 py-4 uppercase text-slate-600 font-semibold">{job.language}</td>
                  <td className="px-6 py-4">
                    {job.status === "COMPLETED" && (
                      <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 w-max font-sans font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Ready
                      </span>
                    )}
                    {job.status === "PROCESSING" && (
                      <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5 w-max font-sans font-semibold text-[11px]">
                        <Clock className="w-3.5 h-3.5 animate-spin text-amber-700" /> Rendering
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-sans">
                    <a
                      href={job.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </a>
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
