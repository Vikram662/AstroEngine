import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/authGuard";
import { hasValidInternalSecret } from "@/lib/internalAuth";
import { getClientIp } from "@/lib/clientIp";
import { issueMissingSaleInvoices, issueUsageInvoicesForMonth } from "@/lib/invoicing";

/** Calendar month before now, in IST. */
function previousIstMonth(now = new Date()): { year: number; month: number } {
  const ist = new Date(now.getTime() + 5.5 * 3600 * 1000);
  const y = ist.getUTCFullYear();
  const m = ist.getUTCMonth() + 1; // 1-12, current month
  return m === 1 ? { year: y - 1, month: 12 } : { year: y, month: m - 1 };
}

// POST /api/internal/invoices/monthly   { "month": "2026-03" }   (month optional: defaults to last month)
//
// Month-end billing run. Per-call overage and report charges are deducted from the wallet
// on every call, but they are INVOICED once, here: one consolidated GST invoice per customer
// per month. It also issues any purchase invoices that are still missing. Idempotent:
// running it twice for the same month creates nothing new.
//
// Authorised by the internal secret (for the scheduler: see scripts/monthly-invoices.ps1)
// or by an admin session.
export async function POST(req: NextRequest) {
  try {
    const viaSecret = Boolean(process.env.ASTRO_INTERNAL_SECRET) && hasValidInternalSecret(req);
    const admin = viaSecret ? null : await requireAdminSession();
    if (!viaSecret && !admin) {
      return NextResponse.json({ status: "error", message: "Forbidden." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const lastComplete = previousIstMonth();
    let { year, month } = lastComplete;
    if (body?.month !== undefined) {
      const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(String(body.month));
      if (!m) return NextResponse.json({ status: "error", message: "month must look like 2026-03" }, { status: 400 });
      year = Number(m[1]);
      month = Number(m[2]);
    }

    // A month can only be invoiced after it has ended.
    if (year > lastComplete.year || (year === lastComplete.year && month > lastComplete.month)) {
      return NextResponse.json({ status: "error", message: "That month has not ended yet." }, { status: 400 });
    }

    const sales = await issueMissingSaleInvoices();
    const usage = await issueUsageInvoicesForMonth(year, month);

    if (admin) {
      await prisma.auditLog
        .create({
          data: {
            actorUserId: admin.userId,
            actorRole: admin.role as "ADMIN" | "SUPER_ADMIN",
            action: "MONTHLY_INVOICES_RUN",
            targetType: "Invoice",
            targetId: `${year}-${String(month).padStart(2, "0")}`,
            metadata: { ...usage, salesInvoicesIssued: sales },
            ipAddress: getClientIp(req),
          },
        })
        .catch((e: unknown) => console.error("[invoices/monthly] audit log failed:", e));
    }

    return NextResponse.json({
      status: "success",
      month: `${year}-${String(month).padStart(2, "0")}`,
      usageInvoices: usage,
      salesInvoicesIssued: sales,
    });
  } catch (error: unknown) {
    console.error("[invoices/monthly]", error);
    return NextResponse.json({ status: "error", message: "Monthly invoice run failed." }, { status: 500 });
  }
}
