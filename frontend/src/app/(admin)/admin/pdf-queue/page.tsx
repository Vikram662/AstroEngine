"use client";

import React, { useEffect, useState } from "react";
import { RotateCw, Search, Clock, CheckCircle2, XCircle, Loader2, ExternalLink, HardDrive, AlertCircle } from "lucide-react";

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
  const [retryError, setRetryError] = useState<string | null>(null);

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
    void Promise.resolve().then(fetchJobs);
    const interval = setInterval(fetchJobs, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleRetryJob = async (jobId: string) => {
    setActionLoading(jobId);
    setRetryError(null);
    try {
      const res = await fetch("/api/admin/pdf-queue/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId })
      });
      const json = await res.json();
      if (json.status !== "success") {
        setRetryError(json.message || "Retry failed.");
      }
      fetchJobs();
    } catch {
      setRetryError("Retry request failed — check your connection and try again.");
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
            <h1 className="text-xl font-bold tracking-tight text-ink">PDF Job Queue Monitor (§8.3.5)</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-accent-soft text-accent-hover rounded border border-accent/30">
              WORKER PIPELINE
            </span>
          </div>
          <p className="text-xs text-ink-soft mt-1">
            Track WeasyPrint compilation tasks, inspect Cloudflare R2 presigned exports, and manage stuck jobs.
          </p>
        </div>

        <button
          onClick={fetchJobs}
          disabled={loading}
          className="px-3.5 py-1.5 bg-white hover:bg-surface border border-line rounded-lg text-ink text-xs font-medium flex items-center gap-2 shadow-xs transition"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Sync Queue</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-md border border-line bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-soft">In Queue (Pending)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-ink">{pendingCount}</div>
          <div className="text-[11px] text-ink-muted mt-0.5">Awaiting worker thread</div>
        </div>

        <div className="p-4 rounded-md border border-line bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-soft">Active Compiling</span>
            <Loader2 className="w-4 h-4 text-accent animate-spin" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-ink">{processingCount}</div>
          <div className="text-[11px] text-ink-muted mt-0.5">WeasyPrint rendering</div>
        </div>

        <div className="p-4 rounded-md border border-line bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-soft">Completed (24h)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-ink">{completedCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">R2 Presigned URLs live</div>
        </div>

        <div className="p-4 rounded-md border border-line bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-soft">Failed / Refunded</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-ink">{failedCount}</div>
          <div className="text-[11px] text-ink-muted mt-0.5">Auto-refunded via §12.6</div>
        </div>
      </div>

      {retryError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <span>{retryError}</span>
        </div>
      )}

      {/* R2 Storage Status Notice (§5 / §8.3.5) */}
      <div className="p-3.5 bg-surface border border-line rounded-md flex items-center justify-between text-xs text-ink-soft">
        <div className="flex items-center gap-2.5">
          <HardDrive className="w-4 h-4 text-ink-soft" />
          <span>
            <strong>Cloudflare R2 Object Storage:</strong> Auto-lifecycle set to 24-hr expiry (§5). Zero egress cost active.
          </span>
        </div>
        <span className="font-mono font-bold text-ink bg-white px-2 py-0.5 rounded border border-line">
          Bucket: astroengine-reports
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white rounded-md border border-line shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search report, tenant, or job ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-line rounded-lg focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-surface border border-line rounded-lg text-ink font-medium focus:outline-hidden"
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
      <div className="bg-white rounded-md border border-line shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface border-b border-line text-ink-soft font-semibold uppercase tracking-wider text-[10px]">
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
            <tbody className="divide-y divide-line">
              {loading && jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-ink-muted">
                    Loading PDF jobs queue...
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-ink-muted">
                    No PDF jobs in current queue.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-surface/70 transition">
                    <td className="py-3 px-4">
                      {job.status === "COMPLETED" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                        </span>
                      )}
                      {job.status === "PROCESSING" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-accent-soft text-accent-hover">
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
                    <td className="py-3 px-4 font-mono text-[11px] text-ink-soft">
                      {job.id.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-4 font-semibold text-ink capitalize">
                      {job.reportType.replace("_", " ")}
                      <span className="text-[10px] text-ink-muted ml-1.5 font-normal uppercase">
                        ({job.language})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-ink-soft truncate max-w-[150px]">
                      {job.userEmail}
                    </td>
                    <td className="py-3 px-4 font-semibold text-ink">
                      ₹{job.creditsCost.toFixed(2)}
                      {job.refunded && (
                        <span className="text-[10px] text-emerald-600 ml-1 font-normal">(Refunded)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-ink-muted text-[11px]">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {job.fileUrl && (
                          <a
                            href={job.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded bg-surface-alt hover:bg-line text-ink text-[11px] font-medium flex items-center gap-1 transition"
                          >
                            <span>Download</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {job.status === "FAILED" && (
                          <button
                            onClick={() => handleRetryJob(job.id)}
                            disabled={actionLoading === job.id}
                            className="px-2 py-1 rounded bg-console hover:bg-console-line text-white text-[11px] font-medium flex items-center gap-1 transition"
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
