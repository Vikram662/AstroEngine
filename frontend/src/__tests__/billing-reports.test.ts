import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  transaction: { findUnique: vi.fn(), findMany: vi.fn() },
  systemSetting: { findMany: vi.fn() },
  pdfGenerationJob: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
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

import { computeGst, invoiceNumber } from "@/lib/invoice";
import { csvCell, csvRow } from "@/lib/csv";
import { GET as invoiceGet } from "@/app/api/billing/invoice/[id]/route";
import { GET as reportsGet } from "@/app/api/admin/reports/route";
import { POST as queuePost } from "@/app/api/pdf/queue/route";

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

// ── Invoice route ──────────────────────────────────────────────────────────────
const ctx = (id = "tx1") => ({ params: Promise.resolve({ id }) });
const invoiceReq = () => new NextRequest("http://x/api/billing/invoice/tx1");
const baseTx = {
  id: "abcdef12-1111", userId: "user-0000-1111-2222", status: "SUCCESS", amount: 118, creditsAdded: 118, createdAt: new Date("2026-03-05T10:00:00Z"),
  user: { email: "owner@example.com", name: "Owner <script>", taxProfile: { businessName: "<b>Evil</b> Co", state: "Karnataka" } },
};

describe("GET /api/billing/invoice/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getVerifiedSession.mockResolvedValue({ userId: "u1", email: "owner@example.com", role: "USER" });
    db.transaction.findUnique.mockResolvedValue(baseTx);
    db.systemSetting.findMany.mockResolvedValue([{ key: "COMPANY_LOGO_URL", value: "javascript:alert(1)" }]);
  });

  it("requires a session and ownership", async () => {
    auth.getVerifiedSession.mockResolvedValue(null);
    expect((await invoiceGet(invoiceReq(), ctx())).status).toBe(401);
    auth.getVerifiedSession.mockResolvedValue({ userId: "u2", email: "other@example.com", role: "USER" });
    expect((await invoiceGet(invoiceReq(), ctx())).status).toBe(403);
    auth.getVerifiedSession.mockResolvedValue({ userId: "a", email: "admin@example.com", role: "ADMIN" });
    expect((await invoiceGet(invoiceReq(), ctx())).status).toBe(200);
  });

  it("issues no invoice for payments that did not succeed", async () => {
    for (const status of ["PENDING", "FAILED"]) {
      db.transaction.findUnique.mockResolvedValue({ ...baseTx, status });
      expect((await invoiceGet(invoiceReq(), ctx())).status).toBe(409);
    }
  });

  it("renders escaped, correct, locked-down HTML", async () => {
    const res = await invoiceGet(invoiceReq(), ctx());
    const html = await res.text();
    expect(html).toContain("INV-2026-ABCDEF12");
    expect(html).toContain("IGST");                       // Karnataka customer, Maharashtra seller
    expect(html).toContain("₹100.00");                    // taxable value of 118 incl. 18%
    expect(html).not.toContain("<b>Evil</b>");
    expect(html).toContain("&lt;b&gt;Evil&lt;/b&gt;");
    expect(html).not.toContain("javascript:alert");       // hostile logo URL dropped
    expect(html).not.toContain("onclick=");
    const csp = res.headers.get("content-security-policy") || "";
    expect(csp).toMatch(/default-src 'none'/);
    const nonce = /script-src 'nonce-([^']+)'/.exec(csp)?.[1];
    expect(nonce).toBeTruthy();
    expect(html).toContain(`<script nonce="${nonce}">`);
    expect(res.headers.get("cache-control")).toContain("no-store");
  });
});

// ── Admin reports ───────────────────────────────────────────────────────────────
describe("GET /api/admin/reports?export=gstr1_returns", () => {
  const req = (qs = "") => new NextRequest(`http://x/api/admin/reports?export=gstr1_returns${qs}`);

  beforeEach(() => {
    vi.clearAllMocks();
    auth.requireAdminSession.mockResolvedValue({ userId: "a1", role: "ADMIN" });
    db.systemSetting.findMany.mockResolvedValue([]);
    db.auditLog.create.mockResolvedValue({});
    db.transaction.findMany.mockResolvedValue([
      {
        id: "abcdef12-1", createdAt: new Date("2026-03-05T10:00:00Z"), amount: 118, paymentGateway: "RAZORPAY", gatewayPaymentId: "pay_1",
        user: { email: "=cmd|' /C calc'!A0@x.com", taxProfile: { state: "Karnataka", gstin: "29ABCDE1234F1Z5" } },
      },
      {
        id: "fedcba98-2", createdAt: new Date("2026-03-06T10:00:00Z"), amount: 236, paymentGateway: "RAZORPAY", gatewayPaymentId: "pay_2",
        user: { email: "b@example.com", taxProfile: null },
      },
    ]);
  });

  it("is admin only", async () => {
    auth.requireAdminSession.mockResolvedValue(null);
    expect((await reportsGet(req())).status).toBe(403);
  });

  it("exports gateway payments only, with totals, matching invoice numbers, and escaped cells", async () => {
    const res = await reportsGet(req("&from=2026-03-01&to=2026-03-31"));
    expect(res.status).toBe(200);
    const where = db.transaction.findMany.mock.calls[0][0].where;
    expect(where.paymentGateway).toEqual({ not: "WALLET" });
    expect(where.status).toBe("SUCCESS");
    expect(where.createdAt.gte).toBeInstanceOf(Date);

    const csv = await res.text();
    const lines = csv.trim().split("\n");
    expect(lines[0]).toContain("InvoiceNumber");
    expect(lines[1]).toContain("INV-2026-ABCDEF12");       // same number as the invoice
    expect(lines[1]).toContain("18.00");                   // IGST for Karnataka GSTIN
    expect(lines[1]).not.toMatch(/^[^,]*,[^,]*,=/);        // formula cell was neutralised
    expect(lines[1]).toContain("'=cmd");
    expect(lines[lines.length - 1]).toMatch(/^TOTAL,.*354\.00/);
    expect(db.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it("can include wallet-paid rows only on request", async () => {
    await reportsGet(req("&include_wallet=1"));
    expect(db.transaction.findMany.mock.calls[0][0].where.paymentGateway).toBeUndefined();
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
