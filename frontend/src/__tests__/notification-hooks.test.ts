import { beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "crypto";
import { NextRequest } from "next/server";

// Every business event must reach the notification queue (which applies the user's switches).
const notifs = vi.hoisted(() => ({
  notify: vi.fn(async () => 1),
  safeEnqueue: vi.fn(async () => 1),
  kickWorker: vi.fn(),
}));
vi.mock("@/lib/notifications", () => notifs);

const db = vi.hoisted(() => {
  const m = {
    systemSetting: { findUnique: vi.fn(), findMany: vi.fn() },
    subscriptionPlan: { findUnique: vi.fn() },
    addonPackage: { findMany: vi.fn() },
    subscription: { upsert: vi.fn() },
    transaction: { findFirst: vi.fn(), updateMany: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    apiRequestLog: { create: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
    emailOtp: { findUnique: vi.fn(), deleteMany: vi.fn(), updateMany: vi.fn() },
    pdfGenerationJob: { update: vi.fn() },
    invoice: { findUnique: vi.fn(), create: vi.fn() },
    invoiceCounter: { upsert: vi.fn() },
    $transaction: vi.fn(),
  };
  return m;
});
vi.mock("@/lib/prisma", () => ({ prisma: db }));

const auth = vi.hoisted(() => ({ getVerifiedSession: vi.fn(), requireAdminSession: vi.fn() }));
vi.mock("@/lib/authGuard", () => auth);

const http = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("axios", () => ({ default: http }));

import { meterCall, type MeteredUser } from "@/lib/metering";
import { applyRefund } from "@/lib/billingRefund";
import { issueSaleInvoice } from "@/lib/invoicing";
import { reconcileJob } from "@/lib/pdfReconcile";
import { clearCache } from "@/lib/ttlCache";
import { hashOtp } from "@/lib/otp";
import { POST as webhook } from "@/app/api/billing/webhook/route";
import { PUT as resetPut } from "@/app/api/auth/reset/route";

const day = new Date().toISOString().substring(0, 10);
const month = day.substring(0, 7);
let uid = 0;
const user = (over: Record<string, unknown> = {}) =>
  ({
    id: `u${++uid}`, email: "u@example.com", role: "USER", planTier: "STARTER", isBlocked: false,
    walletBalance: 500, monthlyQuota: 100, monthlyUsage: 5, activeAddons: [], addonUsage: {}, subscription: null, ...over,
  }) as unknown as MeteredUser;

beforeEach(() => {
  vi.clearAllMocks();
  clearCache();
  db.$transaction.mockImplementation(async (fn: (t: typeof db) => unknown) => fn(db));
  db.systemSetting.findUnique.mockResolvedValue(null);
  db.systemSetting.findMany.mockResolvedValue([]);
  db.subscriptionPlan.findUnique.mockResolvedValue({ tier: "STARTER", name: "Starter", priceMonthly: 4999, includedQuota: 100, rateLimitPerMin: 60, overageCost: 0.5, features: [] });
  db.addonPackage.findMany.mockResolvedValue([]);
  db.user.updateMany.mockResolvedValue({ count: 1 });
  db.apiRequestLog.create.mockResolvedValue({ id: BigInt(9) });
});

describe("usage alerts from the metering core", () => {
  it("quota: one alert when usage crosses 80% and one at 100%, none in between", async () => {
    await meterCall(user({ monthlyUsage: 50 } as never), "/api/v1/core/planets", "core");
    expect(notifs.notify).not.toHaveBeenCalled();

    const a = user({ monthlyUsage: 79 } as never);   // 79 -> 80 = 80% of 100
    await meterCall(a, "/api/v1/core/planets", "core");
    expect(notifs.notify).toHaveBeenCalledWith(a.id, "QUOTA_80", { used: 80, quota: 100, plan: "STARTER" }, { dedupeKey: `QUOTA_80:${a.id}:${month}` });

    notifs.notify.mockClear();
    const b = user({ monthlyUsage: 99 } as never);   // 99 -> 100
    await meterCall(b, "/api/v1/core/planets", "core");
    expect(notifs.notify).toHaveBeenCalledWith(b.id, "QUOTA_100", expect.objectContaining({ used: 100 }), { dedupeKey: `QUOTA_100:${b.id}:${month}` });
  });

  it("low balance: alerts once a day when a wallet charge takes the balance under Rs 50", async () => {
    // quota used up, so the call is charged 0.5 from the wallet
    const u = user({ monthlyUsage: 100, walletBalance: 50.2 } as never);
    db.user.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValue({ count: 1 });
    await meterCall(u, "/api/v1/core/planets", "core");
    expect(notifs.notify).toHaveBeenCalledWith(u.id, "LOW_BALANCE", { balance: expect.any(Number) }, { dedupeKey: `LOW_BALANCE:${u.id}:${day}` });

    notifs.notify.mockClear();
    db.user.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValue({ count: 1 });
    await meterCall(u, "/api/v1/core/planets", "core");               // same user, same day
    expect(notifs.notify).not.toHaveBeenCalled();
  });

  it("a report charge that leaves the wallet below Rs 50 also raises the low-balance alert", async () => {
    const u = user({ walletBalance: 54 } as never);
    await meterCall(u, "/api/v1/pdf/kundli/brihat", "pdf");           // Rs 12 -> 42 left
    expect(notifs.notify).toHaveBeenCalledWith(u.id, "LOW_BALANCE", { balance: 42 }, expect.anything());
  });

  it("a healthy wallet and admins never raise alerts", async () => {
    await meterCall(user({ walletBalance: 500 } as never), "/api/v1/pdf/kundli/brihat", "pdf");
    await meterCall(user({ role: "ADMIN", walletBalance: 1, monthlyUsage: 99 } as never), "/api/v1/core/planets", "core");
    expect(notifs.notify).not.toHaveBeenCalled();
  });
});

describe("refund notification", () => {
  it("tells the customer when money came back, not for a returned quota unit", async () => {
    db.apiRequestLog.findUnique.mockResolvedValue({ id: BigInt(9), userId: "u9", module: "pdf", creditsCost: 12, statusCode: 200 });
    db.apiRequestLog.updateMany.mockResolvedValue({ count: 1 });
    db.user.update.mockResolvedValue({});
    await applyRefund({ receiptId: "9", deductionType: "WALLET_CREDIT" }, 500);
    expect(notifs.notify).toHaveBeenCalledWith("u9", "REFUND_ISSUED", { amount: 12, reason: "your report could not be generated" }, { dedupeKey: "REFUND:9" });

    notifs.notify.mockClear();
    db.apiRequestLog.findUnique.mockResolvedValue({ id: BigInt(10), userId: "u9", module: "core", creditsCost: 0, statusCode: 200 });
    await applyRefund({ receiptId: "10", deductionType: "QUOTA" }, 500);
    expect(notifs.notify).not.toHaveBeenCalled();
  });

  it("a second refund of the same receipt sends nothing", async () => {
    db.apiRequestLog.findUnique.mockResolvedValue({ id: BigInt(9), userId: "u9", module: "pdf", creditsCost: 12, statusCode: 200 });
    db.apiRequestLog.updateMany.mockResolvedValue({ count: 0 });
    await applyRefund({ receiptId: "9", deductionType: "WALLET_CREDIT" }, 500);
    expect(notifs.notify).not.toHaveBeenCalled();
  });
});

describe("invoice issued notification", () => {
  it("is queued inside the same transaction as the invoice", async () => {
    db.invoice.findUnique.mockResolvedValue(null);
    db.user.findUnique.mockResolvedValue({ name: "A", email: "a@example.com", taxProfile: null });
    db.invoiceCounter.upsert.mockResolvedValue({ lastSeq: 3 });
    db.invoice.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "inv1", ...data }));
    await issueSaleInvoice(db as never, { id: "t1", userId: "u1", amount: 118, creditsAdded: 0, paymentGateway: "WALLET", status: "SUCCESS" });
    expect(notifs.safeEnqueue).toHaveBeenCalledWith(db, "u1", "INVOICE_ISSUED", expect.objectContaining({ gross: 118, invoiceId: "inv1", number: expect.stringMatching(/^AE\/\d{2}-\d{2}\/000003$/) }), { dedupeKey: "INVOICE:inv1" });
  });

  it("a top-up creates neither an invoice nor a notification", async () => {
    await issueSaleInvoice(db as never, { id: "t2", userId: "u1", amount: 500, creditsAdded: 500, paymentGateway: "RAZORPAY", status: "SUCCESS" });
    expect(notifs.safeEnqueue).not.toHaveBeenCalled();
  });
});

describe("report ready / failed notifications", () => {
  const job = (over: Record<string, unknown> = {}) => ({
    id: "job1", userId: "u1", reportType: "kundli_basic", status: "PENDING", refunded: false, createdAt: new Date(),
    requestPayload: { billing: { receiptId: "9", deductionType: "WALLET_CREDIT", addonId: null } }, ...over,
  });
  beforeEach(() => {
    process.env.ASTRO_INTERNAL_API_KEY = "k";
    db.pdfGenerationJob.update.mockResolvedValue({});
    db.apiRequestLog.findUnique.mockResolvedValue({ id: BigInt(9), userId: "u1", module: "pdf", creditsCost: 5, statusCode: 200 });
    db.apiRequestLog.updateMany.mockResolvedValue({ count: 1 });
    db.user.update.mockResolvedValue({});
  });

  it("COMPLETED -> PDF_READY with the download link", async () => {
    http.get.mockResolvedValue({ data: { data: { status: "COMPLETED", file_url: "https://cdn/x.pdf" } } });
    await reconcileJob(job() as never);
    expect(notifs.notify).toHaveBeenCalledWith("u1", "PDF_READY", { reportType: "kundli_basic", jobId: "job1", downloadUrl: "https://cdn/x.pdf" }, { dedupeKey: "PDF_READY:job1" });
  });

  it("FAILED -> refund (and the refund e-mail) plus PDF_FAILED mentioning the refund", async () => {
    http.get.mockResolvedValue({ data: { data: { status: "FAILED" } } });
    await reconcileJob(job() as never);
    expect(notifs.notify).toHaveBeenCalledWith("u1", "REFUND_ISSUED", expect.objectContaining({ amount: 5 }), { dedupeKey: "REFUND:9" });
    expect(notifs.notify).toHaveBeenCalledWith("u1", "PDF_FAILED", { reportType: "kundli_basic", jobId: "job1", refunded: true }, { dedupeKey: "PDF_FAILED:job1" });
  });

  it("no change in state -> no notification", async () => {
    http.get.mockResolvedValue({ data: { data: { status: "PENDING" } } });
    await reconcileJob(job() as never);
    expect(notifs.notify).not.toHaveBeenCalled();
  });
});

describe("payment received notification (webhook)", () => {
  const SECRET = "whsec_notif_test_secret";
  const event = (amount: number) => ({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1", order_id: "order_1", amount: amount * 100, notes: {} } } } });
  const send = (body: object) => {
    const raw = JSON.stringify(body);
    return webhook(new NextRequest("http://x/api/billing/webhook", { method: "POST", body: raw, headers: { "x-razorpay-signature": crypto.createHmac("sha256", SECRET).update(raw).digest("hex") } }));
  };

  it("a verified recharge queues PAYMENT_RECEIVED in the settling transaction, once", async () => {
    db.systemSetting.findUnique.mockResolvedValue({ value: SECRET });
    db.transaction.findFirst.mockResolvedValue({ id: "t1", userId: "u1", amount: 500, status: "PENDING", gatewayPaymentId: null });
    db.transaction.updateMany.mockResolvedValue({ count: 1 });
    expect((await send(event(500))).status).toBe(200);
    expect(notifs.safeEnqueue).toHaveBeenCalledWith(db, "u1", "PAYMENT_RECEIVED", { amount: 500, creditsAdded: 500, description: "wallet top-up" }, { dedupeKey: "PAYMENT:t1" });

    notifs.safeEnqueue.mockClear();
    db.transaction.updateMany.mockResolvedValue({ count: 0 });          // already settled by the client flow
    await send(event(500));
    expect(notifs.safeEnqueue).not.toHaveBeenCalled();
  });
});

describe("security notifications", () => {
  it("a password reset notifies the user (always-on security event)", async () => {
    db.emailOtp.findUnique.mockResolvedValue({ id: "o1", email: "u@example.com", attempts: 0, otp: hashOtp("reset:u@example.com", "123456"), expiresAt: new Date(Date.now() + 60_000) });
    db.emailOtp.deleteMany.mockResolvedValue({ count: 1 });
    db.user.findUnique.mockResolvedValue({ id: "uX", isBlocked: false });
    db.user.update.mockResolvedValue({});
    const res = await resetPut(new NextRequest("http://x/api/auth/reset", {
      method: "PUT", body: JSON.stringify({ email: "u@example.com", otp: "123456", newPassword: "a-new-password" }), headers: { "x-forwarded-for": "10.7.7.7" },
    }));
    expect(res.status).toBe(200);
    expect(notifs.notify).toHaveBeenCalledWith("uX", "PASSWORD_CHANGED", { via: "password reset" });
  });
});
