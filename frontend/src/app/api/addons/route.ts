import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public add-on catalogue used by the pricing page. Account-specific activation
// state remains available only from /api/user/addons.
export async function GET() {
  try {
    const addons = await prisma.addonPackage.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" },
    });

    return NextResponse.json({ status: "success", data: addons });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load add-ons.";
    return NextResponse.json({ status: "error", message, data: [] }, { status: 500 });
  }
}
