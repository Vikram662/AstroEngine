import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";

// GET /api/billing/invoice/[id] - Generates a printable Tax Invoice / GST Invoice HTML
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getVerifiedSession();
    if (!session || !session.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const tx = await prisma.transaction.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!tx) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    // Only account owner or admin can download invoice
    if (tx.user.email !== session.email && session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // HTML entity escaping helper to prevent Stored XSS (§S16)
    const escapeHtml = (str: string | null | undefined): string => {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    // Fetch dynamic company profile and tax settings from MySQL SystemSetting table
    const companySettings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            "COMPANY_NAME",
            "COMPANY_LOGO_URL",
            "COMPANY_LEGAL_NAME",
            "COMPANY_TAGLINE",
            "COMPANY_GSTIN",
            "COMPANY_PAN",
            "COMPANY_SAC_CODE",
            "COMPANY_ADDRESS_LINE1",
            "COMPANY_CITY",
            "COMPANY_STATE",
            "COMPANY_STATE_CODE",
            "COMPANY_PINCODE",
            "COMPANY_PHONE",
            "COMPANY_EMAIL"
          ]
        }
      }
    });

    const companyMap: Record<string, string> = {};
    for (const s of companySettings) {
      companyMap[s.key] = s.value;
    }

    const sellerName = escapeHtml(companyMap["COMPANY_NAME"] || "AstroEngine Technologies Pvt. Ltd.");
    const sellerLogoUrl = escapeHtml(companyMap["COMPANY_LOGO_URL"] || "");
    const sellerLegalName = escapeHtml(companyMap["COMPANY_LEGAL_NAME"] || "AstroEngine Cloud Services");
    const sellerTagline = escapeHtml(companyMap["COMPANY_TAGLINE"] || "Enterprise Vedic & Western Astrology API Infrastructure");
    const sellerGstin = escapeHtml(companyMap["COMPANY_GSTIN"] || "27AABCA1234F1Z8");
    const sellerSacCode = escapeHtml(companyMap["COMPANY_SAC_CODE"] || "998313");
    const sellerAddress = escapeHtml(companyMap["COMPANY_ADDRESS_LINE1"] || "Level 4, Tech Park, Bandra Kurla Complex");
    const sellerCity = escapeHtml(companyMap["COMPANY_CITY"] || "Mumbai");
    const sellerState = escapeHtml(companyMap["COMPANY_STATE"] || "Maharashtra");
    const sellerStateCode = companyMap["COMPANY_STATE_CODE"] || "27";
    const sellerPincode = escapeHtml(companyMap["COMPANY_PINCODE"] || "400051");
    const sellerPhone = escapeHtml(companyMap["COMPANY_PHONE"] || "+91 22 4910 8800");
    const sellerEmail = escapeHtml(companyMap["COMPANY_EMAIL"] || "billing@astroengine.io");

    // Fetch customer tax profile if available
    const taxProfile = (tx.user as any).taxProfile || {};
    const customerGstin = escapeHtml(taxProfile.gstin || "");
    const customerBusinessName = escapeHtml(taxProfile.businessName || tx.user.name || "Enterprise Developer");
    const customerAddress = escapeHtml(taxProfile.address || "");
    const customerState = escapeHtml(taxProfile.state || "");
    const customerPan = escapeHtml(taxProfile.pan || (customerGstin.length >= 12 ? customerGstin.substring(2, 12) : ""));

    // Calculations for 18% GST:
    // If customer is in same state as seller (State Code match or state name match), CGST 9% + SGST 9%. Otherwise IGST 18%.
    const isIntraState = !customerState || 
      customerState.toLowerCase().includes(sellerState.toLowerCase()) || 
      customerGstin.startsWith(sellerStateCode);
    
    const grossAmount = Number(tx.amount);
    const taxableValue = grossAmount / 1.18;
    const totalGst = grossAmount - taxableValue;
    const cgst = isIntraState ? totalGst / 2 : 0;
    const sgst = isIntraState ? totalGst / 2 : 0;
    const igst = isIntraState ? 0 : totalGst;
    
    const invoiceNumber = `INV-${new Date(tx.createdAt).getFullYear()}-${tx.id.substring(0, 8).toUpperCase()}`;
    const invoiceDate = new Date(tx.createdAt).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${invoiceNumber}</title>
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
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="invoice-card">
    <div class="header">
      <div>
        ${sellerLogoUrl ? `<img src="${sellerLogoUrl}" alt="${sellerName}" style="max-height: 44px; max-width: 180px; object-fit: contain; margin-bottom: 8px; display: block;" />` : ""}
        <div class="brand-title">${sellerName}</div>
        <div class="brand-sub">${sellerTagline}</div>
        <div class="brand-sub" style="margin-top: 6px;">GSTIN: <strong>${sellerGstin}</strong> • SAC Code: <strong>${sellerSacCode}</strong></div>
      </div>
      <div class="tax-badge">
        <span class="badge-pill">Tax Invoice</span>
        <div class="invoice-meta">
          <div><strong>Invoice No:</strong> ${invoiceNumber}</div>
          <div><strong>Date of Issue:</strong> ${invoiceDate}</div>
          <div><strong>Place of Supply:</strong> ${sellerState} (${sellerStateCode})</div>
        </div>
      </div>
    </div>

    <div class="parties-grid">
      <div class="party-box">
        <h4>Billed From (Supplier)</h4>
        <div class="party-name">${sellerLegalName}</div>
        <div class="party-details">
          ${sellerAddress}<br>
          ${sellerCity}, ${sellerState} - ${sellerPincode}<br>
          Email: ${sellerEmail}<br>
          Support: ${sellerPhone}
        </div>
      </div>

      <div class="party-box">
        <h4>Billed To (Customer / Tenant)</h4>
        <div class="party-name">${customerBusinessName}</div>
        <div class="party-details">
          ${customerGstin ? `<strong>GSTIN:</strong> <code>${customerGstin}</code><br>` : ""}
          ${customerPan ? `<strong>PAN:</strong> <code>${customerPan}</code><br>` : ""}
          ${customerAddress ? `<strong>Address:</strong> ${customerAddress}<br>` : ""}
          ${customerState ? `<strong>State / UT:</strong> ${customerState}<br>` : ""}
          Account Email: <strong>${tx.user.email}</strong><br>
          User ID: ${tx.userId.substring(0, 14)}...<br>
          Payment Gateway: Razorpay Checkout<br>
          Order ID: <code>${tx.gatewayOrderId || tx.id}</code><br>
          Payment Status: <span class="status-stamp">✓ ${tx.status} (Verified)</span>
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
          <th style="width: 20%;" class="num-col">Taxable Amt (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>
            <strong>${tx.creditsAdded > 0 ? "Prepaid API Compute Credits Top-up" : "Monthly SaaS Platform Subscription"}</strong>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              ${tx.creditsAdded > 0 ? `Dispatched ${tx.creditsAdded.toLocaleString()} computational wallet credits for calculations & PDFs` : "Tiered developer license & quota"}
            </div>
          </td>
          <td class="num-col">998313</td>
          <td class="num-col">1</td>
          <td class="num-col">₹${taxableValue.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals-area">
      <table class="totals-table">
        <tr>
          <td>Taxable Subtotal</td>
          <td class="num-col">₹${taxableValue.toFixed(2)}</td>
        </tr>
        ${isIntraState ? `
        <tr>
          <td>Central GST (CGST @ 9%)</td>
          <td class="num-col">₹${cgst.toFixed(2)}</td>
        </tr>
        <tr>
          <td>State GST (SGST @ 9%)</td>
          <td class="num-col">₹${sgst.toFixed(2)}</td>
        </tr>
        ` : `
        <tr>
          <td>Integrated GST (IGST @ 18%)</td>
          <td class="num-col">₹${igst.toFixed(2)}</td>
        </tr>
        `}
        <tr class="total-row">
          <td>Total Gross Invoice (INR)</td>
          <td class="num-col">₹${grossAmount.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      This is a computer-generated tax invoice issued pursuant to Section 31 of the CGST Act, 2017.<br>
      No physical signature is required. For any billing inquiries, contact <strong>billing@astroengine.io</strong>.
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8"
      }
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return new NextResponse(`Server Error: ${err.message}`, { status: 500 });
  }
}
