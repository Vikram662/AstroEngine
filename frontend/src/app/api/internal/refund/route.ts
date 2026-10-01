import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasValidInternalSecret } from "@/lib/internalAuth";
import { toMoney } from "@/lib/money";

const WALLET_TYPES = ["WALLET_CREDIT", "ADDON_OVERAGE"];
const QUOTA_TYPES = ["QUOTA", "ADDON_QUOTA"];

// POST /api/internal/refund
// Called by the Python engine when a billed API call did not produce a result
// (HTTP >= 400, or an async PDF job that failed). Idempotent per receipt: the
// ApiRequestLog row is claimed by flipping its statusCode away from 200 inside
// the same transaction that returns the quota / wallet credit.
export async function POST(req: NextRequest) {
  try {
    if (!hasValidInternalSecret(req)) {
      return NextResponse.json({ status: "error", message: "Forbidden internal handshake" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const receiptId = String(body?.receiptId ?? "");
    const deductionType = String(body?.deductionType ?? "");
    const addonId = typeof body?.addonId === "string" ? body.addonId : null;
    const httpStatus = Math.min(599, Math.max(400, Number(body?.httpStatus) || 500));

    if (!/^\d{1,18}$/.test(receiptId) || ![...WALLET_TYPES, ...QUOTA_TYPES].includes(deductionType)) {
      return NextResponse.json({ status: "error", message: "Invalid refund request." }, { status: 400 });
    }

    const log = await prisma.apiRequestLog.findUnique({ where: { id: BigInt(receiptId) } });
    if (!log) {
      return NextResponse.json({ status: "error", message: "Receipt not found." }, { status: 404 });
    }

    // The amount comes from our own record, never from the caller.
    const credits = toMoney(log.creditsCost);
    const isWallet = credits > 0;
    if (isWallet !== WALLET_TYPES.includes(deductionType)) {
      return NextResponse.json({ status: "error", message: "Receipt does not match deduction type." }, { status: 400 });
    }

    const refunded = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const claim = await tx.apiRequestLog.updateMany({
        where: { id: log.id, statusCode: 200 },
        data: { statusCode: httpStatus },
      });
      if (claim.count !== 1) return false; // already refunded / settled

      await tx.user.updateMany({
        where: { id: log.userId, monthlyUsage: { gt: 0 } },
        data: { monthlyUsage: { decrement: 1 } },
      });

      if (isWallet) {
        await tx.user.update({ where: { id: log.userId }, data: { walletBalance: { increment: credits } } });
      }

      if (addonId && deductionType.startsWith("ADDON")) {
        const user = await tx.user.findUnique({ where: { id: log.userId }, select: { addonUsage: true } });
        const usage = (user?.addonUsage && typeof user.addonUsage === "object" ? user.addonUsage : {}) as Record<string, number>;
        if (Number(usage[addonId] || 0) > 0) {
          await tx.user.update({
            where: { id: log.userId },
            data: { addonUsage: { ...usage, [addonId]: Number(usage[addonId]) - 1 } },
          });
        }
      }
      return true;
    });

    return NextResponse.json({ status: "success", refunded, creditsReturned: refunded ? credits : 0 });
  } catch (error: unknown) {
    console.error("[internal/refund]", error);
    return NextResponse.json({ status: "error", message: "Refund failed." }, { status: 500 });
  }
}
