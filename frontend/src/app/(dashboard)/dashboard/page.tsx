"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Wallet, 
  BarChart3, 
  Key, 
  ArrowUpRight, 
  FileText,
  Activity,
  CheckCircle2,
  Loader2
} from "lucide-react";

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<{
    walletBalance: number;
    monthlyUsage: number;
    monthlyQuota: number;
    planTier: string;
    email: string;
    rateLimitPerMin?: number;
    planDetails?: {
      name?: string;
      rateLimitPerMin?: number;
      includedQuota?: number;
      features?: string[];
    };
    subscription?: {
      currentPeriodEnd?: string;
      status?: string;
    } | null;
    apiLogs?: Array<{
      id: string;
      endpoint: string;
      statusCode: number;
      latencyMs: number;
      cost: number;
      createdAt: string;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "/login?error=auth_required";
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (json?.status === "success") {
          setUserData(json.data);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [router]);

  const walletBalance = userData?.walletBalance ?? 100.0;
  const monthlyUsage = userData?.monthlyUsage ?? 0;
  const monthlyQuota = userData?.monthlyQuota ?? 35000;
  const usagePercentage = Math.min(100, Math.round((monthlyUsage / monthlyQuota) * 100));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Developer Console</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Monitor API consumption, wallet balance, and production credentials.
          </p>
        </div>
        <Link
          href="/api-keys"
          className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow flex items-center gap-2 transition self-start sm:self-auto"
        >
          <Key className="w-3.5 h-3.5" />
          <span>Manage API Keys</span>
        </Link>
      </div>

      {/* 3 Metric Cards with Crisp White Background and Clear Shadows */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Wallet Balance Card */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Prepaid Balance</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900 font-mono">₹{walletBalance.toFixed(2)}</div>
              <div className={`text-xs font-medium mt-1 flex items-center gap-1.5 ${walletBalance <= 0 ? "text-rose-600" : walletBalance < 50 ? "text-amber-600" : "text-emerald-700"}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {walletBalance <= 0 
                    ? "Wallet Empty — Auto-drain active" 
                    : walletBalance < 50 
                    ? "Low Balance — Recharge recommended" 
                    : "Prepaid Credits Active"}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link href="/billing" className="text-xs text-slate-900 hover:text-blue-600 font-semibold flex items-center gap-1">
              Add Balance <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Monthly Quota Card */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Monthly Quota</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900 font-mono">
                {monthlyUsage.toLocaleString()} <span className="text-sm font-normal text-slate-400">/ {monthlyQuota.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden border border-slate-200">
                <div 
                  className="bg-slate-900 h-full rounded-full transition-all"
                  style={{ width: `${Math.max(usagePercentage, 4)}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{usagePercentage}% consumed</span>
            <span>
              {userData?.subscription?.currentPeriodEnd
                ? `Renews: ${new Date(userData.subscription.currentPeriodEnd).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`
                : "Reset: 1st of Month"}
            </span>
          </div>
        </div>

        {/* Plan Tier Card */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Active Plan</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-slate-900">
                {userData?.planDetails?.name || userData?.planTier || "STARTER"}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {userData?.planDetails?.rateLimitPerMin ?? userData?.rateLimitPerMin ?? 60} req / min • {userData?.monthlyQuota?.toLocaleString() ?? "35,000"} calls / mo
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link href="/billing" className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
              <span>{userData?.planTier === "ENTERPRISE" ? "Manage Subscription" : "Upgrade Plan"}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Integration Code Box */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
          Quick Request Example
        </h2>
        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-100 overflow-x-auto leading-relaxed border border-slate-800">
          <div className="text-slate-400 mb-1"># Authenticated POST request to calculate Lagna Kundli</div>
          <div>curl -X POST &quot;http://localhost:8000/api/v1/parashari/chart/d1&quot; \</div>
          <div className="pl-4">-H &quot;x-api-key: ak_live_your_api_key&quot; \</div>
          <div className="pl-4">-H &quot;Content-Type: application/json&quot; \</div>
          <div className="pl-4">-d &apos;{JSON.stringify({ dob: "1995-10-05", tob: "14:30", lat: 24.5854, lon: 73.7125, tz: 5.5, lang: "en" })}&apos;</div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">Recent Calculation Logs</h3>
          <Link href="/usage" className="text-xs text-slate-900 hover:text-blue-600 font-semibold">View Full Logs →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-sans font-semibold">
              <tr>
                <th className="px-6 py-3">Endpoint</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Latency</th>
                <th className="px-6 py-3">Cost</th>
                <th className="px-6 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {userData?.apiLogs && userData.apiLogs.length > 0 ? (
                userData.apiLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-3.5 text-slate-900 font-semibold font-mono">{log.endpoint}</td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2 py-0.5 rounded border text-[11px] font-medium ${
                        log.statusCode >= 200 && log.statusCode < 300 
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                          : "bg-rose-100 text-rose-800 border-rose-200"
                      }`}>
                        {log.statusCode} {log.statusCode === 200 ? "OK" : "ERROR"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{log.latencyMs}ms</td>
                    <td className="px-6 py-3.5 text-slate-600 font-sans font-medium">₹{(log.cost ?? 0).toFixed(2)}</td>
                    <td className="px-6 py-3.5 text-slate-500 font-sans">
                      {new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-sans text-xs">
                    No API calculation requests logged yet. Authenticate your API key and call any endpoint to see live telemetry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
