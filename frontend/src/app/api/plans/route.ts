import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" }
    });

    const defaultPerms: Record<string, string[]> = {
      STARTER: ["core", "panchang", "parashari", "remedies", "general"],
      PRO: ["core", "panchang", "parashari", "dasha", "kp", "dosha", "matching", "dosha_matching", "remedies", "numerology", "western", "lalkitab", "advanced", "general"],
      ENTERPRISE: ["*"]
    };

    const plansWithPerms = await Promise.all(
      plans.map(async (p: any) => {
        const setting = await prisma.systemSetting.findUnique({
          where: { key: `PLAN_MODULES_${p.tier}` }
        });
        const allowedModules = setting?.value
          ? setting.value.split(",").map((m: string) => m.trim().toLowerCase())
          : (defaultPerms[p.tier] || ["*"]);

        return {
          ...p,
          allowedModules
        };
      })
    );

    return NextResponse.json({
      status: "success",
      data: plansWithPerms
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
    const { 
      tier, 
      name, 
      priceMonthly, 
      includedQuota, 
      rateLimitPerMin, 
      overageCost, 
      features, 
      isPopular,
      allowedModules 
    } = body;

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

    // Save dynamic module permissions in SystemSetting
    if (Array.isArray(allowedModules)) {
      const permValue = allowedModules.join(",");
      await prisma.systemSetting.upsert({
        where: { key: `PLAN_MODULES_${tier}` },
        update: { value: permValue },
        create: {
          key: `PLAN_MODULES_${tier}`,
          value: permValue,
          category: "PERMISSIONS",
          description: `Allowed API modules for ${tier} tier accounts`
        }
      });
    }

    return NextResponse.json({ status: "success", plan, allowedModules });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
