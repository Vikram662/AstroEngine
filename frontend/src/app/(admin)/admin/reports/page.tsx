"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Download, FileSpreadsheet, Users, Calendar, Loader2 } from "lucide-react";

interface ModuleShare {
  name: string;
  count: number;
  percentage: string;
}

export default function AdminReportsPage() {
  const [breakdown, setBreakdown] = useState<ModuleShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState("30d");
  const [downloading, setDownloading] = useState<string | null>(null);

  const fetchReportData = () => {
    setLoading(true);
    axios.get("/api/admin/reports")
      .then((res) => {
        if (res.data?.data?.breakdown) {
          setBreakdown(res.data.data.breakdown);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(fetchReportData);
  }, []);

  const handleDownload = async (exportType: string) => {
    setDownloading(exportType);
    try {
      window.open(`/api/admin/reports?export=${exportType}`, "_blank");
    } finally {
      setTimeout(() => setDownloading(null), 1000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-ink">
              Executive Reports & GSTR-1 Exports
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-accent-soft text-accent-hover rounded border border-accent/30">
              LIVE MYSQL DATA
            </span>
          </div>
          <p className="text-xs text-ink-soft mt-1">
            Download business intelligence digests, endpoint popularity breakdowns, and compliant GST CSV exports directly from MySQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-ink-muted" />
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-line rounded-lg text-ink font-medium focus:outline-hidden"
          >
            <option value="7d">Trailing 7 Days</option>
            <option value="30d">Trailing 30 Days</option>
            <option value="90d">Trailing 90 Days</option>
            <option value="fy26">Current FY (2026-27)</option>
          </select>
        </div>
      </div>

      {/* Module Popularity Breakdown - 100% Dynamic from ApiRequestLog */}
      <div className="bg-white rounded-md border border-line shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div>
            <h2 className="text-sm font-bold text-ink">Module Popularity & Traffic Share</h2>
            <p className="text-xs text-ink-soft mt-0.5">Calculated dynamically from real incoming API requests in MySQL.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-ink-muted text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Calculating traffic share from database...</span>
          </div>
        ) : breakdown.length === 0 ? (
          <div className="p-8 text-center text-ink-muted text-xs">
            No API request traffic logged yet. Traffic share will populate automatically once API calls are executed.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {breakdown.map((item, idx) => (
              <div key={item.name} className="p-3.5 bg-surface rounded-lg border border-line">
                <span className="text-[11px] font-bold text-ink-soft uppercase">{item.name}</span>
                <div className="text-xl font-bold font-mono text-ink mt-1">{item.percentage}%</div>
                <div className="text-[10px] text-ink-muted font-mono mt-0.5">{item.count} calls</div>
                <div className="w-full bg-line h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full ${idx === 0 ? "bg-accent" : idx === 1 ? "bg-accent" : idx === 2 ? "bg-emerald-600" : "bg-amber-500"}`}
                    style={{ width: `${Math.max(parseFloat(item.percentage), 5)}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Export Packages - Real Data CSV Downloads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Report 1: GSTR-1 Tax File */}
        <div className="p-5 bg-white border border-line rounded-md shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-3">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-ink">GSTR-1 Invoicing Report</h3>
            <p className="text-xs text-ink-soft mt-1">
              Live export of all settled wallet recharges and plan subscriptions with taxable values, CGST, and SGST breakdowns.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-line flex items-center justify-between">
            <span className="text-[11px] text-ink-muted font-mono">Format: Real CSV</span>
            <button
              onClick={() => handleDownload("gstr1_returns")}
              disabled={downloading === "gstr1_returns"}
              className="px-3 py-1.5 bg-console hover:bg-console-line text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading === "gstr1_returns" ? "Exporting..." : "Download Real CSV"}</span>
            </button>
          </div>
        </div>

        {/* Report 2: Top Consumer Accounts */}
        <div className="p-5 bg-white border border-line rounded-md shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent-hover flex items-center justify-center font-bold mb-3">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-ink">Top Heavy Consumers Report</h3>
            <p className="text-xs text-ink-soft mt-1">
              Ranked table of tenants generating highest load and usage from MySQL `User` and `ApiRequestLog` tables.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-line flex items-center justify-between">
            <span className="text-[11px] text-ink-muted font-mono">Format: Real CSV</span>
            <button
              onClick={() => handleDownload("top_consumers")}
              disabled={downloading === "top_consumers"}
              className="px-3 py-1.5 bg-console hover:bg-console-line text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading === "top_consumers" ? "Exporting..." : "Download Real CSV"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
