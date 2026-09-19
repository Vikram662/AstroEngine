import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";

export async function GET(req: NextRequest) {
  try {
    const session = await getVerifiedSession();
    if (!session || !session.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.email }
    });

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    // Parse pagination parameters
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get("limit") || "15", 10)));
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const skip = (page - 1) * limit;

    // Build filter
    const whereClause: {
      userId: string;
      OR?: Array<{ endpoint?: { contains: string }; module?: { contains: string } }>;
    } = {
      userId: user.id
    };

    if (search) {
      whereClause.OR = [
        { endpoint: { contains: search } },
        { module: { contains: search } }
      ];
    }

    // Parallel fetch: Paginated logs + Total Count + Global Metrics
    const [logs, totalFilteredCount, totalLifetimeCalls] = await Promise.all([
      prisma.apiRequestLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.apiRequestLog.count({
        where: whereClause
      }),
      prisma.apiRequestLog.count({
        where: { userId: user.id }
      })
    ]);

    const serialized = logs.map((l: { id: bigint; createdAt: Date; responseTime: number; statusCode: number; creditsCost: number; [key: string]: unknown }) => ({
      ...l,
      id: l.id.toString(),
      responseTime: l.responseTime || 0,
      creditsCost: l.creditsCost || 0,
      createdAt: l.createdAt.toISOString().replace("T", " ").substring(0, 19)
    }));

    // Dynamic aggregates from user's recent records
    const recentMetricsSample = await prisma.apiRequestLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { responseTime: true, statusCode: true, creditsCost: true }
    });

    const sampleCount = recentMetricsSample.length;
    const avgLatency = sampleCount > 0
      ? Math.round(recentMetricsSample.reduce((acc, curr) => acc + (curr.responseTime || 0), 0) / sampleCount)
      : 0;
    const successCount = recentMetricsSample.filter((l) => (l.statusCode ?? 200) >= 200 && (l.statusCode ?? 200) < 300).length;
    const successRate = sampleCount > 0
      ? ((successCount / sampleCount) * 100).toFixed(1)
      : "100.0";
    const totalCreditsDeducted = recentMetricsSample.reduce((acc, curr) => acc + (curr.creditsCost || 0), 0);

    const totalPages = Math.ceil(totalFilteredCount / limit) || 1;

    return NextResponse.json({
      status: "success",
      logs: serialized,
      pagination: {
        page,
        limit,
        totalItems: totalFilteredCount,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages
      },
      metrics: {
        totalCalls: totalLifetimeCalls,
        avgLatency,
        successRate: `${successRate}%`,
        creditsDeducted: totalCreditsDeducted
      }
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
