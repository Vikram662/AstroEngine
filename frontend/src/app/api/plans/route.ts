import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const DEFAULT_PLANS = [
  {
    id: "plan_starter",
    tier: "STARTER",
    name: "STARTER",
    priceMonthly: 4999,
    includedQuota: 35000,
    rateLimitPerMin: 60,
    overageCost: 0.15,
    isPopular: false,
    features: [
      "Access to all 117 API Endpoints",
      "Core Astronomy & Planetary Positions",
      "Parashari D1 & D9 Charts + SVGs",
      "Panchang & Muhurat Calculations",
      "Community Discord Support",
      "Shared Rate Limits"
    ]
  },
  {
    id: "plan_pro",
    tier: "PRO",
    name: "PRO",
    priceMonthly: 14999,
    includedQuota: 150000,
    rateLimitPerMin: 300,
    overageCost: 0.10,
    isPopular: true,
    features: [
      "Everything in Starter",
      "White-Label PDF Reports Suite",
      "Custom Logo & Branding Injections",
      "Ashtakoota 36-Guna Matchmaking",
      "KP & Lal Kitab Full Engines",
      "Priority Email & Slack Channel"
    ]
  },
  {
    id: "plan_enterprise",
    tier: "ENTERPRISE",
    name: "ENTERPRISE",
    priceMonthly: 39999,
    includedQuota: 500000,
    rateLimitPerMin: 1200,
    overageCost: 0.07,
    isPopular: false,
    features: [
      "Everything in Pro",
      "Dedicated Redis In-Memory Cache",
      "Dedicated High-CPU Server Cluster",
      "Custom Sub-Lord Math Extensions",
      "99.99% SLA Uptime Guarantee",
      "Dedicated WhatsApp Account Manager"
    ]
  }
];

export async function GET() {
  try {
    let plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" }
    });

    if (!plans || plans.length === 0) {
      // Seed default plans into MySQL if empty
      for (const p of DEFAULT_PLANS) {
        await prisma.subscriptionPlan.upsert({
          where: { tier: p.tier as any },
          update: {},
          create: {
            tier: p.tier as any,
            name: p.name,
            priceMonthly: p.priceMonthly,
            includedQuota: p.includedQuota,
            rateLimitPerMin: p.rateLimitPerMin,
            overageCost: p.overageCost,
            features: p.features,
            isPopular: p.isPopular
          }
        });
      }
      plans = await prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { priceMonthly: "asc" }
      });
    }

    return NextResponse.json({
      status: "success",
      data: plans
    });
  } catch (err: unknown) {
    // Graceful fallback to default plans
    return NextResponse.json({
      status: "success",
      data: DEFAULT_PLANS
    });
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
