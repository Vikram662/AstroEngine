"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Activity, 
  Search, 
  Loader2
} from "lucide-react";

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

export default function UsagePage() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [metrics, setMetrics] = useState<UsageMetrics>({
    totalCalls: 0,
    avgLatency: 0,
    successRate: "100.0%",
    creditsDeducted: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Dynamic query from MySQL scoped to logged-in user
    axios.get("/api/user/usage")
      .then(res => {
        if (res.data?.logs) {
          setLogs(res.data.logs);
        }
        if (res.data?.metrics) {
          setMetrics(res.data.metrics);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter(l => 
    (l.endpoint || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (l.module || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">API Usage & Request Logs</h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-1">
          Real-time telemetry, status codes, response times, and wallet credit deduction audit trail.
        </p>
      </div>

      {/* 4 Dynamic Metric Cards from MySQL */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Calls</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-2">
            {metrics.totalCalls.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Latency</div>
          <div className="text-2xl font-extrabold text-blue-600 font-mono mt-2">
            {metrics.avgLatency} ms
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Success Rate</div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono mt-2">
            {metrics.successRate}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Credits Deducted</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-2">
            ₹{metrics.creditsDeducted.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by endpoint path or module name..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-sans font-bold">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Endpoint</th>
                <th className="px-6 py-3.5">Module</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Latency</th>
                <th className="px-6 py-3.5">Credits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center font-sans text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Fetching live telemetry logs from MySQL...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-sans text-xs">
                    No API request logs recorded yet for your account.
                  </td>
                </tr>
              ) : filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-3.5 text-slate-500 font-sans">{log.createdAt}</td>
                  <td className="px-6 py-3.5 text-slate-900 font-semibold">{log.endpoint}</td>
                  <td className="px-6 py-3.5 text-slate-700 font-sans font-medium">{log.module || "General"}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${
                      log.statusCode >= 200 && log.statusCode < 300
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-rose-100 text-rose-800 border-rose-200"
                    }`}>
                      {log.statusCode} {log.statusCode === 200 ? "OK" : "ERROR"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600">{log.responseTime}ms</td>
                  <td className="px-6 py-3.5 text-slate-900 font-bold font-sans">₹{log.creditsCost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
