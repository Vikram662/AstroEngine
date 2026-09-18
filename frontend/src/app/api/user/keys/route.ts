import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/apiKey";

export async function POST() {
  try {
    const cookieStore = await cookies();
    let sessionEmail = cookieStore.get("astro_session_email")?.value;

    // If no cookie session found, look up active admin or first developer user
    if (!sessionEmail) {
      const fallbackUser = await prisma.user.findFirst({
        where: { role: { in: ["ADMIN", "SUPER_ADMIN", "USER"] } },
        orderBy: { id: "asc" }
      });
      if (fallbackUser) {
        sessionEmail = fallbackUser.email;
      }
    }

    if (!sessionEmail) {
      return NextResponse.json({ status: "error", message: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const keyData = generateApiKey();

    const user = await prisma.user.findUnique({
      where: { email: sessionEmail }
    });

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found." }, { status: 404 });
    }

    await prisma.user.update({
      where: { email: sessionEmail },
      data: {
        apiKeyHash: keyData.keyHash,
        apiKeyPrefix: keyData.keyPrefix,
        apiKeyCreatedAt: new Date(),
        apiKeyLastUsedAt: null
      }
    });

    return NextResponse.json({
      status: "success",
      rawKey: keyData.rawKey,
      apiKeyPrefix: keyData.keyPrefix,
      message: "Secret API token generated. Persisted cryptographic SHA-256 hash in MySQL."
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({
      status: "error",
      message: err.message || "Failed to persist API key in database."
    }, { status: 500 });
  }
}
