import axios from "axios";
import { prisma } from "@/lib/prisma";
import { applyRefund, isValidReceipt, type Receipt } from "@/lib/billingRefund";

const BACKEND_URL = (process.env.ASTRO_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

interface JobRow {
  id: string;
  status: string;
  refunded: boolean;
  createdAt: Date;
  requestPayload: unknown;
}

/** Billing receipt stored with the job when it was created (see /api/pdf/queue POST). */
export function receiptOf(requestPayload: unknown): Receipt | null {
  const billing = (requestPayload as { billing?: Receipt } | null)?.billing;
  return billing && isValidReceipt(billing) ? billing : null;
}

/**
 * Brings a job that was still running when it was created up to date with the backend
 * and, if it FAILED, gives the customer's credit back (once). Without this a report that
 * finished or failed after the first few seconds would stay "PENDING" forever and a
 * failed one would never be refunded.
 */
export async function reconcileJob(job: JobRow): Promise<{ status?: string; fileUrl?: string | null; refunded?: boolean } | null> {
  const key = process.env.ASTRO_INTERNAL_API_KEY;
  if (!key || !["PENDING", "PROCESSING"].includes(job.status)) return null;
  // Jobs older than a day are never going to finish.
  if (Date.now() - new Date(job.createdAt).getTime() > 24 * 3600 * 1000) return null;

  try {
    const res = await axios.get(`${BACKEND_URL}/api/v1/pdf/status/${encodeURIComponent(job.id)}`, {
      headers: { "x-api-key": key },
      timeout: 4000,
    });
    const data = res.data?.data || res.data;
    const status: string = data?.status;
    if (!["PENDING", "PROCESSING", "COMPLETED", "FAILED"].includes(status) || status === job.status) return null;

    let refunded = job.refunded;
    if (status === "FAILED" && !job.refunded) {
      const receipt = receiptOf(job.requestPayload);
      if (receipt) {
        const r = await applyRefund(receipt, 500);
        refunded = r.ok;
      }
    }

    await prisma.pdfGenerationJob.update({
      where: { id: job.id },
      data: {
        status: status as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED",
        fileUrl: data?.file_url || null,
        failureReason: status === "FAILED" ? "Report generation failed." : null,
        refunded,
      },
    });
    return { status, fileUrl: data?.file_url || null, refunded };
  } catch {
    return null; // backend unreachable: keep the stored state, try again on the next listing
  }
}

/** True if the signed-in user may see this job (their own, or any job for admins). */
export async function canAccessJob(jobId: string, session: { userId: string; role: string }): Promise<boolean> {
  if (session.role === "ADMIN" || session.role === "SUPER_ADMIN") return true;
  const job = await prisma.pdfGenerationJob.findFirst({ where: { id: jobId, userId: session.userId }, select: { id: true } });
  return Boolean(job);
}
