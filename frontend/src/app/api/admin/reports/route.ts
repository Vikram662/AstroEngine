import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/reports - Live module popularity & CSV generator from MySQL
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionRole = cookieStore.get("astro_session_role")?.value;

    if (sessionRole !== "ADMIN" && sessionRole !== "SUPER_ADMIN") {
      return NextResponse.json({ status: "error", message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const exportType = searchParams.get("export");

    // Module Popularity from real ApiRequestLog
    const logs = await prisma.apiRequestLog.findMany({
      select: { module: true },
      take: 500
    });

    const total = logs.length;
    const moduleCounts: Record<string, number> = {};
    for (const l of logs) {
      const mod = l.module || "General";
      moduleCounts[mod] = (moduleCounts[mod] || 0) + 1;
    }

    const breakdown = Object.entries(moduleCounts).map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0.0"
    }));

    // CSV Exports from real DB
    if (exportType === "gstr1_returns") {
      const txs = await prisma.transaction.findMany({
        where: { status: "SUCCESS" },
        include: { user: true },
        orderBy: { createdAt: "desc" }
      });

      let csv = "InvoiceNumber,Date,UserEmail,Amount,TaxableValue,CGST,SGST,Status\n";
      for (const t of txs) {
        const taxable = (t.amount / 1.18).toFixed(2);
        const gst = ((t.amount - parseFloat(taxable)) / 2).toFixed(2);
        csv += `${t.id.substring(0, 8)},${t.createdAt.toISOString().substring(0, 10)},${t.user.email},${t.amount},${taxable},${gst},${gst},${t.status}\n`;
      }
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="GSTR1_${Date.now()}.csv"`
        }
      });
    }

    if (exportType === "top_consumers") {
      const users = await prisma.user.findMany({
        orderBy: { monthlyUsage: "desc" },
        take: 50
      });

      let csv = "UserId,Email,PlanTier,MonthlyUsage,MonthlyQuota,WalletBalance\n";
      for (const u of users) {
        csv += `${u.id},${u.email},${u.planTier},${u.monthlyUsage},${u.monthlyQuota},${u.walletBalance}\n`;
      }
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="TopConsumers_${Date.now()}.csv"`
        }
      });
    }

    return NextResponse.json({
      status: "success",
      data: {
        totalCallsSampled: total,
        breakdown: breakdown.length > 0 ? breakdown : [
          { name: "Panchang & Muhurat", count: 0, percentage: "0.0" },
          { name: "KP Horary", count: 0, percentage: "0.0" },
          { name: "Parashari Charts", count: 0, percentage: "0.0" },
          { name: "PDF Brihat Kundli", count: 0, percentage: "0.0" }
        ]
      }
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
