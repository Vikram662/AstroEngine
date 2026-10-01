import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";
import { toMoney } from "@/lib/money";
import { publicMessage } from "@/lib/apiErrors";
import { isWalletTopUp, receiptNumber, supplyValue } from "@/lib/invoice";
import { buyerOf, ensureSaleInvoice, loadSeller } from "@/lib/invoicing";
import { renderDocumentHtml, type DocView } from "@/lib/invoiceHtml";

// GET /api/billing/invoice/[id]
//  * [id] = an Invoice id (sale invoice or monthly usage invoice): rendered from the
//    snapshot stored when it was issued, so it never changes afterwards.
//  * [id] = a Transaction id: a wallet top-up gets a payment receipt (no GST); a purchase
//    gets its tax invoice (issued now if it predates invoice numbering).
const MONTH_FMT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" };

function htmlResponse(html: string, nonce: string) {
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Contains billing data: never cached, never framed, and no script but ours can run.
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; img-src https: data:; style-src 'unsafe-inline'; frame-ancestors 'self'`,
    },
  });
}

type StoredInvoice = {
  number: string; issuedAt: Date; type: string; description: string; quantity: number;
  periodStart: Date | null; periodEnd: Date | null; gross: unknown; taxable: unknown; cgst: unknown; sgst: unknown; igst: unknown;
  intraState: boolean; seller: unknown; buyer: unknown; transactionId: string | null;
};

function viewOfInvoice(inv: StoredInvoice): DocView {
  const isUsage = inv.type === "USAGE";
  const periodLabel = isUsage && inv.periodStart && inv.periodEnd
    ? `${inv.periodStart.toLocaleDateString("en-IN", MONTH_FMT)} - ${new Date(inv.periodEnd.getTime() - 1).toLocaleDateString("en-IN", MONTH_FMT)}`
    : undefined;
  return {
    kind: "INVOICE",
    number: inv.number,
    issuedAt: inv.issuedAt,
    seller: inv.seller as Record<string, string>,
    buyer: inv.buyer as Record<string, string>,
    lineTitle: isUsage ? "Platform usage charges" : inv.description.split(" (")[0],
    lineNote: isUsage ? inv.description : inv.description,
    quantity: isUsage ? `${inv.quantity.toLocaleString("en-IN")} billed calls / reports` : "1",
    periodLabel,
    gross: toMoney(inv.gross as never),
    taxable: toMoney(inv.taxable as never),
    cgst: toMoney(inv.cgst as never),
    sgst: toMoney(inv.sgst as never),
    igst: toMoney(inv.igst as never),
    intraState: inv.intraState,
    references: [{ label: "Invoice type", value: isUsage ? "Monthly consolidated usage invoice" : "Purchase" }],
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getVerifiedSession();
    if (!session || !session.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN";
    const nonce = crypto.randomBytes(16).toString("base64");

    // 1) An issued invoice, by its own id
    const issued = await prisma.invoice.findUnique({ where: { id }, include: { user: { select: { email: true } } } });
    if (issued) {
      if (issued.user.email !== session.email && !isAdmin) return new NextResponse("Forbidden", { status: 403 });
      return htmlResponse(renderDocumentHtml(viewOfInvoice(issued), nonce), nonce);
    }

    // 2) A transaction
    const tx = await prisma.transaction.findUnique({ where: { id }, include: { user: true } });
    if (!tx) return new NextResponse("Invoice not found", { status: 404 });
    if (tx.user.email !== session.email && !isAdmin) return new NextResponse("Forbidden", { status: 403 });

    // A document is only issued for money actually received.
    if (tx.status !== "SUCCESS") {
      return new NextResponse("Invoice is available once the payment has succeeded.", { status: 409 });
    }

    if (isWalletTopUp(tx)) {
      // Prepaid deposit: receipt without GST. The tax invoice comes with the purchase.
      const seller = await loadSeller(prisma);
      const buyer = buyerOf(tx.user);
      const credits = toMoney(tx.creditsAdded);
      const view: DocView = {
        kind: "RECEIPT",
        number: receiptNumber(tx),
        issuedAt: tx.createdAt,
        seller,
        buyer,
        lineTitle: "Prepaid wallet top-up",
        lineNote: `${credits.toLocaleString("en-IN")} wallet credits added. A top-up is a prepaid deposit, not a supply of services: GST is charged and invoiced when the wallet is used to purchase services.`,
        quantity: "1",
        gross: supplyValue(tx),
        taxable: supplyValue(tx),
        cgst: 0, sgst: 0, igst: 0, intraState: true,
        references: [
          { label: "Payment Gateway", value: tx.paymentGateway },
          { label: "Order ID", value: tx.gatewayOrderId || tx.id },
          { label: "Payment Status", value: `${tx.status} (Verified)` },
        ],
      };
      return htmlResponse(renderDocumentHtml(view, nonce), nonce);
    }

    const invoice = await ensureSaleInvoice(tx.id);
    if (!invoice) return new NextResponse("Invoice could not be issued", { status: 500 });
    const view = viewOfInvoice(invoice);
    view.references = [
      { label: "Payment Gateway", value: tx.paymentGateway },
      { label: "Order ID", value: tx.gatewayOrderId || tx.id },
      { label: "Payment Status", value: `${tx.status} (Verified)` },
    ];
    return htmlResponse(renderDocumentHtml(view, nonce), nonce);
  } catch (error: unknown) {
    return new NextResponse(publicMessage(error, "Server Error"), { status: 500 });
  }
}
