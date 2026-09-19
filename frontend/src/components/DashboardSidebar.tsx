"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import axios from "axios";
import { 
  LayoutDashboard, 
  KeyRound, 
  Activity, 
  FileCheck, 
  Palette, 
  CreditCard,
  Receipt,
  LogOut,
  Users,
  Bell,
  User,
  LifeBuoy,
  ExternalLink
} from "lucide-react";

const DASHBOARD_LINKS = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "API Keys", href: "/api-keys", icon: KeyRound },
  { name: "Usage & Logs", href: "/usage", icon: Activity },
  { name: "PDF Reports", href: "/pdf-reports", icon: FileCheck },
  { name: "Branding", href: "/branding", icon: Palette },
  { name: "Billing & Wallet", href: "/billing", icon: CreditCard },
  { name: "Invoices & GST", href: "/invoices", icon: Receipt },
  { name: "Team Seats", href: "/team", icon: Users },
  { name: "Alerts & Webhooks", href: "/settings/notifications", icon: Bell },
  { name: "Support Tickets", href: "/support", icon: LifeBuoy },
  { name: "My Profile", href: "/profile", icon: User },
];

export const DashboardSidebar = () => {
  const pathname = usePathname();
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("AstroEngine");

  useEffect(() => {
    axios.get("/api/settings/public")
      .then((res) => {
        if (res.data?.data) {
          if (res.data.data.COMPANY_LOGO_URL) {
            setLogoUrl(res.data.data.COMPANY_LOGO_URL);
          }
          if (res.data.data.COMPANY_NAME) {
            setCompanyName(res.data.data.COMPANY_NAME.split(" ")[0] || "AstroEngine");
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0 shadow-sm z-10">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200 bg-slate-50/50">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={companyName} 
            className="h-8 max-w-[40px] object-contain rounded" 
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs shadow-sm">
            AE
          </div>
        )}
        <div>
          <span className="font-bold text-sm tracking-tight text-slate-900">{companyName}</span>
          <span className="text-[11px] block text-slate-500 font-medium">Developer Console</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {DASHBOARD_LINKS.map((item) => {
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
          <span className="px-3.5 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
            Resources
          </span>
          <div className="mt-2 space-y-1">
            <Link
              href="/docs"
              className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <span>Documentation</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/"
              className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <span>Public Website</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </nav>

      {/* User Session Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-300">
              U
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900 leading-none">Developer</div>
              <div className="text-[11px] text-slate-500 mt-1 leading-none font-mono truncate max-w-[120px]">client@example.com</div>
            </div>
          </div>
          <button 
            onClick={async () => {
              await fetch("/api/auth/session", { method: "DELETE" });
              window.location.href = "/login";
            }}
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-slate-200 transition" 
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
