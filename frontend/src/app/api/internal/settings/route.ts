import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasValidInternalSecret } from "@/lib/internalAuth";

// Least privilege: the Python engine only needs object-storage settings.
// Payment-gateway and SMTP secrets are never exposed through this endpoint.
const BACKEND_SETTING_KEYS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_DOMAIN",
];

// GET /api/internal/settings - Secure internal route for Python backend to load dynamic settings from MySQL
export async function GET(req: NextRequest) {
  try {
    if (!hasValidInternalSecret(req)) {
      return NextResponse.json(
        { status: "error", message: "Forbidden internal handshake" },
        { status: 403 }
      );
    }

    const settings = await prisma.systemSetting.findMany({ where: { key: { in: BACKEND_SETTING_KEYS } } });
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({
      status: "success",
      data: settingsMap
    });
  } catch (error: unknown) {
    console.error("[internal/settings]", error);
    return NextResponse.json(
      { status: "error", message: "Failed to load dynamic settings" },
      { status: 500 }
    );
  }
}
