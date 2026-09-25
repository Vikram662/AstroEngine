import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/authGuard";
import { REPORT_ENDPOINTS, buildPdfPayload, dispatchPdfJob } from "@/lib/pdfEngine";

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

    let updatedJob;
    try {
      const { finalStatus, fileUrl } = await dispatchPdfJob(report, payload);
      updatedJob = await prisma.pdfGenerationJob.update({
        where: { id: jobId },
        data: {
          status: finalStatus as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED",
          fileUrl,
          failureReason: finalStatus === "FAILED" ? "Retry attempt also failed at the backend" : null,
          refunded: finalStatus === "FAILED" ? job.refunded : false
        }
      });
    } catch (dispatchErr: unknown) {
      const dErr = dispatchErr as { message?: string };
      updatedJob = await prisma.pdfGenerationJob.update({
        where: { id: jobId },
        data: { status: "FAILED", failureReason: `Retry dispatch error: ${dErr.message || "unknown"}` }
      });
    }

    const requestIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.userId,
        actorRole: admin.role as "ADMIN" | "SUPER_ADMIN",
        action: "PDF_JOB_RETRIED",
        targetType: "PdfGenerationJob",
        targetId: jobId,
        metadata: { newStatus: updatedJob.status },
        ipAddress: requestIp
      }
    });

    return NextResponse.json({ status: "success", data: updatedJob });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message || "Retry failed" }, { status: 500 });
  }
}
