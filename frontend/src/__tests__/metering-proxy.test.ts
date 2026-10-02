import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const db = vi.hoisted(() => ({
  systemSetting: { findUnique: vi.fn() },
  subscriptionPlan: { findUnique: vi.fn() },
  addonPackage: { findMany: vi.fn() },
  user: { updateMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  apiRequestLog: { create: vi.fn() },
  pdfGenerationJob: { create: vi.fn(), findFirst: vi.fn() },
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
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
  db.$transaction.mockImplementation(async (fn: (tx: typeof db) => unknown) => fn(db));
  db.$queryRaw.mockResolvedValue([{ addonUsage: {} }]);
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

// ── Pay-per-report pricing (Rs 4 - Rs 12) ────────────────────────────────────────────
import { reportPriceForPath, reportPriceList, isFreePdfEndpoint } from "@/lib/reportPricing";

describe("report pricing", () => {
  it("every report costs between Rs 4 and Rs 12 and unknown paths are not reports", () => {
    const list = reportPriceList();
    expect(list.length).toBe(7);
    for (const r of list) {
      expect(r.price).toBeGreaterThanOrEqual(4);
      expect(r.price).toBeLessThanOrEqual(12);
    }
    expect(reportPriceForPath("/api/v1/pdf/kundli/brihat")).toBe(12);
    expect(reportPriceForPath("/api/v1/pdf/dosha/sade-sati")).toBe(4);
    expect(reportPriceForPath("/api/v1/pdf/preview/html")).toBeNull();
    expect(reportPriceForPath("/api/v1/core/planets")).toBeNull();
  });

  it("recognises free polling / download endpoints only", () => {
    expect(isFreePdfEndpoint("/api/v1/pdf/status/pdf_job_abc")).toBe(true);
    expect(isFreePdfEndpoint("/api/v1/pdf/download/pdf_job_abc")).toBe(true);
    expect(isFreePdfEndpoint("/api/v1/pdf/jobs")).toBe(true);
    expect(isFreePdfEndpoint("/api/v1/pdf/kundli/basic")).toBe(false);
    expect(isFreePdfEndpoint("/api/v1/pdf/status/../../x")).toBe(false);
  });
});

describe("meterCall for reports", () => {
  const pdfAddon = { id: "pdf", name: "Automated PDF Report Engine", category: "REPORTS", monthlyQuota: 500, overageCost: 5, features: [], isActive: true };

  it("charges the report's own price from the wallet", async () => {
    const res = await meterCall(baseUser(), "/api/v1/pdf/kundli/brihat", "pdf");
    const body = await res.json();
    expect(body).toMatchObject({ valid: true, deductionType: "WALLET_CREDIT", creditsDeducted: 12, reportPrice: 12, receiptId: "123" });
    expect(db.user.updateMany.mock.calls[0][0].where).toEqual({ id: "u1", walletBalance: { gte: 12 } });
    expect(db.user.updateMany.mock.calls[0][0].data.walletBalance).toEqual({ decrement: 12 });
    expect(db.apiRequestLog.create.mock.calls[0][0].data.creditsCost).toBe(12);
  });

  it("refuses (and records nothing) when the wallet cannot cover the report", async () => {
    db.user.updateMany.mockResolvedValue({ count: 0 });
    const res = await meterCall(baseUser({ walletBalance: 3 } as never), "/api/v1/pdf/kundli/basic", "pdf");
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error_code).toBe("INSUFFICIENT_WALLET_FOR_REPORT");
    expect(body.message).toContain("₹5.00");
    expect(db.apiRequestLog.create).not.toHaveBeenCalled();
  });

  it("gives reports included in the PDF add-on for free, then charges the price", async () => {
    db.addonPackage.findMany.mockResolvedValue([pdfAddon]);
    // The usage that counts is the one read under the row lock, not the (stale) user object.
    const withAddon = (used: number) => {
      db.$queryRaw.mockResolvedValue([{ addonUsage: JSON.stringify({ pdf: used }) }]);
      return baseUser({ activeAddons: ["pdf"], addonUsage: { pdf: 0 } } as never);
    };

    const included = await (await meterCall(withAddon(10), "/api/v1/pdf/matching/report", "pdf")).json();
    expect(included).toMatchObject({ valid: true, deductionType: "ADDON_QUOTA", creditsDeducted: 0, addonId: "pdf" });

    db.user.updateMany.mockClear();
    const over = await (await meterCall(withAddon(500), "/api/v1/pdf/matching/report", "pdf")).json();
    expect(over).toMatchObject({ valid: true, deductionType: "ADDON_OVERAGE", creditsDeducted: 6, addonId: "pdf" });
    expect(db.user.updateMany.mock.calls[0][0].data.addonUsage).toEqual({ pdf: 501 });
  });

  it("never charges for status polls or downloads", async () => {
    const body = await (await meterCall(baseUser(), "/api/v1/pdf/status/pdf_job_abc", "pdf")).json();
    expect(body).toMatchObject({ valid: true, deductionType: "FREE", creditsDeducted: 0, receiptId: null });
    expect(db.user.updateMany).not.toHaveBeenCalled();
    expect(db.apiRequestLog.create).not.toHaveBeenCalled();
  });

  it("does not bill the admin account that the internal key belongs to", async () => {
    const body = await (await meterCall(baseUser({ role: "ADMIN" } as never), "/api/v1/pdf/kundli/basic", "pdf")).json();
    expect(body.valid).toBe(true);
    expect(body.creditsDeducted).toBe(0);
    expect(body.reportPrice).toBeUndefined();
  });
});

describe("meterCall add-on entitlement and usage", () => {
  const addon = (id: string, name: string, features: string[] = []) =>
    ({ id, name, category: "ENGINES", monthlyQuota: 1000, overageCost: 0.05, features, isActive: true });
  const kp = addon("kp", "KP Astrology (Krishnamurti Paddhati)");
  const doshaMatching = addon("dosha_matching", "Matchmaking & Dosha Engine");
  const doshas = addon("doshas", "Comprehensive All-Dosha Suite");

  it("counts add-on quota from the row read under lock, not the caller's stale copy", async () => {
    db.addonPackage.findMany.mockResolvedValue([kp]);
    db.$queryRaw.mockResolvedValue([{ addonUsage: { kp: 1000, pdf: 7 } }]); // a parallel call already used the last unit
    const user = baseUser({ activeAddons: ["kp"], addonUsage: { kp: 3 } } as never);

    const body = await (await meterCall(user, "/api/v1/kp/planets", "kp")).json();
    expect(body).toMatchObject({ valid: true, deductionType: "ADDON_OVERAGE", creditsDeducted: 0.05 });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.$queryRaw.mock.calls[0][0].join("?")).toContain("FOR UPDATE");
    // other add-ons' counters are carried over from the locked row, not lost
    expect(db.user.updateMany.mock.calls[0][0].data.addonUsage).toEqual({ kp: 1001, pdf: 7 });
  });

  it("refuses when the add-on quota and the wallet are both used up", async () => {
    db.addonPackage.findMany.mockResolvedValue([kp]);
    db.$queryRaw.mockResolvedValue([{ addonUsage: { kp: 1000 } }]);
    db.user.updateMany.mockResolvedValue({ count: 0 });
    const res = await meterCall(baseUser({ activeAddons: ["kp"] } as never), "/api/v1/kp/planets", "kp");
    expect(res.status).toBe(403);
    expect((await res.json()).details).toMatchObject({ addonId: "kp", usedQuota: 1000 });
    expect(db.apiRequestLog.create).not.toHaveBeenCalled();
  });

  it("matches the engine's dash-style module ids to underscore plan / add-on ids", async () => {
    db.systemSetting.findUnique.mockImplementation(async ({ where }: { where: { key: string } }) =>
      where.key === "PLAN_MODULES_PRO" ? { value: "core,dosha_matching" } : null);
    const pro = await meterCall(baseUser({ planTier: "PRO" } as never), "/api/v1/dosha-matching/manglik", "dosha-matching");
    expect(pro.status).toBe(200);

    clearCache(); // the add-on list is cached between calls
    db.addonPackage.findMany.mockResolvedValue([doshaMatching, doshas]);
    for (const active of ["dosha_matching", "doshas"]) {
      const res = await meterCall(baseUser({ activeAddons: [active] } as never), "/api/v1/dosha-matching/manglik", "dosha-matching");
      expect((await res.json()).deductionType).toBe("ADDON_QUOTA");
    }
  });

  it("does not unlock a module because an add-on's description mentions it", async () => {
    const remedies = addon("remedies", "Astrological Remedies Engine", ["Includes kp-based remedy timing"]);
    db.addonPackage.findMany.mockResolvedValue([remedies]);
    const res = await meterCall(baseUser({ activeAddons: ["remedies"] } as never), "/api/v1/kp/planets", "kp");
    expect(res.status).toBe(403);
    expect((await res.json()).error_code).toBe("PLAN_UPGRADE_OR_ADDON_REQUIRED");
  });
});
