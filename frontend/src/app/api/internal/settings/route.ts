import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getInternalSecret(): string {
  const secret = process.env.ASTRO_INTERNAL_SECRET;
  if (!secret) {
    throw new Error("CRITICAL SECURITY ERROR: ASTRO_INTERNAL_SECRET must be configured in environment.");
  }
  return secret;
}

// GET /api/internal/settings - Secure internal route for Python backend to load dynamic settings from MySQL
export async function GET(req: NextRequest) {
  try {
    const internalSecret = getInternalSecret();
    const authHeader = req.headers.get("x-internal-secret");
    if (!authHeader || authHeader !== internalSecret) {
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
