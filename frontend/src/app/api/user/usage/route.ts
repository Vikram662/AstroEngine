import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get("astro_session_email")?.value;

    if (!sessionEmail) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: sessionEmail }
    });

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const logs = await prisma.apiRequestLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    const serialized = logs.map((l: { id: bigint; createdAt: Date; responseTime: number; statusCode: number; creditsCost: number; [key: string]: unknown }) => ({
      ...l,
      id: l.id.toString(),
      responseTime: l.responseTime || 0,
      creditsCost: l.creditsCost || 0,
      createdAt: l.createdAt.toISOString().replace("T", " ").substring(0, 19)
    }));

    // Dynamic aggregates from user's actual database records
    const totalCalls = logs.length;
    const avgLatency = totalCalls > 0
      ? Math.round(logs.reduce((acc: number, curr: { responseTime?: number | null }) => acc + (curr.responseTime || 0), 0) / totalCalls)
      : 0;
    const successCount = logs.filter((l: { statusCode?: number }) => (l.statusCode ?? 200) >= 200 && (l.statusCode ?? 200) < 300).length;
    const successRate = totalCalls > 0
      ? ((successCount / totalCalls) * 100).toFixed(1)
      : "100.0";
    const totalCreditsDeducted = logs.reduce((acc: number, curr: { creditsCost?: number | null }) => acc + (curr.creditsCost || 0), 0);

    return NextResponse.json({
      status: "success",
      logs: serialized,
      metrics: {
        totalCalls,
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
