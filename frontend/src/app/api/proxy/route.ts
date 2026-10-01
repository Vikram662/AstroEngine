import { NextRequest, NextResponse } from "next/server";
import axios, { type AxiosRequestConfig } from "axios";
import { getVerifiedSession } from "@/lib/authGuard";
import { resolveProxyTarget } from "@/lib/backendProxy";
import { getClientIp } from "@/lib/clientIp";
import { SharedRateLimiter } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";
import { meterCall } from "@/lib/metering";
import { applyRefund, type Receipt } from "@/lib/billingRefund";
import { REPORT_ENDPOINTS } from "@/lib/pdfEngine";
import { canAccessJob } from "@/lib/pdfReconcile";

const BACKEND_URL = (process.env.ASTRO_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const INTERNAL_API_KEY = process.env.ASTRO_INTERNAL_API_KEY;

// Anonymous calculator traffic is limited per IP; signed-in users get a larger
// per-user budget. Expensive (PDF / AI) calls have their own, much lower cap.
const anonLimiter = new SharedRateLimiter("anonLimiter", Number(process.env.PROXY_ANON_RPM) || 120, 60_000);
const userLimiter = new SharedRateLimiter("userLimiter", Number(process.env.PROXY_USER_RPM) || 600, 60_000);
const heavyLimiter = new SharedRateLimiter("heavyLimiter", Number(process.env.PROXY_HEAVY_RPM) || 10, 60_000);

const ALLOWED_METHODS = ["GET", "POST"];

function rateLimited() {
  return NextResponse.json(
    { status: "error", code: "RATE_LIMIT_EXCEEDED", message: "Rate limit exceeded. Please wait a moment before trying again." },
    { status: 429 }
  );
}

function upstreamError(err: unknown) {
  if (axios.isAxiosError(err) && err.response) {
    // Pass backend validation/quota errors through, but never raw internals.
    const status = err.response.status;
    const data = status < 500 ? err.response.data : { status: "error", message: "Calculation service error." };
    return NextResponse.json(data, { status });
  }
  console.error("[proxy] upstream failure:", err instanceof Error ? err.message : err);
  return NextResponse.json({ status: "error", message: "Calculation service is unavailable." }, { status: 502 });
}

// Report-generation endpoints (the ones that cost CPU and must be billed to the caller).
const GENERATION_PATHS = new Set(Object.values(REPORT_ENDPOINTS).map((r) => r.path));
const JOB_ID_PATH = /^\/api\/v1\/pdf\/(?:status|download)\/([A-Za-z0-9_-]+)$/;

export async function POST(request: NextRequest) {
  // Receipt of the metered call: refunded if the upstream call does not succeed.
  let receipt: Receipt | null = null;
  try {
    if (!INTERNAL_API_KEY) {
      return NextResponse.json({ status: "error", message: "Server is not configured." }, { status: 500 });
    }

    const body = await request.json().catch(() => null);
    const { endpoint, payload, queryParams } = body || {};
    const method = String(body?.method ?? "POST").toUpperCase();

    if (!ALLOWED_METHODS.includes(method)) {
      return NextResponse.json({ status: "error", message: "Method not allowed." }, { status: 405 });
    }

    const target = resolveProxyTarget(endpoint, BACKEND_URL);
    if (!target.ok) {
      return NextResponse.json({ status: "error", message: target.reason }, { status: 400 });
    }

    const ip = getClientIp(request);
    let session = null;
    if (target.requiresAuth) {
      session = await getVerifiedSession();
      if (!session) {
        return NextResponse.json({ status: "error", message: "Please sign in to use this feature." }, { status: 401 });
      }
      if (target.adminOnly && session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
        return NextResponse.json({ status: "error", message: "Forbidden." }, { status: 403 });
      }
      if (method === "POST" && await heavyLimiter.hit(`u:${session.userId}`)) return rateLimited();
    } else {
      session = await getVerifiedSession();
    }
    if (session ? await userLimiter.hit(`u:${session.userId}`) : await anonLimiter.hit(`ip:${ip}`)) return rateLimited();

    const targetUrl = target.url;

    // The internal key belongs to an admin account, so without this step a report would
    // be billed to the admin and be free for the customer.
    const isGeneration = method === "POST" && GENERATION_PATHS.has(targetUrl.pathname);
    if (isGeneration && session) {
      const user = await prisma.user.findUnique({ where: { id: session.userId }, include: { subscription: true } });
      if (!user) return NextResponse.json({ status: "error", message: "User not found." }, { status: 401 });
      const metered = await meterCall(user, targetUrl.pathname, "pdf");
      const meterBody = await metered.json();
      if (metered.status !== 200 || !meterBody.valid) {
        return NextResponse.json({ status: "error", ...meterBody }, { status: metered.status === 200 ? 403 : metered.status });
      }
      receipt = meterBody.receiptId
        ? { receiptId: String(meterBody.receiptId), deductionType: meterBody.deductionType, addonId: meterBody.addonId ?? null }
        : null;
    }

    if (queryParams && typeof queryParams === "object") {
      Object.entries(queryParams as Record<string, unknown>).forEach(([k, v]) => {
        if (v !== undefined && v !== null) targetUrl.searchParams.append(k, String(v));
      });
    }

    // The internal key stays server-side; the browser never receives it.
    const axiosConfig: AxiosRequestConfig = {
      method,
      url: targetUrl.toString(),
      headers: { "x-api-key": INTERNAL_API_KEY, "Content-Type": "application/json" },
      timeout: 15000,
      maxRedirects: 0,
    };
    if (method === "POST" && payload) axiosConfig.data = payload;

    if (targetUrl.pathname.endsWith("/svg") || targetUrl.pathname.endsWith("/wheel-svg")) {
      axiosConfig.responseType = "text";
      const response = await axios(axiosConfig);
      return new NextResponse(response.data, {
        status: response.status,
        headers: {
          "Content-Type": "image/svg+xml",
          // SVG is only ever displayed; never let it execute script if opened directly.
          "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const response = await axios(axiosConfig);

    // Track the job under the customer so only they can poll / download it, and so a
    // later failure can still be refunded (see lib/pdfReconcile.ts).
    if (isGeneration && session) {
      const job = response.data?.data || response.data;
      const report = Object.values(REPORT_ENDPOINTS).find((r) => r.path === targetUrl.pathname);
      if (job?.job_id && report) {
        await prisma.pdfGenerationJob
          .create({
            data: {
              id: String(job.job_id),
              userId: session.userId,
              reportType: report.backendType,
              language: String(payload?.lang || "en").slice(0, 8),
              status: "PENDING",
              creditsCost: report.creditsCost,
              requestPayload: JSON.parse(JSON.stringify({ birthData: payload, billing: receipt })),
            },
          })
          .catch((e: unknown) => console.error("[proxy] could not record PDF job:", e));
      }
    }
    return NextResponse.json(response.data, { status: response.status });
  } catch (err: unknown) {
    if (receipt) await applyRefund(receipt, axios.isAxiosError(err) ? err.response?.status ?? 502 : 502).catch(() => undefined);
    return upstreamError(err);
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!INTERNAL_API_KEY) {
      return NextResponse.json({ status: "error", message: "Server is not configured." }, { status: 500 });
    }

    // GET is only used for PDF download / status polling: always requires a session.
    const session = await getVerifiedSession();
    if (!session) {
      return NextResponse.json({ status: "error", message: "Please sign in to use this feature." }, { status: 401 });
    }
    if (await userLimiter.hit(`u:${session.userId}`)) return rateLimited();

    const { searchParams } = new URL(request.url);
    const dlMode = searchParams.get("dl");
    const jobId = searchParams.get("job_id");
    const endpoint = searchParams.get("endpoint");

    if (dlMode === "pdf" && jobId) {
      const safeJobId = jobId.replace(/[^a-zA-Z0-9_-]/g, "");
      if (!(await canAccessJob(safeJobId, session))) {
        return NextResponse.json({ status: "error", message: "Report not found." }, { status: 404 });
      }
      const response = await axios({
        method: "GET",
        url: `${BACKEND_URL}/api/v1/pdf/download/${safeJobId}`,
        headers: { "x-api-key": INTERNAL_API_KEY },
        responseType: "arraybuffer",
        timeout: 30000,
        maxRedirects: 0,
      });
      return new NextResponse(response.data, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeJobId}.pdf"`,
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const target = resolveProxyTarget(endpoint, BACKEND_URL);
    if (target.ok) {
      if (target.adminOnly && session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
        return NextResponse.json({ status: "error", message: "Forbidden." }, { status: 403 });
      }
      const jobMatch = JOB_ID_PATH.exec(target.url.pathname);
      if (jobMatch && !(await canAccessJob(jobMatch[1], session))) {
        return NextResponse.json({ status: "error", message: "Report not found." }, { status: 404 });
      }
      const response = await axios({
        method: "GET",
        url: target.url.toString(),
        headers: { "x-api-key": INTERNAL_API_KEY, "Content-Type": "application/json" },
        timeout: 10000,
        maxRedirects: 0,
      });
      return NextResponse.json(response.data, { status: response.status });
    }

    return NextResponse.json({ status: "error", message: "Missing or invalid params." }, { status: 400 });
  } catch (err: unknown) {
    return upstreamError(err);
  }
}
