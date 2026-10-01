"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Search, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface ApiLog {
  id: string;
  endpoint: string;
  module: string;
  statusCode: number;
  responseTime: number;
  creditsCost: number;
  createdAt: string;
}

interface UsageMetrics {
  totalCalls: number;
  avgLatency: number;
  successRate: string;
  creditsDeducted: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export default function UsagePage() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [metrics, setMetrics] = useState<UsageMetrics>({
    totalCalls: 0,
    avgLatency: 0,
    successRate: "100.0%",
    creditsDeducted: 0
  });
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 15,
    totalItems: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/user/usage", {
        params: {
          page,
          limit,
          search: searchTerm.trim()
        }
      });
      if (res.data?.logs) {
        setLogs(res.data.logs);
      }
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      }
      if (res.data?.metrics) {
        setMetrics(res.data.metrics);
      }
    } catch {
      // Handle error gracefully
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchTerm]);

  useEffect(() => {
    void Promise.resolve().then(fetchLogs);
  }, [fetchLogs]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to page 1 on search
  };

  const startRecord = pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.totalItems);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-md border border-line shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-ink">API Usage & Request Logs</h1>
        <p className="text-ink-soft text-xs sm:text-sm mt-1">
          Real-time telemetry, status codes, response times, and wallet credit deduction audit trail.
        </p>
      </div>

      {/* 4 Dynamic Metric Cards from MySQL */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-md border border-line shadow-sm">
          <div className="text-xs font-semibold text-ink-soft uppercase tracking-wider">Total Calls</div>
          <div className="text-2xl font-extrabold text-ink font-mono mt-2">
            {metrics.totalCalls.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-5 rounded-md border border-line shadow-sm">
          <div className="text-xs font-semibold text-ink-soft uppercase tracking-wider">Avg Latency</div>
          <div className="text-2xl font-extrabold text-accent font-mono mt-2">
            {metrics.avgLatency} ms
          </div>
        </div>
        <div className="bg-white p-5 rounded-md border border-line shadow-sm">
          <div className="text-xs font-semibold text-ink-soft uppercase tracking-wider">Success Rate</div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono mt-2">
            {metrics.successRate}
          </div>
        </div>
        <div className="bg-white p-5 rounded-md border border-line shadow-sm">
          <div className="text-xs font-semibold text-ink-soft uppercase tracking-wider">Credits Deducted</div>
          <div className="text-2xl font-extrabold text-ink font-mono mt-2">
            ₹{metrics.creditsDeducted.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-md border border-line shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by endpoint path or module name..."
            className="w-full bg-surface border border-line rounded-lg pl-9 pr-4 py-2 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:bg-white focus:border-ink-muted transition"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-ink-soft w-full sm:w-auto justify-end">
          <label htmlFor="perPage" className="whitespace-nowrap">Rows per page:</label>
          <select
            id="perPage"
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="bg-surface border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink font-medium focus:outline-none focus:border-ink-muted cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Logs Table with Pagination */}
      <div className="bg-white rounded-md border border-line shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-surface text-ink-soft border-b border-line font-sans font-bold">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Endpoint</th>
                <th className="px-6 py-3.5">Module</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Latency</th>
                <th className="px-6 py-3.5">Credits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center font-sans text-xs text-ink-soft">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-accent" />
                    Fetching live telemetry logs from MySQL...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-ink-muted font-sans text-xs">
                    {searchTerm ? "No logs match your search query." : "No API request logs recorded yet for your account."}
                  </td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface/70 transition">
                  <td className="px-6 py-3.5 text-ink-soft font-sans whitespace-nowrap">{log.createdAt}</td>
                  <td className="px-6 py-3.5 text-ink font-semibold">{log.endpoint}</td>
                  <td className="px-6 py-3.5 text-ink font-sans font-medium">{log.module || "General"}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${
                      log.statusCode >= 200 && log.statusCode < 300
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-rose-100 text-rose-800 border-rose-200"
                    }`}>
                      {log.statusCode} {log.statusCode === 200 ? "OK" : "ERROR"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-ink-soft">{log.responseTime}ms</td>
                  <td className="px-6 py-3.5 text-ink font-bold font-sans">₹{log.creditsCost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-surface px-6 py-3.5 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 font-sans text-xs">
          <div className="text-ink-soft">
            Showing <span className="font-semibold text-ink">{startRecord}</span> to{" "}
            <span className="font-semibold text-ink">{endRecord}</span> of{" "}
            <span className="font-semibold text-ink">{pagination.totalItems}</span> total logs
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-line hover:bg-white text-ink-soft disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev || loading}
              className="px-2.5 py-1.5 rounded-lg border border-line hover:bg-white text-ink font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="px-3 py-1 font-semibold text-ink bg-white border border-line rounded-lg">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNext || loading}
              className="px-2.5 py-1.5 rounded-lg border border-line hover:bg-white text-ink font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage(pagination.totalPages)}
              disabled={page >= pagination.totalPages || loading}
              className="p-1.5 rounded-lg border border-line hover:bg-white text-ink-soft disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
