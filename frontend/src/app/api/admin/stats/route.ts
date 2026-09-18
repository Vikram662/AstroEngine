import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/stats - Live aggregated KPIs directly from MySQL
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionRole = cookieStore.get("astro_session_role")?.value;

    if (sessionRole !== "ADMIN" && sessionRole !== "SUPER_ADMIN") {
      return NextResponse.json({ status: "error", message: "Forbidden" }, { status: 403 });
    }

    // 1. Total Tenants & Tier breakdown
    const totalUsers = await prisma.user.count();
    const starterUsers = await prisma.user.count({ where: { planTier: "STARTER" } });
    const proUsers = await prisma.user.count({ where: { planTier: "PRO" } });
    const enterpriseUsers = await prisma.user.count({ where: { planTier: "ENTERPRISE" } });

    // 2. Gross Revenue (Total Successful Transactions)
    const revenueAgg = await prisma.transaction.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true }
    });
    const totalRevenue = revenueAgg._sum.amount || 0;

    // 3. API Telemetry logs count & latency
    const totalApiRequests = await prisma.apiRequestLog.count();
    const latencyAgg = await prisma.apiRequestLog.aggregate({
      _avg: { latencyMs: true }
    });
    const avgLatency = Math.round(latencyAgg._avg.latencyMs || 12);

    // 4. PDF Worker Pipeline Health
    const failedPdfJobs = await prisma.pdfGenerationJob.count({
      where: { status: "FAILED" }
    });
    const activePdfJobs = await prisma.pdfGenerationJob.count({
      where: { status: "PROCESSING" }
    });

    return NextResponse.json({
      status: "success",
      data: {
        totalUsers,
        tierBreakdown: {
          starter: starterUsers,
          pro: proUsers,
          enterprise: enterpriseUsers
        },
        totalRevenue,
        totalApiRequests,
        avgLatency,
        pdfStats: {
          failedJobs24h: failedPdfJobs,
          activeProcessing: activePdfJobs,
          status: failedPdfJobs === 0 ? "Healthy" : "Degraded"
        }
      }
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
