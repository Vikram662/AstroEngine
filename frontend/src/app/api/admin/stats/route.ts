import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/authGuard";
import { toMoney } from "@/lib/money";
import { publicMessage } from "@/lib/apiErrors";

// GET /api/admin/stats - Live aggregated KPIs directly from MySQL
export async function GET() {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ status: "error", message: "Forbidden: Admin authorization required." }, { status: 403 });
    }

    const since24h = new Date(Date.now() - 24 * 3600 * 1000);

    // All independent counts run in parallel. Revenue = sales: plans and add-ons that were
    // paid for (from the wallet or directly). Wallet top-ups are prepaid deposits, reported
    // separately, so the same rupee is never counted as both a deposit and a sale.
    const [
      totalUsers, starterUsers, proUsers, enterpriseUsers,
      salesAgg, addonSalesAgg, topUpAgg, totalApiRequests, latencyAgg, failedPdfJobs, activePdfJobs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { planTier: "STARTER" } }),
      prisma.user.count({ where: { planTier: "PRO" } }),
      prisma.user.count({ where: { planTier: "ENTERPRISE" } }),
      prisma.transaction.aggregate({
        where: { status: "SUCCESS", creditsAdded: { lte: 0 }, amount: { gt: 0 } },
        _sum: { amount: true },
      }),
      // wallet add-on purchases are stored with a negative amount
      prisma.transaction.aggregate({
        where: { status: "SUCCESS", creditsAdded: { lte: 0 }, amount: { lt: 0 } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { status: "SUCCESS", creditsAdded: { gt: 0 } },
        _sum: { amount: true },
      }),
      prisma.apiRequestLog.count(),
      prisma.apiRequestLog.aggregate({ _avg: { responseTime: true } }),
      prisma.pdfGenerationJob.count({ where: { status: "FAILED", createdAt: { gte: since24h } } }),
      prisma.pdfGenerationJob.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
    ]);

    const totalRevenue = toMoney(salesAgg._sum.amount) + Math.abs(toMoney(addonSalesAgg._sum.amount));
    const walletTopUps = toMoney(topUpAgg._sum.amount);
    const avgLatency = latencyAgg._avg.responseTime ? Math.round(latencyAgg._avg.responseTime) : 0;

    // 5. Live DB Query Latency Check
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - dbStartTime;

    // 6. Live FastAPI Backend Health Check
    const astroEngineUrl = (process.env.NEXT_PUBLIC_ASTRO_ENGINE_URL || "http://localhost:8000").replace(/\/$/, "");
    let fastApiHealth: { status: string; latencyMs: number | null } = { status: "Unreachable", latencyMs: null };
    try {
      const fastApiStartTime = Date.now();
      const healthRes = await fetch(`${astroEngineUrl}/health`, { signal: AbortSignal.timeout(4000) });
      fastApiHealth = {
        status: healthRes.ok ? "Online" : "Degraded",
        latencyMs: Date.now() - fastApiStartTime
      };
    } catch {
      fastApiHealth = { status: "Unreachable", latencyMs: null };
    }

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
        walletTopUps,
        totalApiRequests,
        avgLatency,
        dbHealth: {
          status: "Connected",
          latencyMs: dbLatencyMs
        },
        fastApiHealth,
        environment: process.env.ENVIRONMENT || process.env.NODE_ENV || "development",
        pdfStats: {
          failedJobs24h: failedPdfJobs,
          activeProcessing: activePdfJobs,
          status: failedPdfJobs === 0 ? "Healthy" : "Degraded"
        }
      }
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: publicMessage(err) }, { status: 500 });
  }
}
