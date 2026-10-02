import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Per-add-on monthly usage lives in one JSON column (User.addonUsage). JSON cannot be
// incremented in place, so every read-modify-write of it runs in a transaction that
// first locks the user's row: concurrent calls then queue up instead of each writing
// back a stale copy (which let customers exceed their add-on quota and lost counts).

export type AddonUsage = Record<string, number>;

export function parseAddonUsage(raw: unknown): AddonUsage {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as AddonUsage) } : {};
}

/** Locks the user's row until the transaction ends and returns its current add-on usage. */
export async function lockAddonUsage(tx: Prisma.TransactionClient, userId: string): Promise<AddonUsage> {
  const rows = await tx.$queryRaw<{ addonUsage: unknown }[]>`SELECT addonUsage FROM \`User\` WHERE id = ${userId} FOR UPDATE`;
  return parseAddonUsage(rows[0]?.addonUsage);
}

export type AddonClaim = { result: "INCLUDED" | "OVERAGE" | "EXHAUSTED"; used: number };

/**
 * Meters one unit of `addonId` for the user: free while the month's usage is below
 * `included`, otherwise `overageCost` is debited from the wallet if it covers it.
 * `used` is the usage before this call.
 */
export async function claimAddonUnit(userId: string, addonId: string, included: number, overageCost: number): Promise<AddonClaim> {
  return prisma.$transaction(async (tx: Prisma.TransactionClient): Promise<AddonClaim> => {
    const usage = await lockAddonUsage(tx, userId);
    const used = Number(usage[addonId] || 0);
    const data = { addonUsage: { ...usage, [addonId]: used + 1 }, monthlyUsage: { increment: 1 }, apiKeyLastUsedAt: new Date() };

    if (used < included) {
      await tx.user.update({ where: { id: userId }, data });
      return { result: "INCLUDED", used };
    }
    const debit = await tx.user.updateMany({
      where: { id: userId, walletBalance: { gte: overageCost } },
      data: { ...data, walletBalance: { decrement: overageCost } },
    });
    return { result: debit.count === 1 ? "OVERAGE" : "EXHAUSTED", used };
  });
}
