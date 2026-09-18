import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/authGuard";

// GET /api/admin/addons - Admin gets all addons directly from MySQL
export async function GET() {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ status: "error", message: "Forbidden: Admin authorization required." }, { status: 403 });
    }

    const addons = await (prisma as any).addonPackage.findMany({
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({
      status: "success",
      data: addons || []
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}

// POST /api/admin/addons - Create or update an addon package directly in MySQL
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ status: "error", message: "Forbidden: Admin authorization required." }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, category, priceMonthly, monthlyQuota, rateLimitPerMin, overageCost, description, features, icon, isActive } = body;

    if (!id || !name || priceMonthly === undefined) {
      return NextResponse.json(
        { status: "error", message: "id, name, and priceMonthly are required" },
        { status: 400 }
      );
    }

    const normalizedFeatures = Array.isArray(features)
      ? features
      : typeof features === "string"
      ? features.split("\n").map((f: string) => f.trim()).filter(Boolean)
      : [];

    const upserted = await (prisma as any).addonPackage.upsert({
      where: { id: id.toLowerCase().trim() },
      update: {
        name,
        category: category || "CALCULATIONS",
        priceMonthly: parseFloat(priceMonthly),
        monthlyQuota: monthlyQuota !== undefined ? parseInt(monthlyQuota) : 1000,
        rateLimitPerMin: rateLimitPerMin !== undefined ? parseInt(rateLimitPerMin) : 60,
        overageCost: overageCost !== undefined ? parseFloat(overageCost) : 0.05,
        description: description || "",
        features: normalizedFeatures,
        icon: icon || "Zap",
        isActive: isActive !== undefined ? Boolean(isActive) : true
      },
      create: {
        id: id.toLowerCase().trim(),
        name,
        category: category || "CALCULATIONS",
        priceMonthly: parseFloat(priceMonthly),
        monthlyQuota: monthlyQuota !== undefined ? parseInt(monthlyQuota) : 1000,
        rateLimitPerMin: rateLimitPerMin !== undefined ? parseInt(rateLimitPerMin) : 60,
        overageCost: overageCost !== undefined ? parseFloat(overageCost) : 0.05,
        description: description || "",
        features: normalizedFeatures,
        icon: icon || "Zap",
        isActive: isActive !== undefined ? Boolean(isActive) : true
      }
    });

    return NextResponse.json({
      status: "success",
      message: `Addon ${upserted.name} successfully saved to MySQL!`,
      data: upserted
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/addons - Delete or toggle inactive
export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ status: "error", message: "Forbidden: Admin authorization required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ status: "error", message: "Addon id required" }, { status: 400 });
    }

    await (prisma as any).addonPackage.delete({
      where: { id }
    });

    return NextResponse.json({
      status: "success",
      message: `Addon ${id} deleted successfully.`
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
