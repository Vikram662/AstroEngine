import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const db = vi.hoisted(() => ({
  systemSetting: { findUnique: vi.fn() },
  subscriptionPlan: { findUnique: vi.fn() },
  addonPackage: { findMany: vi.fn() },
  user: { updateMany: vi.fn(), findUnique: vi.fn() },
  apiRequestLog: { create: vi.fn() },
  pdfGenerationJob: { create: vi.fn(), findFirst: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));

const auth = vi.hoisted(() => ({ getVerifiedSession: vi.fn() }));
vi.mock("@/lib/authGuard", () => auth);

const http = vi.hoisted(() => {
  const fn: ReturnType<typeof vi.fn> & { isAxiosError?: (e: unknown) => boolean } = vi.fn();
  fn.isAxiosError = (e: unknown) => Boolean((e as { isAxiosError?: boolean })?.isAxiosError);
  return fn;
});
vi.mock("axios", () => ({ default: http, isAxiosError: http.isAxiosError }));

const refund = vi.hoisted(() => ({ applyRefund: vi.fn(async () => ({ ok: true, refunded: true, creditsReturned: 0 })), isValidReceipt: vi.fn(() => true) }));
vi.mock("@/lib/billingRefund", () => refund);

import { meterCall, type MeteredUser } from "@/lib/metering";
import { clearCache } from "@/lib/ttlCache";
import { POST as proxyPost, GET as proxyGet } from "@/app/api/proxy/route";

const baseUser = (over: Partial<MeteredUser> = {}) =>
  ({
    id: "u1", email: "u@example.com", role: "USER", planTier: "STARTER", isBlocked: false,
    walletBalance: 50, monthlyQuota: 100, monthlyUsage: 5, activeAddons: [], addonUsage: {}, subscription: null, ...over,
  }) as unknown as MeteredUser;

beforeEach(() => {
  vi.clearAllMocks();
  clearCache();
  db.systemSetting.findUnique.mockResolvedValue(null);
  db.subscriptionPlan.findUnique.mockResolvedValue({ tier: "STARTER", name: "Starter", priceMonthly: 4999, includedQuota: 100, rateLimitPerMin: 60, overageCost: 0.02, features: [] });
  db.addonPackage.findMany.mockResolvedValue([]);
  db.user.updateMany.mockResolvedValue({ count: 1 });
  db.apiRequestLog.create.mockResolvedValue({ id: BigInt(123) });
});

describe("meterCall (shared billing core)", () => {
  it("debits plan quota atomically and returns a receipt", async () => {
    const res = await meterCall(baseUser(), "/api/v1/core/planets", "core");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ valid: true, deductionType: "QUOTA", creditsDeducted: 0, receiptId: "123", role: "USER" });
    const claim = db.user.updateMany.mock.calls[0][0];
    expect(claim.where).toEqual({ id: "u1", monthlyUsage: { lt: 100 } });
  });

  it("falls back to the wallet when the quota is used up, with a conditional debit", async () => {
    db.user.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 });
    const body = await (await meterCall(baseUser({ monthlyUsage: 100 } as never), "/api/v1/core/planets", "core")).json();
    expect(body).toMatchObject({ valid: true, deductionType: "WALLET_CREDIT", creditsDeducted: 0.02 });
    expect(db.user.updateMany.mock.calls[1][0].where).toEqual({ id: "u1", walletBalance: { gte: 0.02 } });
  });

  it("refuses when both quota and wallet are exhausted and records nothing", async () => {
    db.user.updateMany.mockResolvedValue({ count: 0 });
    const res = await meterCall(baseUser({ monthlyUsage: 100, walletBalance: 0 } as never), "/api/v1/core/planets", "core");
    expect(res.status).toBe(403);
    expect((await res.json()).error_code).toBe("QUOTA_AND_CREDITS_EXHAUSTED");
    expect(db.apiRequestLog.create).not.toHaveBeenCalled();
  });

  it("blocks modules outside the plan without charging", async () => {
    const res = await meterCall(baseUser(), "/api/v1/kp/chart", "kp");
    expect(res.status).toBe(403);
    expect((await res.json()).error_code).toBe("PLAN_UPGRADE_OR_ADDON_REQUIRED");
    expect(db.user.updateMany).not.toHaveBeenCalled();
  });

  it("honours maintenance mode for users but not admins", async () => {
    db.systemSetting.findUnique.mockImplementation(async ({ where }: { where: { key: string } }) =>
      where.key === "MAINTENANCE_MODE" ? { value: "true" } : null);
    expect((await meterCall(baseUser(), "/api/v1/core/planets", "core")).status).toBe(503);
    clearCache();
    db.systemSetting.findUnique.mockImplementation(async ({ where }: { where: { key: string } }) =>
      where.key === "MAINTENANCE_MODE" ? { value: "true" } : null);
    expect((await meterCall(baseUser({ role: "ADMIN" } as never), "/api/v1/core/planets", "core")).status).toBe(200);
  });
});

// ── Public proxy ───────────────────────────────────────────────────────────────────
let ipN = 0;
const post = (body: object) =>
  new NextRequest("http://x/api/proxy", { method: "POST", body: JSON.stringify(body), headers: { "x-forwarded-for": `10.9.0.${++ipN}` } });
const get = (qs: string) => new NextRequest(`http://x/api/proxy?${qs}`);

describe("/api/proxy", () => {
  beforeEach(() => {
    auth.getVerifiedSession.mockResolvedValue({ userId: "u1", email: "u@example.com", role: "USER" });
    db.user.findUnique.mockResolvedValue(baseUser());
    db.pdfGenerationJob.create.mockResolvedValue({});
    http.mockResolvedValue({ status: 202, data: { data: { job_id: "pdf_job_abc", status: "PENDING" } } });
  });

  it("lets anonymous visitors use public calculators without billing", async () => {
    auth.getVerifiedSession.mockResolvedValue(null);
    http.mockResolvedValue({ status: 200, data: { status: "success" } });
    const res = await proxyPost(post({ endpoint: "/api/v1/panchang/daily", payload: {} }));
    expect(res.status).toBe(200);
    expect(db.user.updateMany).not.toHaveBeenCalled();
  });

  it("requires sign-in for report generation", async () => {
    auth.getVerifiedSession.mockResolvedValue(null);
    expect((await proxyPost(post({ endpoint: "/api/v1/pdf/kundli/basic", payload: {} }))).status).toBe(401);
    expect(http).not.toHaveBeenCalled();
  });

  it("bills the signed-in customer for a report and records the job under them", async () => {
    const res = await proxyPost(post({ endpoint: "/api/v1/pdf/kundli/basic", payload: { dob: "1995-10-05", lang: "en" } }));
    expect(res.status).toBe(202);
    expect(db.user.updateMany).toHaveBeenCalled();              // metered (quota claim)
    const job = db.pdfGenerationJob.create.mock.calls[0][0].data;
    expect(job).toMatchObject({ id: "pdf_job_abc", userId: "u1", reportType: "kundli_basic" });
    expect(job.requestPayload.billing).toMatchObject({ receiptId: "123" });
  });

  it("refunds the customer when the report engine call fails", async () => {
    http.mockRejectedValue(Object.assign(new Error("boom"), { isAxiosError: true, response: { status: 500, data: {} } }));
    const res = await proxyPost(post({ endpoint: "/api/v1/pdf/kundli/basic", payload: {} }));
    expect(res.status).toBe(500);
    expect(refund.applyRefund).toHaveBeenCalledWith(expect.objectContaining({ receiptId: "123" }), 500);
  });

  it("does not generate a report for a customer who cannot be billed", async () => {
    db.user.updateMany.mockResolvedValue({ count: 0 });
    db.user.findUnique.mockResolvedValue(baseUser({ monthlyUsage: 100, walletBalance: 0 } as never));
    const res = await proxyPost(post({ endpoint: "/api/v1/pdf/kundli/basic", payload: {} }));
    expect(res.status).toBe(403);
    expect(http).not.toHaveBeenCalled();
  });

  it("only lets customers poll or download their own reports (admins any)", async () => {
    db.pdfGenerationJob.findFirst.mockResolvedValue(null);
    expect((await proxyGet(get("endpoint=/api/v1/pdf/status/pdf_job_other"))).status).toBe(404);
    expect((await proxyGet(get("dl=pdf&job_id=pdf_job_other"))).status).toBe(404);
    expect(http).not.toHaveBeenCalled();

    db.pdfGenerationJob.findFirst.mockResolvedValue({ id: "pdf_job_mine" });
    http.mockResolvedValue({ status: 200, data: { data: { status: "COMPLETED" } } });
    expect((await proxyGet(get("endpoint=/api/v1/pdf/status/pdf_job_mine"))).status).toBe(200);

    auth.getVerifiedSession.mockResolvedValue({ userId: "adm", email: "a@example.com", role: "ADMIN" });
    db.pdfGenerationJob.findFirst.mockResolvedValue(null);
    expect((await proxyGet(get("endpoint=/api/v1/pdf/status/pdf_job_other"))).status).toBe(200);
  });
});
