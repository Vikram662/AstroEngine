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
  targetUserId: string;
  action: string;
  details: string;
  ipAddress: string;
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
    fetchAudits();
  }, []);

  const filtered = audits.filter(a => 
    (a.targetUserId || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (a.action || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.details || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Immutable Admin Audit Trail</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 font-bold">
              SPEC §12.5 COMPLIANT
            </span>
          </div>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Tamper-proof record of every super-admin action (who changed what, to which tenant, from which IP, and why).
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter audit logs by action type, target email, or details..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 font-medium"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-sans font-bold">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Actor Admin</th>
                <th className="px-6 py-3.5">Action Type</th>
                <th className="px-6 py-3.5">Target Tenant</th>
                <th className="px-6 py-3.5">Details & Rationale</th>
                <th className="px-6 py-3.5">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center font-sans text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Querying audit trails from MySQL...
                  </td>
                </tr>
              ) : filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4 text-slate-500 font-sans text-[11px] whitespace-nowrap">
                    {log.createdAt}
                  </td>
                  <td className="px-6 py-4 text-slate-900 font-bold whitespace-nowrap">
                    {log.actorUserId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold border border-blue-200 text-[10px] font-sans">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-900 font-sans">
                    <div className="font-semibold">{log.targetUserId}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-sans text-xs leading-relaxed max-w-sm">
                    {log.details}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-[11px] whitespace-nowrap">
                    {log.ipAddress || "127.0.0.1"}
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
