import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { hasValidInternalSecret } from "@/lib/internalAuth";
import { meterCall } from "@/lib/metering";

// POST /api/internal/verify-key - Fast verification & quota/wallet debit for Python FastAPI engine
export async function POST(req: NextRequest) {
  try {
    if (!hasValidInternalSecret(req)) {
      return NextResponse.json(
        { status: "error", message: "Forbidden internal handshake" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { apiKey, responseTime = 10 } = body;
    const endpoint: string = typeof body.endpoint === "string" ? body.endpoint : "/api/v1/general";
    const moduleName: string = typeof body.module === "string" ? body.module : "GENERAL";

    if (!apiKey || typeof apiKey !== "string" || apiKey.length > 256) {
      return NextResponse.json({
        valid: false,
        error_code: "MISSING_KEY",
        message: "Missing 'x-api-key' header. Please provide your active API key."
      }, { status: 401 });
    }

    // SHA-256 hash
    const cleanedKey = apiKey.trim();
    const keyHash = crypto.createHash("sha256").update(cleanedKey).digest("hex");

    // Look up user strictly by cryptographic apiKeyHash
    const user = await prisma.user.findFirst({
      where: {
        apiKeyHash: keyHash
      },
      include: {
        subscription: true
      }
    });

    if (!user) {
      return NextResponse.json({
        valid: false,
        error_code: "INVALID_KEY",
        message: "Invalid API key. The provided token does not match any registered developer account."
      }, { status: 401 });
    }

    // Check if user is blocked by Admin
    if (user.isBlocked) {
      return NextResponse.json({
        valid: false,
        error_code: "ACCOUNT_SUSPENDED",
        message: "Your developer account has been suspended. Please contact support@astroengine.io."
      }, { status: 403 });
    }

    return await meterCall(user, endpoint, moduleName, responseTime);
  } catch (error: unknown) {
    console.error("[verify-key]", error);
    return NextResponse.json({
      valid: false,
      error_code: "SERVER_ERROR",
      message: "Internal auth error"
    }, { status: 500 });
  }
}
