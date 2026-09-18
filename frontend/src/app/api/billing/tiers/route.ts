import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const DEFAULT_WALLET_TIERS = [
  { amount: 500, credits: 500, bonusPercent: 0, label: "Starter Pack", isPopular: false },
  { amount: 2000, credits: 2200, bonusPercent: 10, label: "Growth Pack (10% Bonus)", isPopular: true },
  { amount: 5000, credits: 5800, bonusPercent: 16, label: "Agency Pack (16% Bonus)", isPopular: false },
  { amount: 10000, credits: 12500, bonusPercent: 25, label: "Enterprise Volume (25% Bonus)", isPopular: false },
];

export async function GET() {
  try {
    let tiers = await prisma.walletRechargeTier.findMany({
      where: { isActive: true },
      orderBy: { amount: "asc" }
    });

    if (!tiers || tiers.length === 0) {
      for (const t of DEFAULT_WALLET_TIERS) {
        await prisma.walletRechargeTier.upsert({
          where: { amount: t.amount },
          update: {},
          create: t
        });
      }
      tiers = await prisma.walletRechargeTier.findMany({
        where: { isActive: true },
        orderBy: { amount: "asc" }
      });
    }

    return NextResponse.json({
      status: "success",
      data: tiers
    });
  } catch (err) {
    return NextResponse.json({
      status: "success",
      data: DEFAULT_WALLET_TIERS
    });
  }
}
