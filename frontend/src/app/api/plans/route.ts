import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" }
    });

    return NextResponse.json({
      status: "success",
      data: plans
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({
      status: "error",
      message: error?.message || "Failed to fetch subscription plans from database",
      data: []
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tier, name, priceMonthly, includedQuota, rateLimitPerMin, overageCost, features, isPopular } = body;

    const plan = await prisma.subscriptionPlan.upsert({
      where: { tier },
      update: {
        name,
        priceMonthly: parseFloat(priceMonthly),
        includedQuota: parseInt(includedQuota),
        rateLimitPerMin: parseInt(rateLimitPerMin),
        overageCost: parseFloat(overageCost),
        features,
        isPopular: !!isPopular
      },
      create: {
        tier,
        name,
        priceMonthly: parseFloat(priceMonthly),
        includedQuota: parseInt(includedQuota),
        rateLimitPerMin: parseInt(rateLimitPerMin),
        overageCost: parseFloat(overageCost),
        features,
        isPopular: !!isPopular
      }
    });

    return NextResponse.json({ status: "success", plan });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
