import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toJsonSafe } from "@/lib/money";

export async function GET() {
  try {
    const tiers = await prisma.walletRechargeTier.findMany({
      where: { isActive: true },
      orderBy: { amount: "asc" }
    });

    return NextResponse.json({
      status: "success",
      data: toJsonSafe(tiers)
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({
      status: "error",
      message: error?.message || "Failed to fetch recharge tiers from database",
      data: []
    }, { status: 500 });
  }
}
