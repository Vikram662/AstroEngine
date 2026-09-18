"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShieldAlert, 
  Users, 
  CreditCard, 
  FileText, 
  Activity, 
  Sparkles,
  ArrowLeft,
  Server,
  Lock,
  Layers,
  BarChart3,
  MessageSquare,
  Settings
} from "lucide-react";

const ADMIN_LINKS = [
  { name: "Overview & Health", href: "/admin", icon: Activity },
  { name: "Traffic Monitor", href: "/admin/traffic", icon: Server },
  { name: "PDF Job Queue", href: "/admin/pdf-queue", icon: FileText },
  { name: "Subscription Plans", href: "/admin/plans", icon: Layers },
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "Billing Audits", href: "/admin/billing", icon: CreditCard },
  { name: "Support Desk", href: "/admin/support", icon: MessageSquare },
  { name: "Reports & GSTR-1", href: "/admin/reports", icon: BarChart3 },
  { name: "Audit Logs", href: "/admin/audit-log", icon: Lock },
  { name: "Prompt Rules", href: "/admin/prompts", icon: Sparkles },
  { name: "System Settings", href: "/admin/settings", icon: Settings },
];

export const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0 shadow-sm z-20">
      {/* Admin Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200 bg-slate-900 text-white">
        <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center font-mono font-bold text-xs shadow">
          <ShieldAlert className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-sm tracking-tight text-white">Super Admin</span>
          <span className="text-[10px] block text-emerald-400 font-mono font-semibold">Live System Online</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Master Controls
        </div>
        {ADMIN_LINKS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-6 mt-6 border-t border-slate-200">
          <div className="px-3 pb-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Environment
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">FastAPI C-Core:</span>
              <span className="font-mono font-bold text-emerald-700">ONLINE</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">MySQL Database:</span>
              <span className="font-mono font-bold text-emerald-700">CONNECTED</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Active Node:</span>
              <span className="font-mono text-slate-800">prod-mumbai-01</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Footer Switch to User Portal & Sign Out */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
        <Link
          href="/dashboard"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800 shadow-xs transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to User Portal</span>
        </Link>
        <button
          onClick={async () => {
            await fetch("/api/auth/session", { method: "DELETE" });
            window.location.href = "/login";
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-rose-700 transition"
        >
          <span>Sign Out Admin</span>
        </button>
      </div>
    </aside>
  );
};
