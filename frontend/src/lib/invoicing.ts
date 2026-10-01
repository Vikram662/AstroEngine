import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toMoney } from "@/lib/money";
import { computeGst, isWalletTopUp, supplyValue } from "@/lib/invoice";
import { safeHttpUrl } from "@/lib/html";

// GST tax invoices with consecutive numbering.
//
// * Numbers look like AE/25-26/000001 (financial year Apr-Mar, 15 characters, within the
//   16-character GST limit) and are consecutive per financial year.
// * A number is taken from InvoiceCounter in the SAME database transaction that creates
//   the invoice: if anything fails the counter rolls back, so there are no gaps and no
//   duplicates, even with concurrent requests.
// * Seller and buyer details are copied onto the invoice when it is issued.

type Db = Prisma.TransactionClient;

const IST_OFFSET_MS = 5.5 * 3600 * 1000;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface PartySnapshot {
  [key: string]: string;
}

/** Financial year (India: 1 April - 31 March, measured in IST) as "25-26". */
export function fiscalYearOf(date: Date): string {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const year = ist.getUTCFullYear();
  const startYear = ist.getUTCMonth() >= 3 ? year : year - 1; // April = month index 3
  const yy = (n: number) => String(n % 100).padStart(2, "0");
  return `${yy(startYear)}-${yy(startYear + 1)}`;
}

export function formatInvoiceNumber(fiscalYear: string, seq: number, prefix = "AE"): string {
  return `${prefix}/${fiscalYear}/${String(seq).padStart(6, "0")}`;
}

/** First instant of an IST calendar month, as a UTC Date. month is 1-12. */
export function istMonthStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1) - IST_OFFSET_MS);
}

async function nextSeq(db: Db, fiscalYear: string): Promise<number> {
  // Atomic increment under the row lock held for the surrounding transaction.
  const row = await db.invoiceCounter.upsert({
    where: { fiscalYear },
    create: { fiscalYear, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  });
  return row.lastSeq;
}

export async function loadSeller(db: { systemSetting: Db["systemSetting"] }): Promise<PartySnapshot> {
  const rows = await db.systemSetting.findMany({ where: { key: { startsWith: "COMPANY_" } } });
  const m: Record<string, string> = {};
  for (const r of rows as Array<{ key: string; value: string }>) m[r.key] = r.value;
  const logo = m.COMPANY_LOGO_URL ? safeHttpUrl(m.COMPANY_LOGO_URL) : "#";
  return {
    name: m.COMPANY_NAME || "AstroEngine Technologies Pvt. Ltd.",
    legalName: m.COMPANY_LEGAL_NAME || "AstroEngine Cloud Services",
    tagline: m.COMPANY_TAGLINE || "",
    gstin: m.COMPANY_GSTIN || "",
    pan: m.COMPANY_PAN || "",
    sacCode: m.COMPANY_SAC_CODE || "998313",
    address: m.COMPANY_ADDRESS_LINE1 || "",
    city: m.COMPANY_CITY || "",
    state: m.COMPANY_STATE || "Maharashtra",
    stateCode: (m.COMPANY_STATE_CODE || "27").replace(/\D/g, "").slice(0, 2) || "27",
    pincode: m.COMPANY_PINCODE || "",
    phone: m.COMPANY_PHONE || "",
    email: m.COMPANY_EMAIL || "",
    logoUrl: logo === "#" ? "" : logo,
  };
}

export function buyerOf(user: { name: string | null; email: string; taxProfile: unknown }): PartySnapshot {
  const t = (user.taxProfile || {}) as Record<string, string | undefined>;
  return {
    name: t.businessName || user.name || "Enterprise Developer",
    email: user.email,
    gstin: t.gstin || "",
    pan: t.pan || (t.gstin && t.gstin.length >= 12 ? t.gstin.substring(2, 12) : ""),
    address: t.address || "",
    state: t.state || "",
  };
}

interface IssueInput {
  type: "SALE" | "USAGE";
  userId: string;
  grossAmount: number;
  description: string;
  quantity?: number;
  transactionId?: string;
  periodStart?: Date;
  periodEnd?: Date;
}

/** Creates the invoice and takes the next number. Must run inside a transaction. */
async function createInvoice(db: Db, input: IssueInput, now = new Date()) {
  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: { name: true, email: true, taxProfile: true },
  });
  if (!user) throw new Error("User not found for invoice");

  const seller = await loadSeller(db);
  const buyer = buyerOf(user);
  const gst = computeGst(input.grossAmount, { state: seller.state, stateCode: seller.stateCode }, { state: buyer.state, gstin: buyer.gstin });

  const fiscalYear = fiscalYearOf(now);
  const seq = await nextSeq(db, fiscalYear);

  return db.invoice.create({
    data: {
      number: formatInvoiceNumber(fiscalYear, seq),
      fiscalYear,
      seq,
      type: input.type,
      userId: input.userId,
      transactionId: input.transactionId ?? null,
      periodStart: input.periodStart ?? null,
      periodEnd: input.periodEnd ?? null,
      description: input.description,
      quantity: input.quantity ?? 1,
      gross: gst.gross,
      taxable: gst.taxable,
      cgst: gst.cgst,
      sgst: gst.sgst,
      igst: gst.igst,
      intraState: gst.intraState,
      seller,
      buyer,
      issuedAt: now,
    },
  });
}

interface PurchaseTx {
  id: string;
  userId: string;
  amount: unknown;
  creditsAdded: unknown;
  paymentGateway: string;
  status: string;
}

function describePurchase(tx: PurchaseTx): string {
  const isAddon = toMoney(tx.amount as never) < 0 || tx.paymentGateway === "WALLET_INTERNAL";
  const how = tx.paymentGateway === "WALLET" || tx.paymentGateway === "WALLET_INTERNAL" ? "paid from wallet balance" : "paid via payment gateway";
  return `${isAddon ? "Modular engine add-on" : "Monthly SaaS platform subscription"} (${how})`;
}

/**
 * Issues the tax invoice for a successful PURCHASE (plan / add-on). Wallet top-ups carry no
 * GST and get no invoice. Idempotent. Call it inside the transaction that settles the
 * payment so the invoice and its number commit (or roll back) together with it.
 */
export async function issueSaleInvoice(db: Db, tx: PurchaseTx) {
  if (tx.status !== "SUCCESS" || isWalletTopUp(tx as { creditsAdded: unknown })) return null;
  const existing = await db.invoice.findUnique({ where: { transactionId: tx.id } });
  if (existing) return existing;
  return createInvoice(db, {
    type: "SALE",
    userId: tx.userId,
    grossAmount: supplyValue(tx),
    description: describePurchase(tx),
    transactionId: tx.id,
  });
}

function isUniqueViolation(e: unknown): boolean {
  return (e as { code?: string })?.code === "P2002";
}

/** Standalone, race-safe variant: its own transaction, so a lost race leaves no gap. */
export async function ensureSaleInvoice(transactionId: string) {
  const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!tx) return null;
  try {
    return await prisma.$transaction((t: Db) => issueSaleInvoice(t, tx));
  } catch (e) {
    if (isUniqueViolation(e)) return prisma.invoice.findUnique({ where: { transactionId } });
    throw e;
  }
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * One consolidated invoice per user for a calendar month (IST) covering every metered
 * charge that was taken from the wallet during that month: per-call overage, add-on
 * overage and report generation. Calls that were refunded (status >= 400) are not billed.
 * Idempotent: a second run returns the existing invoice.
 */
export async function issueUsageInvoice(userId: string, year: number, month: number) {
  const periodStart = istMonthStart(year, month);
  const periodEnd = month === 12 ? istMonthStart(year + 1, 1) : istMonthStart(year, month + 1);

  const agg = await prisma.apiRequestLog.aggregate({
    where: { userId, createdAt: { gte: periodStart, lt: periodEnd }, statusCode: 200, creditsCost: { gt: 0 } },
    _sum: { creditsCost: true },
    _count: { _all: true },
  });
  const gross = round2(toMoney(agg._sum.creditsCost));
  if (gross <= 0) return null;

  try {
    return await prisma.$transaction(async (t: Db) => {
      const existing = await t.invoice.findFirst({ where: { userId, type: "USAGE", periodStart } });
      if (existing) return existing;
      return createInvoice(t, {
        type: "USAGE",
        userId,
        grossAmount: gross,
        description: `Platform usage charges for ${MONTHS[month - 1]} ${year}: per-call overage and report generation, deducted from the prepaid wallet`,
        quantity: agg._count._all,
        periodStart,
        periodEnd,
      });
    });
  } catch (e) {
    if (isUniqueViolation(e)) return prisma.invoice.findFirst({ where: { userId, type: "USAGE", periodStart } });
    throw e;
  }
}

/** Issues the usage invoice of every user who had billable usage in the month. */
export async function issueUsageInvoicesForMonth(year: number, month: number) {
  const start = istMonthStart(year, month);
  const end = month === 12 ? istMonthStart(year + 1, 1) : istMonthStart(year, month + 1);
  const users = await prisma.apiRequestLog.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: start, lt: end }, statusCode: 200, creditsCost: { gt: 0 } },
  });

  let issued = 0;
  let existing = 0;
  for (const u of users as Array<{ userId: string }>) {
    const before = await prisma.invoice.findFirst({ where: { userId: u.userId, type: "USAGE", periodStart: start }, select: { id: true } });
    const inv = await issueUsageInvoice(u.userId, year, month);
    if (!inv) continue;
    if (before) existing++;
    else issued++;
  }
  return { users: users.length, issued, existing };
}

/**
 * Issues invoices for successful purchases that predate invoice numbering (or whose
 * invoice was never created), oldest first so numbers follow the order of sale.
 */
export async function issueMissingSaleInvoices(limit = 500) {
  const txs = await prisma.transaction.findMany({
    where: { status: "SUCCESS", creditsAdded: { lte: 0 } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
    take: limit * 4,
  });
  if (txs.length === 0) return 0;
  const have = await prisma.invoice.findMany({
    where: { transactionId: { in: txs.map((t: { id: string }) => t.id) } },
    select: { transactionId: true },
  });
  const done = new Set(have.map((h: { transactionId: string | null }) => h.transactionId));
  let n = 0;
  for (const t of txs as Array<{ id: string }>) {
    if (done.has(t.id)) continue;
    if (n >= limit) break;
    await ensureSaleInvoice(t.id);
    n++;
  }
  return n;
}
