import React from "react";
import { AdminSidebar } from "@/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto max-h-screen p-8 bg-slate-100/90">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
