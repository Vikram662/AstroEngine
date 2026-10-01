import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toMoney } from "@/lib/money";

const WALLET_TYPES = ["WALLET_CREDIT", "ADDON_OVERAGE"];
const QUOTA_TYPES = ["QUOTA", "ADDON_QUOTA"];

export type RefundResult =
  | { ok: true; refunded: boolean; creditsReturned: number }
  | { ok: false; status: number; message: string };

export interface Receipt {
  receiptId: string;
  deductionType: string;
  addonId?: string | null;
}

export function isValidReceipt(r: { receiptId?: unknown; deductionType?: unknown }): boolean {
  return (
    typeof r.receiptId === "string" &&
    /^\d{1,18}$/.test(r.receiptId) &&
    typeof r.deductionType === "string" &&
    [...WALLET_TYPES, ...QUOTA_TYPES].includes(r.deductionType)
  );
}

/**
 * Returns the quota / wallet credit of one metered call, exactly once.
 * The ApiRequestLog row is the receipt: it is claimed by moving its statusCode away
 * from 200 inside the same transaction that gives the credit back, so a repeated or
 * concurrent refund for the same receipt changes nothing. The amount always comes
 * from our own log row, never from the caller.
 */
export async function applyRefund(receipt: Receipt, httpStatus = 500): Promise<RefundResult> {
  if (!isValidReceipt(receipt)) return { ok: false, status: 400, message: "Invalid refund request." };
  const status = Math.min(599, Math.max(400, Number(httpStatus) || 500));
  const addonId = receipt.addonId ?? null;

  const log = await prisma.apiRequestLog.findUnique({ where: { id: BigInt(receipt.receiptId) } });
  if (!log) return { ok: false, status: 404, message: "Receipt not found." };

  const credits = toMoney(log.creditsCost);
  const isWallet = credits > 0;
  if (isWallet !== WALLET_TYPES.includes(receipt.deductionType)) {
    return { ok: false, status: 400, message: "Receipt does not match deduction type." };
  }

  const refunded = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const claim = await tx.apiRequestLog.updateMany({
      where: { id: log.id, statusCode: 200 },
      data: { statusCode: status },
    });
    if (claim.count !== 1) return false; // already refunded / settled

    await tx.user.updateMany({
      where: { id: log.userId, monthlyUsage: { gt: 0 } },
      data: { monthlyUsage: { decrement: 1 } },
    });

    if (isWallet) {
      await tx.user.update({ where: { id: log.userId }, data: { walletBalance: { increment: credits } } });
    }

    if (addonId && receipt.deductionType.startsWith("ADDON")) {
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

  return { ok: true, refunded, creditsReturned: refunded ? credits : 0 };
}
