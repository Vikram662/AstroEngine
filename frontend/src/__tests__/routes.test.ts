import { beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "crypto";
import { NextRequest } from "next/server";

// ── Mocked Prisma ───────────────────────────────────────────────────────────
const db = vi.hoisted(() => {
  const m = {
    systemSetting: { findUnique: vi.fn(), findMany: vi.fn() },
    invoice: { findUnique: vi.fn(), create: vi.fn() },
    invoiceCounter: { upsert: vi.fn() },
    notification: { createMany: vi.fn(async () => ({ count: 0 })) },
    transaction: { findFirst: vi.fn(), updateMany: vi.fn() },
    subscriptionPlan: { findUnique: vi.fn() },
    subscription: { upsert: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    apiRequestLog: { findUnique: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  };
  return m;
});
vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { POST as webhook } from "@/app/api/billing/webhook/route";
import { POST as refund } from "@/app/api/internal/refund/route";

const WEBHOOK_SECRET = "whsec_unit_test_secret_123";

function webhookReq(body: object, secret = WEBHOOK_SECRET, sig?: string) {
  const raw = JSON.stringify(body);
  const signature = sig ?? crypto.createHmac("sha256", secret).update(raw).digest("hex");
  return new NextRequest("http://x/api/billing/webhook", {
    method: "POST",
    body: raw,
    headers: { "x-razorpay-signature": signature },
  });
}

const captured = (amountRupees: number, planTier?: string) => ({
  event: "payment.captured",
  payload: {
    payment: {
      entity: {
        id: "pay_1",
        order_id: "order_1",
        amount: Math.round(amountRupees * 100),
        notes: planTier ? { planTier } : {},
      },
    },
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  db.$transaction.mockImplementation(async (fn: (tx: typeof db) => unknown) => fn(db));
  db.systemSetting.findUnique.mockResolvedValue({ value: WEBHOOK_SECRET });
  db.transaction.findFirst.mockResolvedValue({ id: "t1", userId: "u1", amount: 1, status: "PENDING", gatewayPaymentId: null });
  db.transaction.updateMany.mockResolvedValue({ count: 1 });
  db.user.findUnique.mockResolvedValue({ planTier: "STARTER", name: "U", email: "u@example.com", taxProfile: null });
  db.systemSetting.findMany.mockResolvedValue([]);
  db.invoice.findUnique.mockResolvedValue(null);
  db.invoiceCounter.upsert.mockResolvedValue({ lastSeq: 7 });
  db.invoice.create.mockImplementation(async ({ data }: { data: object }) => data);
  db.subscriptionPlan.findUnique.mockImplementation(async ({ where }: { where: { tier: string } }) =>
    where.tier === "ENTERPRISE"
      ? { tier: "ENTERPRISE", priceMonthly: 39999, includedQuota: 1500000, rateLimitPerMin: 1200 }
      : { tier: "STARTER", priceMonthly: 4999, includedQuota: 35000, rateLimitPerMin: 60 }
  );
});

describe("POST /api/billing/webhook", () => {
  it("refuses events when no usable secret is configured (public dummy value, nothing in env)", async () => {
    db.systemSetting.findUnique.mockResolvedValue({ value: "whsec_astro_enterprise_live2026" });
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    const res = await webhook(webhookReq(captured(1), "whsec_astro_enterprise_live2026"));
    expect(res.status).toBe(503);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("rejects a forged signature", async () => {
    const res = await webhook(webhookReq(captured(1), WEBHOOK_SECRET, "deadbeef"));
    expect(res.status).toBe(400);
    expect(db.transaction.updateMany).not.toHaveBeenCalled();
  });

  it("rejects an amount that differs from the recorded order", async () => {
    const res = await webhook(webhookReq(captured(999)));
    expect(res.status).toBe(400);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("does NOT activate ENTERPRISE for a Rs 1 order, it only credits the wallet", async () => {
    const res = await webhook(webhookReq(captured(1, "ENTERPRISE")));
    expect(res.status).toBe(200);
    expect(db.subscription.upsert).not.toHaveBeenCalled();
    expect(db.invoice.create).not.toHaveBeenCalled(); // a top-up is a deposit: no tax invoice
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { walletBalance: { increment: 1 } } })
    );
  });

  it("activates the plan when the paid amount covers it", async () => {
    db.transaction.findFirst.mockResolvedValue({ id: "t1", userId: "u1", amount: 35000, status: "PENDING", gatewayPaymentId: null });
    const res = await webhook(webhookReq(captured(35000, "ENTERPRISE")));
    expect(res.status).toBe(200);
    expect(db.subscription.upsert).toHaveBeenCalledTimes(1);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ planTier: "ENTERPRISE" }) })
    );
    // the sale gets a consecutive GST invoice number in the same transaction
    const inv = db.invoice.create.mock.calls[0][0].data;
    expect(inv.number).toMatch(/^AE\/\d{2}-\d{2}\/000007$/);
    expect(inv).toMatchObject({ type: "SALE", userId: "u1", transactionId: "t1", gross: 35000 });
  });

  it("is idempotent for already settled orders", async () => {
    db.transaction.findFirst.mockResolvedValue({ id: "t1", userId: "u1", amount: 1, status: "SUCCESS" });
    const res = await webhook(webhookReq(captured(1)));
    expect(res.status).toBe(200);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("credits a wallet top-up with the bonus tier exactly once", async () => {
    db.transaction.findFirst.mockResolvedValue({ id: "t1", userId: "u1", amount: 5000, status: "PENDING", gatewayPaymentId: null });
    const res = await webhook(webhookReq(captured(5000)));
    expect(res.status).toBe(200);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { walletBalance: { increment: 5000 * 1.16 } } })
    );
  });
});

// ── Refund route ─────────────────────────────────────────────────────────────
function refundReq(body: object, secret: string | null = "test-internal-secret") {
  return new NextRequest("http://x/api/internal/refund", {
    method: "POST",
    body: JSON.stringify(body),
    headers: secret ? { "x-internal-secret": secret } : {},
  });
}

describe("POST /api/internal/refund", () => {
  beforeEach(() => {
    db.$transaction.mockImplementation(async (fn: (tx: typeof db) => unknown) => fn(db));
    db.apiRequestLog.findUnique.mockResolvedValue({ id: BigInt(42), userId: "u1", creditsCost: 0, statusCode: 200 });
    db.apiRequestLog.updateMany.mockResolvedValue({ count: 1 });
    db.user.updateMany.mockResolvedValue({ count: 1 });
    db.$queryRaw.mockResolvedValue([{ addonUsage: { pdf: 3 } }]); // the row read under FOR UPDATE
  });

  it("requires the internal secret", async () => {
    expect((await refund(refundReq({ receiptId: "42", deductionType: "QUOTA" }, null))).status).toBe(403);
    expect((await refund(refundReq({ receiptId: "42", deductionType: "QUOTA" }, "wrong"))).status).toBe(403);
  });

  it("validates input", async () => {
    expect((await refund(refundReq({ receiptId: "4x2", deductionType: "QUOTA" }))).status).toBe(400);
    expect((await refund(refundReq({ receiptId: "42", deductionType: "HACK" }))).status).toBe(400);
  });

  it("returns plan quota for a QUOTA call", async () => {
    const res = await refund(refundReq({ receiptId: "42", deductionType: "QUOTA", httpStatus: 422 }));
    const json = await res.json();
    expect(json).toMatchObject({ refunded: true, creditsReturned: 0 });
    expect(db.apiRequestLog.updateMany).toHaveBeenCalledWith({ where: { id: BigInt(42), statusCode: 200 }, data: { statusCode: 422 } });
    expect(db.user.updateMany).toHaveBeenCalledWith({ where: { id: "u1", monthlyUsage: { gt: 0 } }, data: { monthlyUsage: { decrement: 1 } } });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("refunds the wallet amount stored in the server log, not a caller-supplied value", async () => {
    db.apiRequestLog.findUnique.mockResolvedValue({ id: BigInt(42), userId: "u1", creditsCost: 0.02, statusCode: 200 });
    const res = await refund(refundReq({ receiptId: "42", deductionType: "WALLET_CREDIT", creditsDeducted: 99999 }));
    expect((await res.json()).creditsReturned).toBe(0.02);
    expect(db.user.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { walletBalance: { increment: 0.02 } } });
  });

  it("is exactly-once: a second refund for the same receipt changes nothing", async () => {
    db.apiRequestLog.updateMany.mockResolvedValue({ count: 0 });
    const json = await (await refund(refundReq({ receiptId: "42", deductionType: "QUOTA" }))).json();
    expect(json.refunded).toBe(false);
    expect(db.user.updateMany).not.toHaveBeenCalled();
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("rejects a deduction type that contradicts the receipt", async () => {
    // the log says nothing was charged to the wallet, but the caller claims WALLET_CREDIT
    expect((await refund(refundReq({ receiptId: "42", deductionType: "WALLET_CREDIT" }))).status).toBe(400);
  });

  it("decrements the add-on counter for ADDON_QUOTA", async () => {
    await refund(refundReq({ receiptId: "42", deductionType: "ADDON_QUOTA", addonId: "pdf" }));
    expect(db.user.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { addonUsage: { pdf: 2 } } });
    // the usage is read with a row lock inside the refund transaction
    expect(db.$queryRaw.mock.calls[0][0].join("?")).toContain("FOR UPDATE");
  });

  it("404s for an unknown receipt", async () => {
    db.apiRequestLog.findUnique.mockResolvedValue(null);
    expect((await refund(refundReq({ receiptId: "7", deductionType: "QUOTA" }))).status).toBe(404);
  });
});
