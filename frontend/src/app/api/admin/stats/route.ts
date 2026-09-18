import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/authGuard";

// GET /api/admin/stats - Live aggregated KPIs directly from MySQL
export async function GET() {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ status: "error", message: "Forbidden: Admin authorization required." }, { status: 403 });
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
      _avg: { responseTime: true }
    });
    const avgLatency = latencyAgg._avg.responseTime ? Math.round(latencyAgg._avg.responseTime) : 0;

    // 4. PDF Worker Pipeline Health
    const failedPdfJobs = await prisma.pdfGenerationJob.count({
      where: { status: "FAILED" }
    });
    const activePdfJobs = await prisma.pdfGenerationJob.count({
      where: { status: "PROCESSING" }
    });

    // 5. Live DB Query Latency Check
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - dbStartTime;

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
        dbHealth: {
          status: "Connected",
          latencyMs: dbLatencyMs
        },
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
