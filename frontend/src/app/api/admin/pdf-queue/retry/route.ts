import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/authGuard";
import { REPORT_ENDPOINTS, buildPdfPayload, dispatchPdfJob } from "@/lib/pdfEngine";
import { toJsonSafe } from "@/lib/money";
import { publicMessage } from "@/lib/apiErrors";
import { getClientIp } from "@/lib/clientIp";
import { meterCall } from "@/lib/metering";
import { applyRefund, type Receipt } from "@/lib/billingRefund";
import { receiptOf } from "@/lib/pdfReconcile";

// Actually resubmits a failed PDF job to the backend using its originally stored
// birth-data payload — jobs created before `requestPayload` was added have no
// stored payload and can't be replayed, so those are reported as such rather
// than silently pretending to retry.
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ status: "error", message: "Forbidden: Admin authorization required." }, { status: 403 });
    }

    const { jobId } = await req.json();
    if (!jobId) {
      return NextResponse.json({ status: "error", message: "jobId required" }, { status: 400 });
    }

    const job = await prisma.pdfGenerationJob.findUnique({
      where: { id: jobId },
      include: { user: true }
    });

    if (!job) {
      return NextResponse.json({ status: "error", message: "Job not found" }, { status: 404 });
    }

    if (!job.requestPayload) {
      return NextResponse.json({
        status: "error",
        message: "This job predates request-payload storage — the original birth data was never saved, so it can't be automatically retried. Ask the tenant to resubmit."
      }, { status: 409 });
    }

    const stored = job.requestPayload as { birthData?: Record<string, unknown>; branding?: Record<string, unknown>; lang?: string };
    const report = REPORT_ENDPOINTS[job.reportType] || REPORT_ENDPOINTS.kundli_brihat;
    const { payload } = buildPdfPayload(job.reportType, stored.birthData, stored.branding, stored.lang, job.user);

    // A job that failed was refunded to the customer. If the retry now succeeds they get the
    // report, so they are charged again (at the report price) before it is re-run, and
    // refunded again if the retry fails too. A job that was NOT refunded is already paid for,
    // so its retry is free.
    let newReceipt: Receipt | null = null;
    let recharged = false;
    if (job.refunded) {
      const customer = await prisma.user.findUnique({ where: { id: job.userId }, include: { subscription: true } });
      if (!customer) {
        return NextResponse.json({ status: "error", message: "Customer account not found." }, { status: 404 });
      }
      const metered = await meterCall(customer, report.path, "pdf");
      const meterBody = await metered.json();
      if (metered.status !== 200 || !meterBody.valid) {
        return NextResponse.json({
          status: "error",
          message: meterBody.message || "The customer cannot be charged for the retry (wallet too low?). Ask them to recharge, then retry."
        }, { status: 409 });
      }
      recharged = true;
      newReceipt = meterBody.receiptId
        ? { receiptId: String(meterBody.receiptId), deductionType: meterBody.deductionType, addonId: meterBody.addonId ?? null }
        : null;
    }
    const activeReceipt = newReceipt ?? receiptOf(job.requestPayload);

    let updatedJob;
    try {
      const { finalStatus, fileUrl } = await dispatchPdfJob(report, payload);
      const failed = finalStatus === "FAILED";
      if (failed && newReceipt) await applyRefund(newReceipt, 500);

      updatedJob = await prisma.pdfGenerationJob.update({
        where: { id: jobId },
        data: {
          status: finalStatus as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED",
          fileUrl,
          failureReason: failed ? "Retry attempt also failed at the backend" : null,
          // refunded = the customer currently holds their money back. Re-charged and now
          // running / done => false; failed again after being re-charged => refunded again.
          refunded: recharged ? failed : job.refunded,
          // Keep the receipt of the charge that covers this run, so a later failure refunds it.
          ...(recharged ? { requestPayload: JSON.parse(JSON.stringify({ ...stored, billing: activeReceipt })) } : {})
        }
      });
    } catch (dispatchErr: unknown) {
      const dErr = dispatchErr as { message?: string };
      console.error("[admin/pdf-queue/retry] dispatch error:", dErr.message);
      if (newReceipt) await applyRefund(newReceipt, 502);
      updatedJob = await prisma.pdfGenerationJob.update({
        where: { id: jobId },
        data: { status: "FAILED", failureReason: "Retry could not be dispatched to the report engine.", refunded: recharged ? true : job.refunded }
      });
    }

    const requestIp = getClientIp(req);
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.userId,
        actorRole: admin.role as "ADMIN" | "SUPER_ADMIN",
        action: "PDF_JOB_RETRIED",
        targetType: "PdfGenerationJob",
        targetId: jobId,
        metadata: { newStatus: updatedJob.status, rechargedCustomer: recharged },
        ipAddress: requestIp
      }
    });

    return NextResponse.json({ status: "success", data: toJsonSafe(updatedJob) });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: publicMessage(err, "Retry failed") }, { status: 500 });
  }
}
