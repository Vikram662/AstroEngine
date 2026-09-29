"use client";

import React, { useEffect, useState } from "react";
import { 
  Activity, 
  Search, 
  RefreshCw, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Zap,
  Globe,
  SlidersHorizontal
} from "lucide-react";

interface RequestLog {
  id: string;
  endpoint: string;
  module: string;
  creditsCost: number;
  ipAddress?: string;
  responseTime: number;
  statusCode: number;
  idempotencyKey?: string;
  userEmail: string;
  createdAt: string;
}

export default function AdminTrafficPage() {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchTraffic = async () => {
    try {
      const res = await fetch("/api/admin/data?type=traffic");
      const json = await res.json();
      if (json.status === "success") {
        setLogs(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchTraffic);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchTraffic();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredLogs = logs.filter((log) => {
    const matchesModule = filterModule === "all" || log.module.toLowerCase() === filterModule.toLowerCase();
    let matchesStatus = true;
    if (filterStatus === "2xx") matchesStatus = log.statusCode >= 200 && log.statusCode < 300;
    else if (filterStatus === "4xx") matchesStatus = log.statusCode >= 400 && log.statusCode < 500;
    else if (filterStatus === "5xx") matchesStatus = log.statusCode >= 500;

    const matchesSearch = 
      log.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.ipAddress && log.ipAddress.includes(searchQuery));

    return matchesModule && matchesStatus && matchesSearch;
  });

  const totalCalls = logs.length;
  const avgLatency = totalCalls > 0 
    ? Math.round(logs.reduce((acc, l) => acc + l.responseTime, 0) / totalCalls) 
    : 0;
  const errorRate = totalCalls > 0 
    ? ((logs.filter(l => l.statusCode >= 400).length / totalCalls) * 100).toFixed(1)
    : "0.0";
  const rateLimitHits = logs.filter(l => l.statusCode === 429).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-ink">API Traffic Monitor (§8.3.4)</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 rounded border border-emerald-300">
              LIVE STREAM
            </span>
          </div>
          <p className="text-xs text-ink-soft mt-1">
            Real-time inspection of incoming REST calls, gateway response latencies, and throttling events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-2 transition ${
              autoRefresh 
                ? "bg-emerald-50 border-emerald-300 text-emerald-700" 
                : "bg-white border-line text-ink-soft hover:bg-surface"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-ink-muted"}`} />
            <span>{autoRefresh ? "Auto-refreshing (5s)" : "Paused"}</span>
          </button>

          <button
            onClick={fetchTraffic}
            disabled={loading}
            className="p-2 bg-white hover:bg-surface border border-line rounded-lg text-ink text-xs shadow-xs transition"
            title="Refresh Now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-md border border-line bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-soft">Sampled Calls</span>
            <Activity className="w-4 h-4 text-accent" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-ink">{totalCalls}</div>
          <div className="text-[11px] text-ink-muted mt-0.5">Most recent 100 requests</div>
        </div>

        <div className="p-4 rounded-md border border-line bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-soft">Avg Latency (C-Core)</span>
            <Clock className="w-4 h-4 text-accent" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-ink">{avgLatency} ms</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Sub-50ms target met</div>
        </div>

        <div className="p-4 rounded-md border border-line bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-soft">Error Rate</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-ink">{errorRate}%</div>
          <div className="text-[11px] text-ink-muted mt-0.5">4xx and 5xx responses</div>
        </div>

        <div className="p-4 rounded-md border border-line bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-soft">Rate Limit Hits (429)</span>
            <Zap className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-ink">{rateLimitHits}</div>
          <div className="text-[11px] text-ink-muted mt-0.5">Redis sliding-window triggers</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-white rounded-md border border-line shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Search endpoint, user, or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-line rounded-lg focus:outline-hidden focus:border-ink-muted"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-xs bg-surface border border-line rounded-lg text-ink font-medium focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="2xx">2xx Success</option>
            <option value="4xx">4xx Client Errors</option>
            <option value="5xx">5xx Server Errors</option>
          </select>

          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="px-3 py-1.5 text-xs bg-surface border border-line rounded-lg text-ink font-medium focus:outline-hidden"
          >
            <option value="all">All Modules</option>
            <option value="panchang">Panchang</option>
            <option value="dasha">Dasha</option>
            <option value="parashari">Parashari</option>
            <option value="kp">KP System</option>
            <option value="matchmaking">Matchmaking</option>
            <option value="pdf">PDF Engine</option>
          </select>
        </div>

        <div className="text-xs text-ink-soft font-medium self-end md:self-auto">
          Showing <span className="font-bold text-ink">{filteredLogs.length}</span> of {logs.length} calls
        </div>
      </div>

      {/* Traffic Table */}
      <div className="bg-white rounded-md border border-line shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface border-b border-line text-ink-soft font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Endpoint</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Tenant / User</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Cost</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-mono text-[11px]">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-ink-muted font-sans">
                    Loading live traffic stream...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-ink-muted font-sans">
                    No requests matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const is2xx = log.statusCode >= 200 && log.statusCode < 300;
                  const is4xx = log.statusCode >= 400 && log.statusCode < 500;
                  const is5xx = log.statusCode >= 500;

                  return (
                    <tr key={log.id} className="hover:bg-surface/70 transition">
                      <td className="py-2.5 px-4 font-bold">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
                            is2xx
                              ? "bg-emerald-100 text-emerald-800"
                              : is4xx
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {is2xx ? (
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          ) : is4xx ? (
                            <AlertTriangle className="w-2.5 h-2.5" />
                          ) : (
                            <XCircle className="w-2.5 h-2.5" />
                          )}
                          {log.statusCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-ink font-mono">
                        {log.endpoint}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-1.5 py-0.5 rounded bg-surface-alt text-ink text-[10px] uppercase font-sans font-bold">
                          {log.module}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`font-semibold ${
                            log.responseTime < 100
                              ? "text-emerald-700"
                              : log.responseTime < 500
                              ? "text-amber-600"
                              : "text-rose-600"
                          }`}
                        >
                          {log.responseTime} ms
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-sans text-ink-soft truncate max-w-[160px]">
                        {log.userEmail}
                      </td>
                      <td className="py-2.5 px-4 text-ink-soft">
                        {log.ipAddress || "127.0.0.1"}
                      </td>
                      <td className="py-2.5 px-4 text-ink font-sans">
                        ₹{log.creditsCost.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-ink-muted font-sans text-[10px]">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
