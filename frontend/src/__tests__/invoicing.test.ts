import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// ── An in-memory stand-in for the invoice tables ─────────────────────────────────────
const store = vi.hoisted(() => ({
  invoices: [] as Array<Record<string, unknown>>,
  counters: {} as Record<string, number>,
}));

const db = vi.hoisted(() => {
  const m = {
    user: { findUnique: vi.fn() },
    transaction: { findUnique: vi.fn(), findMany: vi.fn() },
    systemSetting: { findMany: vi.fn() },
    apiRequestLog: { aggregate: vi.fn(), groupBy: vi.fn() },
    auditLog: { create: vi.fn() },
    pdfGenerationJob: { update: vi.fn() },
    invoice: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    invoiceCounter: { upsert: vi.fn() },
    notification: { createMany: vi.fn(async () => ({ count: 0 })) },
    $transaction: vi.fn(),
  };
  return m;
});
vi.mock("@/lib/prisma", () => ({ prisma: db }));

const auth = vi.hoisted(() => ({ getVerifiedSession: vi.fn(), requireAdminSession: vi.fn() }));
vi.mock("@/lib/authGuard", () => auth);

const meter = vi.hoisted(() => ({ meterCall: vi.fn() }));
vi.mock("@/lib/metering", () => meter);
const refund = vi.hoisted(() => ({ applyRefund: vi.fn(async () => ({ ok: true, refunded: true, creditsReturned: 0 })), isValidReceipt: vi.fn(() => true) }));
vi.mock("@/lib/billingRefund", () => refund);
const engine = vi.hoisted(() => ({ dispatchPdfJob: vi.fn() }));
vi.mock("@/lib/pdfEngine", async (orig) => ({ ...(await orig<typeof import("@/lib/pdfEngine")>()), dispatchPdfJob: engine.dispatchPdfJob }));

import { fiscalYearOf, formatInvoiceNumber, istMonthStart, issueSaleInvoice, issueUsageInvoice, issueUsageInvoicesForMonth, ensureSaleInvoice } from "@/lib/invoicing";
import { GET as invoiceGet } from "@/app/api/billing/invoice/[id]/route";
import { GET as reportsGet } from "@/app/api/admin/reports/route";
import { POST as monthlyPost } from "@/app/api/internal/invoices/monthly/route";
import { POST as retryPost } from "@/app/api/admin/pdf-queue/retry/route";

const USER = { name: "Owner <script>", email: "owner@example.com", taxProfile: { businessName: "<b>Evil</b> Co", state: "Karnataka" } };

function wireStore() {
  store.invoices.length = 0;
  for (const k of Object.keys(store.counters)) delete store.counters[k];

  db.$transaction.mockImplementation(async (fn: (tx: typeof db) => unknown) => fn(db));
  db.user.findUnique.mockResolvedValue(USER);
  db.systemSetting.findMany.mockResolvedValue([{ key: "COMPANY_LOGO_URL", value: "javascript:alert(1)" }]);
  db.invoiceCounter.upsert.mockImplementation(async ({ where }: { where: { fiscalYear: string } }) => {
    store.counters[where.fiscalYear] = (store.counters[where.fiscalYear] || 0) + 1;
    return { fiscalYear: where.fiscalYear, lastSeq: store.counters[where.fiscalYear] };
  });
  db.invoice.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
    const row = { id: `inv-${store.invoices.length + 1}`, ...data };
    store.invoices.push(row);
    return row;
  });
  db.invoice.findUnique.mockImplementation(async ({ where }: { where: { id?: string; transactionId?: string } }) =>
    store.invoices.find((i) => (where.id ? i.id === where.id : i.transactionId === where.transactionId)) ?? null);
  db.invoice.findFirst.mockImplementation(async ({ where }: { where: { userId: string; type: string; periodStart: Date } }) =>
    store.invoices.find((i) => i.userId === where.userId && i.type === where.type && (i.periodStart as Date)?.getTime() === where.periodStart.getTime()) ?? null);
}

beforeEach(() => {
  vi.clearAllMocks();
  wireStore();
});

const purchase = (over: Record<string, unknown> = {}) => ({
  id: "abcdef12-1111", userId: "user-0000-1111-2222", status: "SUCCESS", amount: 118, creditsAdded: 0,
  paymentGateway: "WALLET", gatewayOrderId: "wallet_sub_1", createdAt: new Date("2026-03-05T10:00:00Z"), user: USER, ...over,
});

// ── Numbering ───────────────────────────────────────────────────────────────────────────
describe("invoice numbering", () => {
  it("uses the Indian financial year (April-March, IST)", () => {
    expect(fiscalYearOf(new Date("2026-03-31T10:00:00Z"))).toBe("25-26");
    expect(fiscalYearOf(new Date("2026-03-31T19:00:00Z"))).toBe("26-27"); // 00:30 IST on 1 April
    expect(fiscalYearOf(new Date("2026-04-01T00:00:00Z"))).toBe("26-27");
    expect(fiscalYearOf(new Date("2027-01-15T00:00:00Z"))).toBe("26-27");
  });

  it("formats within the 16 character GST limit", () => {
    expect(formatInvoiceNumber("25-26", 1)).toBe("AE/25-26/000001");
    expect(formatInvoiceNumber("25-26", 123456)).toBe("AE/25-26/123456");
    expect(formatInvoiceNumber("25-26", 999999).length).toBeLessThanOrEqual(16);
  });

  it("months start at midnight IST", () => {
    expect(istMonthStart(2026, 3).toISOString()).toBe("2026-02-28T18:30:00.000Z");
  });

  it("issues consecutive numbers with no gaps across purchases and usage invoices", async () => {
    db.apiRequestLog.aggregate.mockResolvedValue({ _sum: { creditsCost: 59 }, _count: { _all: 40 } });
    const a = await issueSaleInvoice(db as never, purchase() as never);
    const b = await issueSaleInvoice(db as never, purchase({ id: "bbbbbbbb-2222" }) as never);
    const c = await issueUsageInvoice("u1", 2020, 1);
    const seqs = [a, b, c].map((i) => (i as { seq: number }).seq);
    expect(seqs).toEqual([1, 2, 3]);
    expect(new Set(store.invoices.map((i) => i.number)).size).toBe(3);
  });

  it("is idempotent: the same purchase never gets a second number", async () => {
    const first = await issueSaleInvoice(db as never, purchase() as never);
    const again = await issueSaleInvoice(db as never, purchase() as never);
    expect(again).toBe(first);
    expect(store.invoices).toHaveLength(1);
    expect(Object.values(store.counters)[0]).toBe(1);
  });

  it("never invoices a top-up, an unpaid payment or a failed one", async () => {
    expect(await issueSaleInvoice(db as never, purchase({ creditsAdded: 500, paymentGateway: "RAZORPAY" }) as never)).toBeNull();
    expect(await issueSaleInvoice(db as never, purchase({ status: "PENDING" }) as never)).toBeNull();
    expect(await issueSaleInvoice(db as never, purchase({ status: "FAILED" }) as never)).toBeNull();
    expect(store.invoices).toHaveLength(0);
    expect(db.invoiceCounter.upsert).not.toHaveBeenCalled();
  });

  it("a lost race rolls the number back (no gap): the existing invoice is returned", async () => {
    const tx = purchase();
    db.transaction.findUnique.mockResolvedValue(tx);
    const existing = { id: "inv-x", transactionId: tx.id, seq: 1 };
    // first lookup inside the transaction finds nothing, create then violates the unique key
    db.invoice.findUnique.mockResolvedValueOnce(null).mockResolvedValue(existing);
    db.invoice.create.mockRejectedValueOnce(Object.assign(new Error("unique"), { code: "P2002" }));
    const got = await ensureSaleInvoice(tx.id);
    expect(got).toBe(existing);
  });

  it("snapshots seller and buyer and computes GST on the stored gross", async () => {
    const inv = (await issueSaleInvoice(db as never, purchase() as never)) as Record<string, unknown>;
    expect(inv).toMatchObject({ type: "SALE", gross: 118, taxable: 100, igst: 18, cgst: 0, sgst: 0, intraState: false });
    expect((inv.buyer as Record<string, string>).state).toBe("Karnataka");
    expect((inv.seller as Record<string, string>).state).toBe("Maharashtra");
  });
});

// ── Monthly consolidated usage invoice ────────────────────────────────────────────────────
describe("monthly usage invoice (per-call overage + reports, invoiced once at month end)", () => {
  it("sums the month's billed charges into ONE invoice for that month only", async () => {
    db.apiRequestLog.aggregate.mockResolvedValue({ _sum: { creditsCost: 118.4567 }, _count: { _all: 2300 } });
    const inv = (await issueUsageInvoice("u1", 2026, 3)) as Record<string, unknown>;

    const where = db.apiRequestLog.aggregate.mock.calls[0][0].where;
    expect(where.userId).toBe("u1");
    expect(where.createdAt.gte.toISOString()).toBe("2026-02-28T18:30:00.000Z");  // 1 Mar 00:00 IST
    expect(where.createdAt.lt.toISOString()).toBe("2026-03-31T18:30:00.000Z");   // 1 Apr 00:00 IST
    expect(where.statusCode).toBe(200);                                           // refunded / failed calls are not billed
    expect(where.creditsCost).toEqual({ gt: 0 });

    expect(inv).toMatchObject({ type: "USAGE", gross: 118.46, quantity: 2300 });
    expect(inv.description).toContain("March 2026");
    expect(Math.round(((inv.taxable as number) + (inv.igst as number) + (inv.cgst as number) + (inv.sgst as number)) * 100)).toBe(11846);
  });

  it("running it again for the same month creates nothing new", async () => {
    db.apiRequestLog.aggregate.mockResolvedValue({ _sum: { creditsCost: 50 }, _count: { _all: 10 } });
    const a = await issueUsageInvoice("u1", 2026, 3);
    const b = await issueUsageInvoice("u1", 2026, 3);
    expect(b).toBe(a);
    expect(store.invoices).toHaveLength(1);
  });

  it("issues nothing for a month without billed usage", async () => {
    db.apiRequestLog.aggregate.mockResolvedValue({ _sum: { creditsCost: null }, _count: { _all: 0 } });
    expect(await issueUsageInvoice("u1", 2026, 3)).toBeNull();
    expect(db.invoiceCounter.upsert).not.toHaveBeenCalled();
  });

  it("the month-end run invoices every customer with usage, once", async () => {
    db.apiRequestLog.groupBy.mockResolvedValue([{ userId: "u1" }, { userId: "u2" }]);
    db.apiRequestLog.aggregate.mockResolvedValue({ _sum: { creditsCost: 10 }, _count: { _all: 5 } });
    const first = await issueUsageInvoicesForMonth(2026, 3);
    expect(first).toMatchObject({ users: 2, issued: 2, existing: 0 });
    const second = await issueUsageInvoicesForMonth(2026, 3);
    expect(second).toMatchObject({ users: 2, issued: 0, existing: 2 });
    expect(store.invoices).toHaveLength(2);
  });
});

describe("POST /api/internal/invoices/monthly", () => {
  const post = (body: object, secret: string | null = "test-internal-secret") =>
    new NextRequest("http://x/api/internal/invoices/monthly", { method: "POST", body: JSON.stringify(body), headers: secret ? { "x-internal-secret": secret } : {} });

  beforeEach(() => {
    auth.requireAdminSession.mockResolvedValue(null);
    db.auditLog.create.mockResolvedValue({});
    db.transaction.findMany.mockResolvedValue([]);
    db.apiRequestLog.groupBy.mockResolvedValue([]);
  });

  it("needs the internal secret or an admin session", async () => {
    expect((await monthlyPost(post({ month: "2020-01" }, null))).status).toBe(403);
    expect((await monthlyPost(post({ month: "2020-01" }, "wrong"))).status).toBe(403);
    expect((await monthlyPost(post({ month: "2020-01" }))).status).toBe(200);
    auth.requireAdminSession.mockResolvedValue({ userId: "a", role: "ADMIN" });
    expect((await monthlyPost(post({ month: "2020-01" }, null))).status).toBe(200);
    expect(db.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it("validates the month and refuses a month that has not ended", async () => {
    expect((await monthlyPost(post({ month: "March" }))).status).toBe(400);
    expect((await monthlyPost(post({ month: "2099-12" }))).status).toBe(400);
    const next = new Date(Date.now() + 40 * 24 * 3600 * 1000);
    expect((await monthlyPost(post({ month: `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}` }))).status).toBe(400);
  });

  it("defaults to last month", async () => {
    const res = await monthlyPost(post({}));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.month).toMatch(/^\d{4}-\d{2}$/);
  });
});

// ── Rendering ────────────────────────────────────────────────────────────────────────────────
const ctx = (id = "tx1") => ({ params: Promise.resolve({ id }) });
const invoiceReq = () => new NextRequest("http://x/api/billing/invoice/tx1");

describe("GET /api/billing/invoice/[id]", () => {
  beforeEach(() => {
    auth.getVerifiedSession.mockResolvedValue({ userId: "u1", email: "owner@example.com", role: "USER" });
    db.transaction.findUnique.mockResolvedValue(purchase());
  });

  it("requires a session and ownership", async () => {
    auth.getVerifiedSession.mockResolvedValue(null);
    expect((await invoiceGet(invoiceReq(), ctx())).status).toBe(401);
    auth.getVerifiedSession.mockResolvedValue({ userId: "u2", email: "other@example.com", role: "USER" });
    expect((await invoiceGet(invoiceReq(), ctx())).status).toBe(403);
    auth.getVerifiedSession.mockResolvedValue({ userId: "a", email: "admin@example.com", role: "ADMIN" });
    expect((await invoiceGet(invoiceReq(), ctx())).status).toBe(200);
  });

  it("issues no document for payments that did not succeed", async () => {
    for (const status of ["PENDING", "FAILED"]) {
      db.transaction.findUnique.mockResolvedValue(purchase({ status }));
      expect((await invoiceGet(invoiceReq(), ctx())).status).toBe(409);
    }
  });

  it("a purchase gets a numbered tax invoice, escaped and locked down", async () => {
    const res = await invoiceGet(invoiceReq(), ctx());
    const html = await res.text();
    expect(html).toMatch(/AE\/\d{2}-\d{2}\/000001/);
    expect(html).toContain("Tax Invoice");
    expect(html).toContain("IGST");                         // Karnataka buyer, Maharashtra seller
    expect(html).toContain("₹100.00");
    expect(html).toMatch(/paid from wallet balance/i);
    expect(html).not.toContain("<b>Evil</b>");
    expect(html).toContain("&lt;b&gt;Evil&lt;/b&gt;");
    expect(html).not.toContain("javascript:alert");
    expect(html).not.toContain("onclick=");
    const csp = res.headers.get("content-security-policy") || "";
    const nonce = /script-src 'nonce-([^']+)'/.exec(csp)?.[1];
    expect(nonce).toBeTruthy();
    expect(html).toContain(`<script nonce="${nonce}">`);
    expect(res.headers.get("cache-control")).toContain("no-store");
  });

  it("viewing the same purchase again shows the SAME number (it is issued once)", async () => {
    await invoiceGet(invoiceReq(), ctx());
    const html2 = await (await invoiceGet(invoiceReq(), ctx())).text();
    expect(store.invoices).toHaveLength(1);
    expect(html2).toContain(String(store.invoices[0].number));
  });

  it("a wallet top-up gets a receipt with NO GST and consumes no invoice number", async () => {
    db.transaction.findUnique.mockResolvedValue(purchase({ creditsAdded: 118, paymentGateway: "RAZORPAY" }));
    const html = await (await invoiceGet(invoiceReq(), ctx())).text();
    expect(html).toContain("Payment Receipt");
    expect(html).toContain("REC-2026-ABCDEF12");
    expect(html).toContain("not a tax invoice");
    expect(html).not.toMatch(/CGST|SGST|IGST|Taxable Subtotal/);
    expect(store.invoices).toHaveLength(0);
  });

  it("an add-on bought from the wallet (negative amount) is invoiced at its positive value", async () => {
    db.transaction.findUnique.mockResolvedValue(purchase({ amount: -118, creditsAdded: -118, paymentGateway: "WALLET_INTERNAL" }));
    const html = await (await invoiceGet(invoiceReq(), ctx())).text();
    expect(html).toContain("Modular engine add-on");
    expect(html).toContain("₹100.00");
    expect(html).not.toContain("₹-");
  });

  it("a monthly usage invoice renders from its own id with the billing period", async () => {
    db.apiRequestLog.aggregate.mockResolvedValue({ _sum: { creditsCost: 59 }, _count: { _all: 1234 } });
    const inv = (await issueUsageInvoice("user-0000-1111-2222", 2026, 3)) as { id: string };
    db.invoice.findUnique.mockImplementation(async ({ where }: { where: { id?: string } }) => {
      const row = store.invoices.find((i) => i.id === where.id);
      return row ? { ...row, user: { email: "owner@example.com" } } : null;
    });
    const html = await (await invoiceGet(invoiceReq(), ctx(inv.id))).text();
    expect(html).toContain("Platform usage charges");
    expect(html).toContain("Billing Period");
    expect(html).toContain("1,234 billed calls / reports");
    expect(html).toContain("₹59.00");

    auth.getVerifiedSession.mockResolvedValue({ userId: "u2", email: "other@example.com", role: "USER" });
    expect((await invoiceGet(invoiceReq(), ctx(inv.id))).status).toBe(403);
  });
});

// ── GSTR-1 register ───────────────────────────────────────────────────────────────────────────
describe("GET /api/admin/reports?export=gstr1_returns", () => {
  const req = (qs = "") => new NextRequest(`http://x/api/admin/reports?export=gstr1_returns${qs}`);

  beforeEach(() => {
    auth.requireAdminSession.mockResolvedValue({ userId: "a1", role: "ADMIN" });
    db.auditLog.create.mockResolvedValue({});
    db.transaction.findMany.mockResolvedValue([]); // nothing legacy left to issue
    db.invoice.findMany.mockResolvedValue([
      { number: "AE/25-26/000001", issuedAt: new Date("2026-03-05T10:00:00Z"), type: "SALE", description: "Monthly SaaS platform subscription (paid via payment gateway)", quantity: 1,
        periodStart: null, gross: 118, taxable: 100, cgst: 0, sgst: 0, igst: 18, buyer: { name: "Acme", email: "=cmd|' /C calc'!A0@x.com", gstin: "29ABCDE1234F1Z5", state: "Karnataka" } },
      { number: "AE/25-26/000002", issuedAt: new Date("2026-04-01T01:00:00Z"), type: "USAGE", description: "Platform usage charges for March 2026", quantity: 900,
        periodStart: new Date("2026-02-28T18:30:00Z"), gross: 59, taxable: 50, cgst: 4.5, sgst: 4.5, igst: 0, buyer: { name: "Local", email: "b@example.com", gstin: "", state: "Maharashtra" } },
    ]);
  });

  it("is admin only", async () => {
    auth.requireAdminSession.mockResolvedValue(null);
    expect((await reportsGet(req())).status).toBe(403);
  });

  it("lists issued invoices in number order with totals and neutralised cells", async () => {
    const res = await reportsGet(req("&from=2026-03-01&to=2026-04-30"));
    expect(res.status).toBe(200);
    const arg = db.invoice.findMany.mock.calls[0][0];
    expect(arg.orderBy).toEqual([{ fiscalYear: "asc" }, { seq: "asc" }]);
    expect(arg.where.issuedAt.gte).toBeInstanceOf(Date);

    const lines = (await res.text()).trim().split("\n");
    expect(lines[0]).toContain("InvoiceNumber");
    expect(lines[1]).toContain("AE/25-26/000001");
    expect(lines[1]).toContain("'=cmd");                                 // formula injection neutralised
    expect(lines[2]).toContain("AE/25-26/000002");
    expect(lines[2]).toContain("USAGE");
    expect(lines[lines.length - 1]).toMatch(/^TOTAL,.*177\.00,150\.00,4\.50,4\.50,18\.00/);
    expect(db.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it("first issues invoices for older purchases that never got one", async () => {
    db.transaction.findMany.mockResolvedValue([{ id: "old-tx" }]);
    db.invoice.findMany.mockResolvedValueOnce([]).mockResolvedValue([]);          // none issued yet
    db.transaction.findUnique.mockResolvedValue(purchase({ id: "old-tx" }));
    await reportsGet(req());
    expect(store.invoices).toHaveLength(1);
    expect(store.invoices[0].transactionId).toBe("old-tx");
  });
});

// ── Admin retry: charge again when the job had been refunded ────────────────────────────────────
describe("POST /api/admin/pdf-queue/retry", () => {
  const receipt = { receiptId: "88", deductionType: "WALLET_CREDIT", addonId: null };
  const post = () => new NextRequest("http://x/api/admin/pdf-queue/retry", { method: "POST", body: JSON.stringify({ jobId: "job1" }) });
  const makeJob = (over: Record<string, unknown> = {}) => ({
    id: "job1", userId: "u1", reportType: "kundli_basic", refunded: true, status: "FAILED",
    requestPayload: { birthData: { dob: "1995-10-05", tob: "14:30", lat: 1, lon: 2 }, lang: "en", billing: { receiptId: "11", deductionType: "WALLET_CREDIT", addonId: null } },
    user: { name: "U", brandingConfig: null }, ...over,
  });

  beforeEach(async () => {
    auth.requireAdminSession.mockResolvedValue({ userId: "adm", role: "ADMIN" });
    (db as unknown as { pdfGenerationJob: { findUnique: ReturnType<typeof vi.fn> } }).pdfGenerationJob.findUnique = vi.fn().mockResolvedValue(makeJob());
    db.pdfGenerationJob.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "job1", status: data.status, ...data }));
    db.user.findUnique.mockResolvedValue({ id: "u1", role: "USER", walletBalance: 50 });
    db.auditLog.create.mockResolvedValue({});
    meter.meterCall.mockResolvedValue(NextResponse.json({ valid: true, ...receipt, creditsDeducted: 5 }, { status: 200 }));
    engine.dispatchPdfJob.mockResolvedValue({ jobId: "job1", jobResult: {}, finalStatus: "COMPLETED", fileUrl: "https://cdn/x.pdf" });
  });

  it("charges the customer again when the job had been refunded and the retry succeeds", async () => {
    const res = await retryPost(post());
    expect(res.status).toBe(200);
    expect(meter.meterCall).toHaveBeenCalledWith(expect.objectContaining({ id: "u1" }), "/api/v1/pdf/kundli/basic", "pdf");
    expect(meter.meterCall.mock.invocationCallOrder[0]).toBeLessThan(engine.dispatchPdfJob.mock.invocationCallOrder[0]);
    const data = db.pdfGenerationJob.update.mock.calls[0][0].data;
    expect(data.refunded).toBe(false);                                   // the customer paid again
    expect(data.requestPayload.billing).toEqual(receipt);               // new receipt covers this run
    expect(refund.applyRefund).not.toHaveBeenCalled();
  });

  it("refunds the new charge if the retry fails too", async () => {
    engine.dispatchPdfJob.mockResolvedValue({ jobId: "job1", jobResult: {}, finalStatus: "FAILED", fileUrl: null });
    await retryPost(post());
    expect(refund.applyRefund).toHaveBeenCalledWith(receipt, 500);
    expect(db.pdfGenerationJob.update.mock.calls[0][0].data.refunded).toBe(true);
  });

  it("refunds the new charge if the engine cannot be reached", async () => {
    engine.dispatchPdfJob.mockRejectedValue(new Error("ECONNREFUSED"));
    await retryPost(post());
    expect(refund.applyRefund).toHaveBeenCalledWith(receipt, 502);
    expect(db.pdfGenerationJob.update.mock.calls[0][0].data.refunded).toBe(true);
  });

  it("does not run the retry when the customer cannot pay", async () => {
    meter.meterCall.mockResolvedValue(NextResponse.json({ valid: false, error_code: "INSUFFICIENT_WALLET_FOR_REPORT", message: "wallet too low" }, { status: 403 }));
    const res = await retryPost(post());
    expect(res.status).toBe(409);
    expect(engine.dispatchPdfJob).not.toHaveBeenCalled();
  });

  it("a job that was never refunded is already paid for: free retry, no new charge", async () => {
    (db as unknown as { pdfGenerationJob: { findUnique: ReturnType<typeof vi.fn> } }).pdfGenerationJob.findUnique.mockResolvedValue(makeJob({ refunded: false }));
    const res = await retryPost(post());
    expect(res.status).toBe(200);
    expect(meter.meterCall).not.toHaveBeenCalled();
    expect(db.pdfGenerationJob.update.mock.calls[0][0].data.refunded).toBe(false);
  });
});
