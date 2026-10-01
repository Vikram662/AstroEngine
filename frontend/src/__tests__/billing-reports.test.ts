import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), count: vi.fn() },
  transaction: { findUnique: vi.fn(), findMany: vi.fn(), aggregate: vi.fn() },
  apiRequestLog: { count: vi.fn(), aggregate: vi.fn() },
  $queryRaw: vi.fn(),
  systemSetting: { findMany: vi.fn() },
  pdfGenerationJob: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
  auditLog: { create: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));

const auth = vi.hoisted(() => ({ getVerifiedSession: vi.fn(), requireAdminSession: vi.fn() }));
vi.mock("@/lib/authGuard", () => auth);

const meter = vi.hoisted(() => ({ meterCall: vi.fn() }));
vi.mock("@/lib/metering", () => meter);

const refund = vi.hoisted(() => ({ applyRefund: vi.fn(async () => ({ ok: true, refunded: true, creditsReturned: 5 })), isValidReceipt: vi.fn(() => true) }));
vi.mock("@/lib/billingRefund", () => refund);

const engine = vi.hoisted(() => ({ dispatchPdfJob: vi.fn() }));
vi.mock("@/lib/pdfEngine", async (orig) => ({ ...(await orig<typeof import("@/lib/pdfEngine")>()), dispatchPdfJob: engine.dispatchPdfJob }));

import { computeGst, invoiceNumber, isWalletTopUp, supplyValue } from "@/lib/invoice";
import { csvCell, csvRow } from "@/lib/csv";
import { POST as queuePost } from "@/app/api/pdf/queue/route";
import { GET as statsGet } from "@/app/api/admin/stats/route";

const SELLER = { state: "Maharashtra", stateCode: "27" };

describe("computeGst", () => {
  it("splits intra-state tax into CGST + SGST and always adds back to the gross", () => {
    for (const gross of [1, 99.99, 118, 4999, 12345.67, 0.01]) {
      const g = computeGst(gross, SELLER, { state: "Maharashtra" });
      expect(g.intraState).toBe(true);
      expect(g.igst).toBe(0);
      expect(Math.round((g.taxable + g.cgst + g.sgst) * 100)).toBe(Math.round(g.gross * 100));
    }
    expect(computeGst(118, SELLER, {})).toMatchObject({ taxable: 100, cgst: 9, sgst: 9 });
  });

  it("charges IGST for other states and trusts the GSTIN state code over the typed state", () => {
    const inter = computeGst(118, SELLER, { state: "Karnataka" });
    expect(inter).toMatchObject({ intraState: false, taxable: 100, igst: 18, cgst: 0, sgst: 0 });
    expect(computeGst(118, SELLER, { state: "Maharashtra", gstin: "29ABCDE1234F1Z5" }).intraState).toBe(false);
    expect(computeGst(118, SELLER, { state: "Karnataka", gstin: "27ABCDE1234F1Z5" }).intraState).toBe(true);
  });

  it("builds one invoice number format", () => {
    expect(invoiceNumber({ id: "abcdef12-0000", createdAt: new Date("2026-03-05T00:00:00Z") })).toBe("INV-2026-ABCDEF12");
  });
});

describe("GST policy helpers", () => {
  it("classifies top-ups vs purchases", () => {
    expect(isWalletTopUp({ creditsAdded: 500 })).toBe(true);
    expect(isWalletTopUp({ creditsAdded: 0 })).toBe(false);      // plan paid from wallet / gateway
    expect(isWalletTopUp({ creditsAdded: -299 })).toBe(false);   // add-on bought from the wallet
    expect(supplyValue({ amount: -299 })).toBe(299);
    expect(supplyValue({ amount: 4999 })).toBe(4999);
  });
});

describe("csv", () => {
  it("neutralises formula injection and quotes separators", () => {
    expect(csvCell("=HYPERLINK(\"http://evil\")")).toBe("\"'=HYPERLINK(\"\"http://evil\"\")\"");
    expect(csvCell("+1+1")).toBe("'+1+1");
    expect(csvCell("-2")).toBe("'-2");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("a,b")).toBe("\"a,b\"");
    expect(csvCell("line\nbreak")).toBe("\"line\nbreak\"");
    expect(csvCell(null)).toBe("");
    expect(csvCell(42.5)).toBe("42.5");
    expect(csvRow(["a", "b,c", 3])).toBe("a,\"b,c\",3");
  });
});

// ── Dashboard PDF reports are billed to the customer ───────────────────────────────
describe("POST /api/pdf/queue", () => {
  const birth = { dob: "1995-10-05", tob: "14:30", lat: 24.58, lon: 73.71, tz: 5.5 };
  const req = (body: object) => new NextRequest("http://x/api/pdf/queue", { method: "POST", body: JSON.stringify(body) });
  const receipt = { receiptId: "77", deductionType: "WALLET_CREDIT", addonId: null };
  const okMeter = () => NextResponse.json({ valid: true, ...receipt, creditsDeducted: 5 }, { status: 200 });

  beforeEach(() => {
    vi.clearAllMocks();
    auth.getVerifiedSession.mockResolvedValue({ userId: "u1", email: "u@example.com", role: "USER" });
    db.user.findUnique.mockResolvedValue({ id: "u1", name: "U", brandingConfig: null });
    db.pdfGenerationJob.create.mockResolvedValue({ id: "job1" });
    meter.meterCall.mockResolvedValue(okMeter());
    engine.dispatchPdfJob.mockResolvedValue({ jobId: "job1", jobResult: { job_id: "job1" }, finalStatus: "PENDING", fileUrl: null });
  });

  it("charges the signed-in customer before generating, and stores the receipt on the job", async () => {
    const res = await queuePost(req({ reportType: "kundli_basic", birthData: birth }));
    expect(res.status).toBe(200);
    expect(meter.meterCall).toHaveBeenCalledWith(expect.objectContaining({ id: "u1" }), "/api/v1/pdf/kundli/basic", "pdf");
    expect(meter.meterCall.mock.invocationCallOrder[0]).toBeLessThan(engine.dispatchPdfJob.mock.invocationCallOrder[0]);
    const saved = db.pdfGenerationJob.create.mock.calls[0][0].data;
    expect(saved.requestPayload.billing).toEqual(receipt);
    expect(refund.applyRefund).not.toHaveBeenCalled();
  });

  it("does not generate anything when the customer cannot pay / is not entitled", async () => {
    meter.meterCall.mockResolvedValue(NextResponse.json({ valid: false, error_code: "QUOTA_AND_CREDITS_EXHAUSTED", message: "no funds" }, { status: 403 }));
    const res = await queuePost(req({ reportType: "kundli_basic", birthData: birth }));
    expect(res.status).toBe(403);
    expect(engine.dispatchPdfJob).not.toHaveBeenCalled();
  });

  it("refunds when the report engine is down", async () => {
    engine.dispatchPdfJob.mockRejectedValue(new Error("ECONNREFUSED"));
    const res = await queuePost(req({ reportType: "kundli_basic", birthData: birth }));
    expect(res.status).toBe(502);
    expect(refund.applyRefund).toHaveBeenCalledWith(receipt, 502);
    expect(db.pdfGenerationJob.create).not.toHaveBeenCalled();
  });

  it("refunds when the job fails immediately and marks the job refunded", async () => {
    engine.dispatchPdfJob.mockResolvedValue({ jobId: "job1", jobResult: {}, finalStatus: "FAILED", fileUrl: null });
    await queuePost(req({ reportType: "kundli_basic", birthData: birth }));
    expect(refund.applyRefund).toHaveBeenCalledWith(receipt, 500);
    expect(db.pdfGenerationJob.create.mock.calls[0][0].data.refunded).toBe(true);
  });

  it("rejects bad input before charging anything", async () => {
    expect((await queuePost(req({ reportType: "nope", birthData: birth }))).status).toBe(400);
    expect((await queuePost(req({ reportType: "kundli_basic", birthData: { ...birth, lat: 999 } }))).status).toBe(400);
    expect((await queuePost(req({ reportType: "kundli_basic" }))).status).toBe(400);
    expect(meter.meterCall).not.toHaveBeenCalled();
  });

  it("rate limits report creation", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) statuses.push((await queuePost(req({ reportType: "kundli_basic", birthData: birth }))).status);
    expect(statuses.filter((s) => s === 429).length).toBeGreaterThanOrEqual(2);
  });
});

// ── Admin stats: sales vs deposits ────────────────────────────────────────────────
describe("GET /api/admin/stats revenue", () => {
  it("counts purchases and usage charges as revenue, and reports wallet top-ups separately", async () => {
    auth.requireAdminSession.mockResolvedValue({ userId: "a1", role: "ADMIN" });
    db.user.count.mockResolvedValue(3);
    db.apiRequestLog.count.mockResolvedValue(10);
    db.apiRequestLog.aggregate.mockResolvedValue({ _avg: { responseTime: 20 }, _sum: { creditsCost: 202.5 } });
    db.pdfGenerationJob.count.mockResolvedValue(0);
    db.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true })));
    db.transaction.aggregate.mockImplementation(async ({ where }: { where: { creditsAdded: Record<string, number>; amount?: Record<string, number> } }) => {
      if (where.creditsAdded.gt === 0) return { _sum: { amount: 10000 } };                 // top-ups
      if (where.amount?.gt === 0) return { _sum: { amount: 4999 } };                        // plans
      return { _sum: { amount: -499 } };                                                     // add-ons (negative)
    });
    const body = await (await statsGet()).json();
    // purchases 4999 + 499, plus per-call / report charges 202.50 taken from wallets
    expect(body.data.revenueBreakdown).toEqual({ purchases: 5498, usage: 202.5 });
    expect(body.data.totalRevenue).toBe(5700.5);
    expect(body.data.walletTopUps).toBe(10000);
    vi.unstubAllGlobals();
  });
});
