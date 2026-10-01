import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";
import { REPORT_ENDPOINTS, buildPdfPayload, dispatchPdfJob } from "@/lib/pdfEngine";
import { toJsonSafe } from "@/lib/money";
import { publicMessage } from "@/lib/apiErrors";
import { meterCall } from "@/lib/metering";
import { applyRefund, type Receipt } from "@/lib/billingRefund";
import { reconcileJob } from "@/lib/pdfReconcile";
import { SharedRateLimiter } from "@/lib/rateLimit";
import { notify } from "@/lib/notifications";

// Report generation is CPU heavy: a user may start 10 reports per minute.
const reportLimiter = new SharedRateLimiter("pdf-queue-user", 10, 60_000);

function validBirthData(b: unknown): b is { dob: string; tob: string; lat: number; lon: number; name?: unknown } {
  const d = b as Record<string, unknown> | null;
  if (!d || typeof d !== "object") return false;
  const lat = Number(d.lat);
  const lon = Number(d.lon);
  return (
    typeof d.dob === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.dob) &&
    typeof d.tob === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(d.tob) &&
    Number.isFinite(lat) && lat >= -90 && lat <= 90 &&
    Number.isFinite(lon) && lon >= -180 && lon <= 180
  );
}

export async function GET() {
  try {
    const session = await getVerifiedSession();
    if (!session || !session.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const jobs = await prisma.pdfGenerationJob.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    // Pull the latest state of reports that were still running (and refund failed ones).
    const open = jobs.filter((j: { status: string }) => j.status === "PENDING" || j.status === "PROCESSING").slice(0, 5);
    if (open.length > 0) {
      const updates = await Promise.all(open.map((j: Parameters<typeof reconcileJob>[0]) => reconcileJob(j)));
      open.forEach((j: { status: string; fileUrl: string | null; refunded: boolean }, i: number) => {
        const u = updates[i];
        if (u) {
          if (u.status) j.status = u.status;
          if (u.fileUrl !== undefined) j.fileUrl = u.fileUrl;
          if (u.refunded !== undefined) j.refunded = u.refunded;
        }
      });
    }

    return NextResponse.json({ status: "success", jobs: toJsonSafe(jobs) });
  } catch (err) {
    console.error("[pdf/queue GET]", err);
    return NextResponse.json({ status: "error", message: "Could not load your reports." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let receipt: Receipt | null = null;
  try {
    const session = await getVerifiedSession();
    if (!session || !session.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    if (await reportLimiter.hit(session.userId)) {
      return NextResponse.json({ status: "error", message: "Too many reports requested. Please wait a minute." }, { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.email },
      include: { subscription: true }
    });
    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    const { reportType, birthData, branding, lang, subjectName } = body || {};

    if (reportType !== undefined && !REPORT_ENDPOINTS[reportType]) {
      return NextResponse.json({ status: "error", message: "Unknown report type." }, { status: 400 });
    }
    if (!validBirthData(birthData)) {
      return NextResponse.json({ status: "error", message: "Valid date of birth, time of birth, latitude and longitude are required." }, { status: 400 });
    }

    const { report, resolvedLang, payload } = buildPdfPayload(
      reportType || "kundli_brihat",
      birthData,
      branding,
      lang,
      user
    );

    // Bill the CUSTOMER (the backend call itself is made with the internal key, so
    // without this the report would be charged to the admin account and be free).
    const metered = await meterCall(user, report.path, "pdf");
    const meterBody = await metered.json();
    if (metered.status !== 200 || !meterBody.valid) {
      return NextResponse.json({ status: "error", ...meterBody }, { status: metered.status === 200 ? 403 : metered.status });
    }
    receipt = meterBody.receiptId
      ? { receiptId: String(meterBody.receiptId), deductionType: meterBody.deductionType, addonId: meterBody.addonId ?? null }
      : null;

    let dispatched;
    try {
      dispatched = await dispatchPdfJob(report, payload);
    } catch (dispatchErr) {
      console.error("[pdf/queue] backend dispatch failed:", dispatchErr);
      if (receipt) await applyRefund(receipt, 502);
      return NextResponse.json({ status: "error", message: "The report engine is unavailable. You were not charged." }, { status: 502 });
    }

    const { jobId, jobResult, finalStatus, fileUrl } = dispatched;

    let refunded = false;
    if (finalStatus === "FAILED" && receipt) {
      refunded = (await applyRefund(receipt, 500)).ok;
    }

    const savedJob = await prisma.pdfGenerationJob.create({
      data: {
        id: jobId,
        userId: user.id,
        reportType: report.backendType,
        language: resolvedLang,
        status: finalStatus as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED",
        fileUrl,
        creditsCost: report.creditsCost,
        refunded,
        failureReason: finalStatus === "FAILED" ? "Report generation failed." : null,
        subjectName: typeof (subjectName || birthData?.name) === "string" ? String(subjectName || birthData?.name).slice(0, 120) : null,
        // The billing receipt rides along so a later FAILED state can still be refunded.
        requestPayload: JSON.parse(JSON.stringify({ birthData, branding, lang: resolvedLang, billing: receipt }))
      }
    });

    if (finalStatus === "COMPLETED") {
      await notify(user.id, "PDF_READY", { reportType: report.backendType, jobId, downloadUrl: fileUrl }, { dedupeKey: `PDF_READY:${jobId}` });
    } else if (finalStatus === "FAILED") {
      await notify(user.id, "PDF_FAILED", { reportType: report.backendType, jobId, refunded }, { dedupeKey: `PDF_FAILED:${jobId}` });
    }

    return NextResponse.json({
      status: "success",
      job: { ...jobResult, status: finalStatus, file_url: fileUrl, db_id: savedJob.id }
    });
  } catch (error: unknown) {
    // Anything unexpected after we charged: give the credit back.
    if (receipt) await applyRefund(receipt, 500).catch(() => undefined);
    return NextResponse.json({
      status: "error",
      message: publicMessage(error, "Failed to trigger PDF generation worker")
    }, { status: 500 });
  }
}
