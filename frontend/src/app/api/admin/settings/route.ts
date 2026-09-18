import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/settings - Read ALL dynamic system settings directly from MySQL table
export async function GET() {
  try {
    const existing = await prisma.systemSetting.findMany({
      orderBy: { key: "asc" }
    });

    const settingsMap: Record<string, string> = {};
    for (const s of existing) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({
      status: "success",
      data: settingsMap,
      raw: existing
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}

// POST /api/admin/settings - Save or Add any dynamic setting from Admin panel
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionRole = cookieStore.get("astro_session_role")?.value;

    if (sessionRole !== "ADMIN" && sessionRole !== "SUPER_ADMIN") {
      return NextResponse.json({ status: "error", message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updates: Array<{ key: string; value: string; category?: string; description?: string }> = body.settings || [];

    for (const item of updates) {
      if (!item.key) continue;
      await prisma.systemSetting.upsert({
        where: { key: item.key },
        update: { 
          value: String(item.value ?? "") 
        },
        create: {
          key: item.key,
          value: String(item.value ?? ""),
          category: item.category || "GENERAL",
          description: item.description || null
        }
      });
    }

    return NextResponse.json({
      status: "success",
      message: "Database settings updated successfully"
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/settings - Delete a custom setting key dynamically
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionRole = cookieStore.get("astro_session_role")?.value;

    if (sessionRole !== "ADMIN" && sessionRole !== "SUPER_ADMIN") {
      return NextResponse.json({ status: "error", message: "Forbidden" }, { status: 403 });
    }

    const { key } = await req.json();
    if (!key) {
      return NextResponse.json({ status: "error", message: "Key required" }, { status: 400 });
    }

    await prisma.systemSetting.delete({
      where: { key }
    });

    return NextResponse.json({
      status: "success",
      message: `Setting ${key} deleted`
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
