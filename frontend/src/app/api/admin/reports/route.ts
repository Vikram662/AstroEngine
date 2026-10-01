import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/authGuard";
import { toMoney } from "@/lib/money";
import { publicMessage } from "@/lib/apiErrors";
import { issueMissingSaleInvoices } from "@/lib/invoicing";
import { csvRow } from "@/lib/csv";
import { getClientIp } from "@/lib/clientIp";

const MAX_EXPORT_ROWS = 20000;

function parseDate(value: string | null, endOfDay = false): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function audit(admin: { userId: string; role: string }, req: NextRequest, action: string, metadata: object) {
  // Exports contain customer data: always leave a trail.
  await prisma.auditLog
    .create({
      data: {
        actorUserId: admin.userId,
        actorRole: admin.role as "ADMIN" | "SUPER_ADMIN",
        action,
        targetType: "Report",
        targetId: action,
        metadata,
        ipAddress: getClientIp(req),
      },
    })
    .catch((e: unknown) => console.error("[admin/reports] audit log failed:", e));
}

function csvResponse(csv: string, filename: string) {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// GET /api/admin/reports - module popularity (JSON) and CSV exports
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ status: "error", message: "Forbidden: Admin authorization required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const exportType = searchParams.get("export");

    // ── GSTR-1 style sales register ────────────────────────────────────────────
    // Lists the ISSUED tax invoices, in number order: plan / add-on purchase invoices and
    // the month-end consolidated usage invoices. Wallet top-ups are prepaid deposits with
    // no GST and are not part of it. Seller / buyer details come from the snapshot taken
    // when each invoice was issued.
    if (exportType === "gstr1_returns") {
      const from = parseDate(searchParams.get("from"));
      const to = parseDate(searchParams.get("to"), true);

      // Purchases that predate invoice numbering get their invoice now (oldest first).
      await issueMissingSaleInvoices();

      const invoices = await prisma.invoice.findMany({
        where: from || to ? { issuedAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {},
        orderBy: [{ fiscalYear: "asc" }, { seq: "asc" }],
        select: {
          number: true, issuedAt: true, type: true, description: true, quantity: true, periodStart: true,
          gross: true, taxable: true, cgst: true, sgst: true, igst: true, buyer: true,
        },
        take: MAX_EXPORT_ROWS,
      });

      let csv = csvRow([
        "InvoiceNumber", "Date", "Type", "CustomerName", "CustomerEmail", "CustomerGSTIN", "CustomerState",
        "Gross", "TaxableValue", "CGST", "SGST", "IGST", "Description",
      ]) + "\n";
      const totals = { gross: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 };

      for (const inv of invoices) {
        const buyer = (inv.buyer || {}) as Record<string, string>;
        const n = {
          gross: toMoney(inv.gross), taxable: toMoney(inv.taxable),
          cgst: toMoney(inv.cgst), sgst: toMoney(inv.sgst), igst: toMoney(inv.igst),
        };
        totals.gross += n.gross; totals.taxable += n.taxable; totals.cgst += n.cgst; totals.sgst += n.sgst; totals.igst += n.igst;
        csv += csvRow([
          inv.number, inv.issuedAt.toISOString().substring(0, 10), inv.type,
          buyer.name || "", buyer.email || "", buyer.gstin || "", buyer.state || "",
          n.gross.toFixed(2), n.taxable.toFixed(2), n.cgst.toFixed(2), n.sgst.toFixed(2), n.igst.toFixed(2),
          inv.description,
        ]) + "\n";
      }
      const r2 = (n: number) => n.toFixed(2);
      csv += csvRow(["TOTAL", "", "", "", "", "", "", r2(totals.gross), r2(totals.taxable), r2(totals.cgst), r2(totals.sgst), r2(totals.igst), ""]) + "\n";
      if (invoices.length === MAX_EXPORT_ROWS) csv += csvRow([`NOTE: export truncated at ${MAX_EXPORT_ROWS} rows - narrow the date range`]) + "\n";

      await audit(admin, req, "REPORT_EXPORT_GSTR1", { rows: invoices.length, from: from?.toISOString(), to: to?.toISOString() });
      return csvResponse(csv, `GSTR1_${new Date().toISOString().substring(0, 10)}.csv`);
    }

    if (exportType === "top_consumers") {
      const users = await prisma.user.findMany({
        orderBy: { monthlyUsage: "desc" },
        take: 50,
        select: { id: true, email: true, planTier: true, monthlyUsage: true, monthlyQuota: true, walletBalance: true },
      });

      let csv = csvRow(["UserId", "Email", "PlanTier", "MonthlyUsage", "MonthlyQuota", "WalletBalance"]) + "\n";
      for (const u of users) {
        csv += csvRow([u.id, u.email, u.planTier, u.monthlyUsage, u.monthlyQuota, toMoney(u.walletBalance)]) + "\n";
      }

      await audit(admin, req, "REPORT_EXPORT_TOP_CONSUMERS", { rows: users.length });
      return csvResponse(csv, `TopConsumers_${new Date().toISOString().substring(0, 10)}.csv`);
    }

    // ── Module popularity: counted in the database over a time window ─────────────
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days") || "30", 10) || 30));
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);

    const grouped = await prisma.apiRequestLog.groupBy({
      by: ["module"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { module: "desc" } },
      take: 20,
    });
    const total = await prisma.apiRequestLog.count({ where: { createdAt: { gte: since } } });

    const breakdown = grouped.map((g: { module: string; _count: { _all: number } }) => ({
      name: g.module || "General",
      count: g._count._all,
      percentage: total > 0 ? ((g._count._all / total) * 100).toFixed(1) : "0.0",
    }));

    return NextResponse.json({
      status: "success",
      data: {
        windowDays: days,
        totalCalls: total,
        totalCallsSampled: total, // kept for the existing UI
        breakdown: breakdown.length > 0 ? breakdown : [
          { name: "Panchang & Muhurat", count: 0, percentage: "0.0" },
          { name: "KP Horary", count: 0, percentage: "0.0" },
          { name: "Parashari Charts", count: 0, percentage: "0.0" },
          { name: "PDF Brihat Kundli", count: 0, percentage: "0.0" }
        ]
      }
    });
  } catch (error: unknown) {
    return NextResponse.json({ status: "error", message: publicMessage(error) }, { status: 500 });
  }
}
