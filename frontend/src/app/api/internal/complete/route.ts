import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasValidInternalSecret } from "@/lib/internalAuth";

// POST /api/internal/complete { receiptId, responseTimeMs }
// Called by the Python engine after a metered call SUCCEEDED, so the usage log shows the
// real latency instead of a placeholder. Failed calls are handled by /api/internal/refund
// (which also records their status code). Only an untouched receipt can be completed.
export async function POST(req: NextRequest) {
  try {
    if (!hasValidInternalSecret(req)) {
      return NextResponse.json({ status: "error", message: "Forbidden internal handshake" }, { status: 403 });
    }
    const body = await req.json().catch(() => null);
    const receiptId = String(body?.receiptId ?? "");
    const ms = Math.round(Number(body?.responseTimeMs));
    if (!/^\d{1,18}$/.test(receiptId) || !Number.isFinite(ms) || ms < 0) {
      return NextResponse.json({ status: "error", message: "Invalid request." }, { status: 400 });
    }

    const res = await prisma.apiRequestLog.updateMany({
      where: { id: BigInt(receiptId), statusCode: 200 },
      data: { responseTime: Math.min(ms, 600_000) },
    });
    return NextResponse.json({ status: "success", updated: res.count === 1 });
  } catch (error: unknown) {
    console.error("[internal/complete]", error);
    return NextResponse.json({ status: "error", message: "Failed." }, { status: 500 });
  }
}
