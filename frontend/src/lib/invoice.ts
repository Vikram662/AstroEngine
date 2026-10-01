// Single source of truth for invoice numbering and GST maths, shared by the
// printable invoice and the GSTR-1 CSV export so the two always agree.

import { toMoney } from "@/lib/money";

export const GST_RATE = 0.18;

/**
 * Policy: a wallet TOP-UP is a prepaid deposit, not a sale, so it carries no GST and gets
 * a payment receipt. GST is charged (and a tax invoice issued) when the money is used to
 * BUY something: a plan or add-on paid from the wallet, or a plan paid directly through
 * the gateway. Top-ups are recognised by the credits they add (> 0); every purchase
 * record has creditsAdded <= 0 (add-on purchases from the wallet store negative values).
 */
export function isWalletTopUp(tx: { creditsAdded: unknown }): boolean {
  return toMoney(tx.creditsAdded as never) > 0;
}

/** Value of the supply in rupees (add-on wallet purchases store a negative amount). */
export function supplyValue(tx: { amount: unknown }): number {
  return Math.abs(toMoney(tx.amount as never));
}

export function receiptNumber(tx: { id: string; createdAt: Date | string }): string {
  return `REC-${new Date(tx.createdAt).getFullYear()}-${tx.id.substring(0, 8).toUpperCase()}`;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Same number on the invoice and in every report: INV-<year>-<first 8 chars of tx id>. */
export function invoiceNumber(tx: { id: string; createdAt: Date | string }): string {
  return `INV-${new Date(tx.createdAt).getFullYear()}-${tx.id.substring(0, 8).toUpperCase()}`;
}

export interface GstBreakdown {
  gross: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  intraState: boolean;
}

/**
 * Prices are GST-inclusive (gross = taxable * 1.18). Intra-state supplies split the tax
 * into CGST + SGST, inter-state supplies charge IGST. Amounts are rounded to paise and
 * the parts always add back up to the gross amount exactly.
 */
export function computeGst(
  gross: number,
  seller: { state: string; stateCode: string },
  customer: { state?: string | null; gstin?: string | null }
): GstBreakdown {
  const customerState = (customer.state || "").trim().toLowerCase();
  const sellerState = seller.state.trim().toLowerCase();
  const gstin = (customer.gstin || "").trim();

  // GSTIN state code (first two digits) is authoritative when present; otherwise the
  // stated state; a customer with neither is treated as local.
  const intraState = gstin.length >= 2 && /^\d{2}/.test(gstin)
    ? gstin.startsWith(seller.stateCode)
    : !customerState || customerState.includes(sellerState) || sellerState.includes(customerState);

  const grossR = round2(gross);
  const taxable = round2(grossR / (1 + GST_RATE));
  const totalGst = round2(grossR - taxable);
  const cgst = intraState ? round2(totalGst / 2) : 0;
  const sgst = intraState ? round2(totalGst - cgst) : 0;
  const igst = intraState ? 0 : totalGst;
  return { gross: grossR, taxable, cgst, sgst, igst, intraState };
}
