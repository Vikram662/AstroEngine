import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/authGuard";
import { hasValidInternalSecret } from "@/lib/internalAuth";
import { detectErrorSpikes, processNotificationQueue } from "@/lib/notifications";
import { reconcileOpenPdfJobs } from "@/lib/pdfReconcile";

// POST /api/internal/notifications/process
// The scheduler endpoint (run every minute: scripts/process-notifications.ps1). It
//  1. re-checks reports that were still running (ready / failed alert + refund of failures),
//  2. raises error-spike alerts,
//  3. sends everything that is due in the notification queue.
// New notifications are also delivered immediately by the app itself; this run is the safety
// net that retries failures and covers events nobody triggers by hand. Safe to run in parallel.
export async function POST(req: NextRequest) {
  try {
    const viaSecret = Boolean(process.env.ASTRO_INTERNAL_SECRET) && hasValidInternalSecret(req);
    if (!viaSecret && !(await requireAdminSession())) {
      return NextResponse.json({ status: "error", message: "Forbidden." }, { status: 403 });
    }

    const reportsUpdated = await reconcileOpenPdfJobs();
    const spikeAlerts = await detectErrorSpikes();

    const totals = { sent: 0, skipped: 0, retried: 0, failed: 0 };
    for (let i = 0; i < 5; i++) {
      const r = await processNotificationQueue(100);
      totals.sent += r.sent; totals.skipped += r.skipped; totals.retried += r.retried; totals.failed += r.failed;
      if (r.sent + r.skipped + r.retried + r.failed < 100) break;
    }

    return NextResponse.json({ status: "success", reportsUpdated, spikeAlerts, notifications: totals });
  } catch (error: unknown) {
    console.error("[notifications/process]", error);
    return NextResponse.json({ status: "error", message: "Processing failed." }, { status: 500 });
  }
}
