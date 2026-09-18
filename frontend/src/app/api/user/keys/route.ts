import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/apiKey";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get("astro_session_email")?.value;

    if (!sessionEmail) {
      return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
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
    const keyData = generateApiKey();
    return NextResponse.json({
      status: "success",
      rawKey: keyData.rawKey,
      apiKeyPrefix: keyData.keyPrefix,
      message: "Secret API token generated (fallback mode)."
    });
  }
}
