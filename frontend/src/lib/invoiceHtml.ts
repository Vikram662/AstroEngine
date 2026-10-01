import { escapeHtml, safeHttpUrl } from "@/lib/html";

// Renders a tax invoice or a payment receipt from a normalized document, so issued
// invoices (which carry their own seller / buyer snapshots) and top-up receipts share one
// layout. Every value is HTML-escaped here; nothing upstream needs to remember to do it.

export interface DocView {
  kind: "INVOICE" | "RECEIPT";
  number: string;
  issuedAt: Date;
  seller: Record<string, string>;
  buyer: Record<string, string>;
  lineTitle: string;
  lineNote: string;
  quantity: string; // e.g. "1" or "1,240 calls"
  periodLabel?: string; // usage invoices: "1 Mar 2026 - 31 Mar 2026"
  gross: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  intraState: boolean;
  references: Array<{ label: string; value: string }>;
}

const money = (n: number) => `₹${n.toFixed(2)}`;
const e = (v: unknown) => escapeHtml(v == null ? "" : String(v));

export function renderDocumentHtml(doc: DocView, nonce: string): string {
  const isReceipt = doc.kind === "RECEIPT";
  const docTitle = isReceipt ? "Payment Receipt" : "Tax Invoice";
  const s = doc.seller;
  const b = doc.buyer;
  const logo = s.logoUrl && safeHttpUrl(s.logoUrl) !== "#" ? safeHttpUrl(s.logoUrl) : "";
  const issued = doc.issuedAt.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Kolkata" });
  const placeOfSupply = doc.intraState ? `${s.state} (${s.stateCode})` : (b.state || s.state);

  const taxRows = isReceipt
    ? ""
    : `
        <tr><td>Taxable Subtotal</td><td class="num-col">${money(doc.taxable)}</td></tr>
        ${doc.intraState
          ? `<tr><td>Central GST (CGST @ 9%)</td><td class="num-col">${money(doc.cgst)}</td></tr>
        <tr><td>State GST (SGST @ 9%)</td><td class="num-col">${money(doc.sgst)}</td></tr>`
          : `<tr><td>Integrated GST (IGST @ 18%)</td><td class="num-col">${money(doc.igst)}</td></tr>`}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${docTitle} - ${e(doc.number)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #f8fafc; padding: 40px 20px; color: #0f172a; }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 48px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .brand-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a; }
    .brand-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
    .tax-badge {
      text-align: right;
    }
    .badge-pill {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .invoice-meta {
      font-size: 12px;
      color: #475569;
      margin-top: 8px;
      line-height: 1.6;
    }
    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 36px;
    }
    .party-box h4 {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .party-name { font-size: 14px; font-weight: 700; color: #0f172a; }
    .party-details { font-size: 12px; color: #475569; line-height: 1.6; margin-top: 4px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
      font-size: 12px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 12px 16px;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
    }
    td {
      padding: 14px 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    .num-col { text-align: right; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .totals-area {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 36px;
    }
    .totals-table {
      width: 320px;
      border-collapse: collapse;
      font-size: 12px;
    }
    .totals-table td {
      padding: 8px 12px;
      border: none;
    }
    .total-row {
      border-top: 2px solid #0f172a !important;
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
    }
    .status-stamp {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.5;
    }
    .print-bar {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .btn {
      background: #0f172a;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn:hover { background: #1e293b; }
    @media print {
      body { padding: 0; background: #ffffff; }
      .invoice-card { border: none; box-shadow: none; padding: 20px; }
      .print-bar { display: none; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <button class="btn" id="print-btn">Print / Save as PDF</button>
  </div>

  <div class="invoice-card">
    <div class="header">
      <div>
        ${logo ? `<img src="${e(logo)}" alt="${e(s.name)}" style="max-height: 44px; max-width: 180px; object-fit: contain; margin-bottom: 8px; display: block;" />` : ""}
        <div class="brand-title">${e(s.name)}</div>
        <div class="brand-sub">${e(s.tagline)}</div>
        <div class="brand-sub" style="margin-top: 6px;">GSTIN: <strong>${e(s.gstin)}</strong>${isReceipt ? "" : ` • SAC Code: <strong>${e(s.sacCode)}</strong>`}</div>
      </div>
      <div class="tax-badge">
        <span class="badge-pill">${docTitle}</span>
        <div class="invoice-meta">
          <div><strong>${isReceipt ? "Receipt No" : "Invoice No"}:</strong> ${e(doc.number)}</div>
          <div><strong>Date of Issue:</strong> ${e(issued)}</div>
          ${doc.periodLabel ? `<div><strong>Billing Period:</strong> ${e(doc.periodLabel)}</div>` : ""}
          ${isReceipt ? "" : `<div><strong>Place of Supply:</strong> ${e(placeOfSupply)}</div>`}
        </div>
      </div>
    </div>

    <div class="parties-grid">
      <div class="party-box">
        <h4>Billed From (Supplier)</h4>
        <div class="party-name">${e(s.legalName)}</div>
        <div class="party-details">
          ${e(s.address)}<br>
          ${e(s.city)}, ${e(s.state)} - ${e(s.pincode)}<br>
          Email: ${e(s.email)}<br>
          Support: ${e(s.phone)}
        </div>
      </div>

      <div class="party-box">
        <h4>Billed To (Customer / Tenant)</h4>
        <div class="party-name">${e(b.name)}</div>
        <div class="party-details">
          ${b.gstin ? `<strong>GSTIN:</strong> <code>${e(b.gstin)}</code><br>` : ""}
          ${b.pan ? `<strong>PAN:</strong> <code>${e(b.pan)}</code><br>` : ""}
          ${b.address ? `<strong>Address:</strong> ${e(b.address)}<br>` : ""}
          ${b.state ? `<strong>State / UT:</strong> ${e(b.state)}<br>` : ""}
          Account Email: <strong>${e(b.email)}</strong><br>
          ${doc.references.map((r) => `${e(r.label)}: <code>${e(r.value)}</code><br>`).join("\n          ")}
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 8%;">#</th>
          <th style="width: 44%;">Description of Service</th>
          <th style="width: 14%;" class="num-col">SAC Code</th>
          <th style="width: 14%;" class="num-col">Qty / Units</th>
          <th style="width: 20%;" class="num-col">${isReceipt ? "Amount" : "Taxable Value"}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>
            <strong>${e(doc.lineTitle)}</strong>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${e(doc.lineNote)}</div>
          </td>
          <td class="num-col">${isReceipt ? "-" : e(s.sacCode)}</td>
          <td class="num-col">${e(doc.quantity)}</td>
          <td class="num-col">${money(isReceipt ? doc.gross : doc.taxable)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals-area">
      <table class="totals-table">${taxRows}
        <tr class="total-row">
          <td>${isReceipt ? "Total Amount Received (INR)" : "Total Gross Invoice (INR)"}</td>
          <td class="num-col">${money(doc.gross)}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      ${isReceipt
        ? "This is a computer-generated payment receipt. It is not a tax invoice."
        : "This is a computer-generated tax invoice issued pursuant to Section 31 of the CGST Act, 2017."}<br>
      No physical signature is required. For any billing inquiries, contact <strong>${e(s.email)}</strong>.
    </div>
  </div>
<script nonce="${nonce}">document.getElementById("print-btn").addEventListener("click", function () { window.print(); });</script>
</body>
</html>`;
}
