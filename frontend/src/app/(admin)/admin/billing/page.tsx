"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, Loader2, FileText } from "lucide-react";

interface AdminTx {
  id: string;
  amount: number;
  creditsAdded: number;
  gatewayOrderId?: string;
  webhookVerified: boolean;
  status: "SUCCESS" | "PENDING" | "FAILED";
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function AdminBillingPage() {
  const [txs, setTxs] = useState<AdminTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTxs = () => {
    setLoading(true);
    axios.get("/api/admin/data?type=billing")
      .then(res => {
        if (res.data?.data) {
          setTxs(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(fetchTxs);
  }, []);

  const filtered = txs.filter(t => 
    (t.user?.email || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.gatewayOrderId || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-md border border-line shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Platform Financial & Billing Audits</h1>
          <p className="text-ink-soft text-xs sm:text-sm mt-1">
            Reconcile payment transactions, verify signature webhooks, and track gross platform revenue live from database.
          </p>
        </div>
        <button
          onClick={fetchTxs}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 bg-console hover:bg-console-line text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
        >
          <Loader2 className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Financial KPIs - 100% Dynamic from Database */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-md border border-line shadow-sm">
          <div className="text-xs font-bold text-ink-soft uppercase tracking-wider">Settled Volume</div>
          <div className="text-2xl font-extrabold text-ink font-mono mt-2">
            ₹{txs.filter(t => t.status === "SUCCESS").reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1">
            {txs.filter(t => t.status === "SUCCESS").length} Successful Transactions
          </div>
        </div>

        <div className="bg-white p-5 rounded-md border border-line shadow-sm">
          <div className="text-xs font-bold text-ink-soft uppercase tracking-wider">Credits Dispatched</div>
          <div className="text-2xl font-extrabold text-accent font-mono mt-2">
            {txs.reduce((acc, curr) => acc + (curr.creditsAdded || 0), 0).toLocaleString()} Units
          </div>
          <div className="text-xs text-ink-soft mt-1">Wallet Credits Allocated</div>
        </div>

        <div className="bg-white p-5 rounded-md border border-line shadow-sm">
          <div className="text-xs font-bold text-ink-soft uppercase tracking-wider">Failed Transactions</div>
          <div className="text-2xl font-extrabold text-rose-600 font-mono mt-2">
            {txs.filter(t => t.status === "FAILED").length}
          </div>
          <div className="text-xs text-ink-soft mt-1">Rejected by Gateway</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-md border border-line shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transactions by client email or Gateway Order ID..."
            className="w-full bg-surface border border-line rounded-lg pl-10 pr-4 py-2 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:bg-white focus:border-ink-muted font-medium"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-md border border-line shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-ink-soft border-b border-line font-sans font-bold">
              <tr>
                <th className="px-6 py-3.5">Tx ID / Order ID</th>
                <th className="px-6 py-3.5">Client</th>
                <th className="px-6 py-3.5">Amount (INR)</th>
                <th className="px-6 py-3.5">Credits Added</th>
                <th className="px-6 py-3.5">Webhook Verified</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5 text-right">GST Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink font-mono">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center font-sans text-xs text-ink-soft">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Querying transactions from database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-ink-muted font-sans text-xs">
                    No billing transactions found in database.
                  </td>
                </tr>
              ) : filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-surface/60 transition">
                  <td className="px-6 py-4">
                    <div className="font-bold text-ink">{tx.id.substring(0, 12)}...</div>
                    <div className="text-ink-soft text-[11px]">{tx.gatewayOrderId || "N/A"}</div>
                  </td>
                  <td className="px-6 py-4 font-sans">
                    <div className="font-semibold text-ink">{tx.user?.name || "B2B Tenant"}</div>
                    <div className="text-ink-soft text-[11px] font-mono">{tx.user?.email || "N/A"}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-ink font-sans">
                    ₹{tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-emerald-700 font-bold font-sans">
                    +{tx.creditsAdded.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {tx.webhookVerified ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 text-[10px] font-sans">
                        VERIFIED (HMAC-SHA256)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200 text-[10px] font-sans">
                        UNVERIFIED
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-sans">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      tx.status === "SUCCESS" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-ink-soft font-sans text-[11px]">
                    {new Date(tx.createdAt).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-6 py-4 font-sans text-right">
                    <a
                      href={`/api/billing/invoice/${tx.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-alt hover:bg-line text-ink font-semibold text-[11px] transition"
                      title="View / Print Official GST Invoice"
                    >
                      <FileText className="w-3 h-3 text-accent" />
                      <span>Invoice</span>
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
