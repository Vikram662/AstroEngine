import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/authGuard";
import { toMoney } from "@/lib/money";
import { publicMessage } from "@/lib/apiErrors";
import { computeGst, invoiceNumber, supplyValue } from "@/lib/invoice";
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
    // Taxable supplies only: plans / add-ons bought from the wallet or directly through
    // the gateway. Wallet top-ups are prepaid deposits without GST (they get a receipt,
    // not a tax invoice), so they are not in this register.
    if (exportType === "gstr1_returns") {
      const from = parseDate(searchParams.get("from"));
      const to = parseDate(searchParams.get("to"), true);

      const settings = await prisma.systemSetting.findMany({
        where: { key: { in: ["COMPANY_STATE", "COMPANY_STATE_CODE"] } },
      });
      const sellerState = settings.find((s: { key: string; value: string }) => s.key === "COMPANY_STATE")?.value || "Maharashtra";
      const sellerStateCode = (settings.find((s: { key: string; value: string }) => s.key === "COMPANY_STATE_CODE")?.value || "27").replace(/\D/g, "").slice(0, 2) || "27";

      const txs = await prisma.transaction.findMany({
        where: {
          status: "SUCCESS",
          creditsAdded: { lte: 0 }, // purchases only (top-ups add credits)
          ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
        },
        select: {
          id: true, createdAt: true, amount: true, paymentGateway: true, gatewayPaymentId: true,
          user: { select: { email: true, taxProfile: true } },
        },
        orderBy: { createdAt: "asc" },
        take: MAX_EXPORT_ROWS,
      });

      let csv = csvRow([
        "InvoiceNumber", "Date", "CustomerEmail", "CustomerGSTIN", "CustomerState",
        "Gross", "TaxableValue", "CGST", "SGST", "IGST", "PaymentGateway", "GatewayPaymentId",
      ]) + "\n";
      const totals = { gross: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 };

      for (const t of txs) {
        const profile = (t.user.taxProfile || {}) as { gstin?: string; state?: string };
        const g = computeGst(supplyValue(t), { state: sellerState, stateCode: sellerStateCode }, profile);
        totals.gross += g.gross; totals.taxable += g.taxable; totals.cgst += g.cgst; totals.sgst += g.sgst; totals.igst += g.igst;
        csv += csvRow([
          invoiceNumber(t), t.createdAt.toISOString().substring(0, 10), t.user.email,
          profile.gstin || "", profile.state || "",
          g.gross.toFixed(2), g.taxable.toFixed(2), g.cgst.toFixed(2), g.sgst.toFixed(2), g.igst.toFixed(2),
          t.paymentGateway, t.gatewayPaymentId || "",
        ]) + "\n";
      }
      const r2 = (n: number) => n.toFixed(2);
      csv += csvRow(["TOTAL", "", "", "", "", r2(totals.gross), r2(totals.taxable), r2(totals.cgst), r2(totals.sgst), r2(totals.igst), "", ""]) + "\n";
      if (txs.length === MAX_EXPORT_ROWS) csv += csvRow([`NOTE: export truncated at ${MAX_EXPORT_ROWS} rows - narrow the date range`]) + "\n";

      await audit(admin, req, "REPORT_EXPORT_GSTR1", { rows: txs.length, from: from?.toISOString(), to: to?.toISOString() });
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
