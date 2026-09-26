import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CheckoutTargetType = "PLAN" | "ADDON";

export interface ResolvedOffer {
  id: string;
  code: string;
  title: string;
  targetType: CheckoutTargetType;
  targetId: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

export class OfferValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OfferValidationError";
  }
}

const money = (value: number) => Math.max(0, Math.round(value * 100) / 100);

export async function resolveOfferForUser(args: {
  userId: string;
  code?: string | null;
  targetType: CheckoutTargetType;
  targetId: string;
  amount: number;
}): Promise<ResolvedOffer | null> {
  const code = args.code?.trim().toUpperCase();
  if (!code) return null;

  const offer = await (prisma as any).offer.findUnique({
    where: { code },
    include: {
      redemptions: {
        where: { userId: args.userId },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!offer || !offer.isActive) {
    throw new OfferValidationError("This offer code is invalid or inactive.");
  }

  const now = new Date();
  if (new Date(offer.startsAt) > now) {
    throw new OfferValidationError("This offer has not started yet.");
  }
  if (new Date(offer.endsAt) < now) {
    throw new OfferValidationError("This offer has expired.");
  }
  if (offer.scope === "PERSONALIZED" && offer.assignedUserId !== args.userId) {
    throw new OfferValidationError("This personalized offer is not assigned to your account.");
  }
  if (offer.targetType !== args.targetType || (offer.targetId && offer.targetId !== args.targetId)) {
    throw new OfferValidationError("This offer is not valid for the selected package.");
  }
  if (offer.redemptions?.length) {
    throw new OfferValidationError("This one-time offer has already been used on your account.");
  }

  const originalAmount = money(Number(args.amount));
  if (originalAmount < Number(offer.minimumAmount || 0)) {
    throw new OfferValidationError(`A minimum purchase of ₹${Number(offer.minimumAmount).toFixed(2)} is required.`);
  }

  let discountAmount = offer.discountType === "PERCENT"
    ? originalAmount * (Number(offer.discountValue) / 100)
    : Number(offer.discountValue);
  if (offer.maxDiscount !== null && offer.maxDiscount !== undefined) {
    discountAmount = Math.min(discountAmount, Number(offer.maxDiscount));
  }
  discountAmount = money(Math.min(originalAmount, Math.max(0, discountAmount)));

  if (discountAmount <= 0) {
    throw new OfferValidationError("This offer does not provide a valid discount for this package.");
  }

  return {
    id: offer.id,
    code: offer.code,
    title: offer.title,
    targetType: args.targetType,
    targetId: args.targetId,
    originalAmount,
    discountAmount,
    finalAmount: money(originalAmount - discountAmount),
  };
}

export async function recordOfferRedemption(
  tx: Prisma.TransactionClient,
  userId: string,
  offer: ResolvedOffer | null,
  orderReference?: string | null,
) {
  if (!offer) return;
  await (tx as any).offerRedemption.create({
    data: {
      offerId: offer.id,
      userId,
      targetType: offer.targetType,
      targetId: offer.targetId,
      originalAmount: offer.originalAmount,
      discountAmount: offer.discountAmount,
      finalAmount: offer.finalAmount,
      orderReference: orderReference || null,
    },
  });
}
