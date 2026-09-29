"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Search, 
  Loader2
} from "lucide-react";

interface AuditEntry {
  id: string;
  actorUserId: string;
  actorEmail: string;
  targetType: string | null;
  targetId: string | null;
  targetEmail: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function AdminAuditLogPage() {
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAudits = () => {
    setLoading(true);
    axios.get("/api/admin/data?type=audit")
      .then(res => {
        if (res.data?.data) {
          setAudits(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(fetchAudits);
  }, []);

  const filtered = audits.filter(a =>
    (a.targetEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.action || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(a.metadata || {}).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-md border border-line shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink">Immutable Admin Audit Trail</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-accent-soft text-accent-hover border border-accent/30 font-bold">
              SPEC §12.5 COMPLIANT
            </span>
          </div>
          <p className="text-ink-soft text-xs sm:text-sm mt-1">
            Tamper-proof record of every super-admin action (who changed what, to which tenant, from which IP, and why).
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-md border border-line shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter audit logs by action type, target email, or details..."
            className="w-full bg-surface border border-line rounded-lg pl-10 pr-4 py-2 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:bg-white focus:border-ink-muted font-medium"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-md border border-line shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-ink-soft border-b border-line font-sans font-bold">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Actor Admin</th>
                <th className="px-6 py-3.5">Action Type</th>
                <th className="px-6 py-3.5">Target Tenant</th>
                <th className="px-6 py-3.5">Details & Rationale</th>
                <th className="px-6 py-3.5">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center font-sans text-xs text-ink-soft">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Querying audit trails from MySQL...
                  </td>
                </tr>
              ) : filtered.map((log) => (
                <tr key={log.id} className="hover:bg-surface/60 transition">
                  <td className="px-6 py-4 text-ink-soft font-sans text-[11px] whitespace-nowrap">
                    {log.createdAt}
                  </td>
                  <td className="px-6 py-4 text-ink font-bold whitespace-nowrap">
                    {log.actorEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-accent-soft text-accent-hover font-bold border border-accent/30 text-[10px] font-sans">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-ink font-sans">
                    <div className="font-semibold">{log.targetEmail || "—"}</div>
                    {log.targetType && <div className="text-[10px] text-ink-muted">{log.targetType}</div>}
                  </td>
                  <td className="px-6 py-4 text-ink font-sans text-xs leading-relaxed max-w-sm truncate">
                    {log.metadata ? JSON.stringify(log.metadata) : "—"}
                  </td>
                  <td className="px-6 py-4 text-ink-soft text-[11px] whitespace-nowrap">
                    {log.ipAddress || "unknown"}
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
