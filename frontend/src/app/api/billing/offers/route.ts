import { NextRequest, NextResponse } from "next/server";
import { getVerifiedSession } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { OfferValidationError, resolveOfferForUser } from "@/lib/offers";
import { toJsonSafe } from "@/lib/money";

export async function GET() {
  const session = await getVerifiedSession();
  const now = new Date();
  const offers = await prisma.offer.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
      OR: session
        ? [
            { scope: "GLOBAL" },
            { scope: "PERSONALIZED", assignedUserId: session.userId },
          ]
        : [{ scope: "GLOBAL" }],
      ...(session ? { redemptions: { none: { userId: session.userId } } } : {}),
    },
    select: {
      code: true,
      title: true,
      description: true,
      scope: true,
      targetType: true,
      targetId: true,
      discountType: true,
      discountValue: true,
      maxDiscount: true,
      minimumAmount: true,
      endsAt: true,
    },
    orderBy: [{ scope: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ status: "success", data: toJsonSafe(offers) });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedSession();
    if (!session) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const targetType = String(body.targetType || "").toUpperCase();
    if (targetType !== "PLAN" && targetType !== "ADDON") {
      return NextResponse.json({ status: "error", message: "Invalid offer target." }, { status: 400 });
    }
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 0 || !body.targetId) {
      return NextResponse.json({ status: "error", message: "A valid package and amount are required." }, { status: 400 });
    }

    const offer = await resolveOfferForUser({
      userId: session.userId,
      code: body.code,
      targetType,
      targetId: String(body.targetId),
      amount,
    });
    if (!offer) {
      return NextResponse.json({ status: "error", message: "Enter an offer code." }, { status: 400 });
    }
    return NextResponse.json({ status: "success", data: offer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Offer could not be validated.";
    return NextResponse.json(
      { status: "error", message },
      { status: error instanceof OfferValidationError ? 400 : 500 },
    );
  }
}
