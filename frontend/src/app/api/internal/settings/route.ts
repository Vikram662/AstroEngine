import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const INTERNAL_SECRET = process.env.ASTRO_INTERNAL_SECRET || "c9f82d1a6e3b5c7f8a9e0d1b2";

// GET /api/internal/settings - Secure internal route for Python backend to load dynamic settings from MySQL
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("x-internal-secret");
    if (authHeader !== INTERNAL_SECRET) {
      return NextResponse.json(
        { status: "error", message: "Forbidden internal handshake" },
        { status: 403 }
      );
    }

    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({
      status: "success",
      data: settingsMap
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { status: "error", message: err.message || "Failed to load dynamic settings" },
      { status: 500 }
    );
  }
}
