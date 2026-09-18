import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/apiKey";
import { getVerifiedSession } from "@/lib/authGuard";

export async function POST() {
  try {
    const session = await getVerifiedSession();
    if (!session || !session.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const sessionEmail = session.email;

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
