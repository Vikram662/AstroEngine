"use client";

import React, { useEffect, useState } from "react";
import { 
  FileText, 
  RotateCw, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink,
  HardDrive,
  AlertCircle
} from "lucide-react";

interface PdfJob {
  id: string;
  userId: string;
  userEmail: string;
  reportType: string;
  language: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  fileUrl?: string;
  creditsCost: number;
  failureReason?: string;
  refunded: boolean;
  createdAt: string;
}

export default function AdminPdfQueuePage() {
  const [jobs, setJobs] = useState<PdfJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/admin/data?type=pdf_queue");
      const json = await res.json();
      if (json.status === "success") {
        setJobs(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleRetryJob = async (jobId: string) => {
    setActionLoading(jobId);
    try {
      // simulate retry trigger or queue dispatch
      await new Promise(r => setTimeout(r, 1000));
      fetchJobs();
    } finally {
      setActionLoading(null);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    const matchesStatus = statusFilter === "all" || j.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch = 
      j.reportType.toLowerCase().includes(search.toLowerCase()) ||
      j.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      j.id.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = jobs.filter(j => j.status === "PENDING").length;
  const processingCount = jobs.filter(j => j.status === "PROCESSING").length;
  const failedCount = jobs.filter(j => j.status === "FAILED").length;
  const completedCount = jobs.filter(j => j.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">PDF Job Queue Monitor (§8.3.5)</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-purple-100 text-purple-800 rounded border border-purple-200">
              WORKER PIPELINE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track WeasyPrint compilation tasks, inspect Cloudflare R2 presigned exports, and manage stuck jobs.
          </p>
        </div>

        <button
          onClick={fetchJobs}
          disabled={loading}
          className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 text-xs font-medium flex items-center gap-2 shadow-xs transition"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Sync Queue</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">In Queue (Pending)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">{pendingCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Awaiting worker thread</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Compiling</span>
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">{processingCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">WeasyPrint rendering</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Completed (24h)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">{completedCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">R2 Presigned URLs live</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Failed / Refunded</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">{failedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Auto-refunded via §12.6</div>
        </div>
      </div>

      {/* R2 Storage Status Notice (§5 / §8.3.5) */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2.5">
          <HardDrive className="w-4 h-4 text-slate-500" />
          <span>
            <strong>Cloudflare R2 Object Storage:</strong> Auto-lifecycle set to 24-hr expiry (§5). Zero egress cost active.
          </span>
        </div>
        <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
          Bucket: astroengine-reports
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search report, tenant, or job ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Report Type</th>
                <th className="py-3 px-4">Tenant</th>
                <th className="py-3 px-4">Credits</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading PDF jobs queue...
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No PDF jobs in current queue.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      {job.status === "COMPLETED" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                        </span>
                      )}
                      {job.status === "PROCESSING" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Compiling
                        </span>
                      )}
                      {job.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-2.5 h-2.5" /> Queued
                        </span>
                      )}
                      {job.status === "FAILED" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                          <AlertCircle className="w-2.5 h-2.5" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {job.id.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 capitalize">
                      {job.reportType.replace("_", " ")}
                      <span className="text-[10px] text-slate-400 ml-1.5 font-normal uppercase">
                        ({job.language})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">
                      {job.userEmail}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      ₹{job.creditsCost.toFixed(2)}
                      {job.refunded && (
                        <span className="text-[10px] text-emerald-600 ml-1 font-normal">(Refunded)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {job.fileUrl && (
                          <a
                            href={job.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1 transition"
                          >
                            <span>Download</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {job.status === "FAILED" && (
                          <button
                            onClick={() => handleRetryJob(job.id)}
                            disabled={actionLoading === job.id}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium flex items-center gap-1 transition"
                          >
                            <RotateCw className={`w-2.5 h-2.5 ${actionLoading === job.id ? "animate-spin" : ""}`} />
                            <span>Retry</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
