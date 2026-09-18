import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionRole = cookieStore.get("astro_session_role")?.value;
  const sessionEmail = cookieStore.get("astro_session_email")?.value;

  if (!sessionRole || !sessionEmail) {
    redirect("/login?error=auth_required");
  }

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto max-h-screen p-8 bg-slate-100/90">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
