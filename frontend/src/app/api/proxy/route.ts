import { NextRequest, NextResponse } from "next/server";
import axios, { type AxiosRequestConfig } from "axios";
import { getVerifiedSession } from "@/lib/authGuard";
import { resolveProxyTarget } from "@/lib/backendProxy";
import { getClientIp } from "@/lib/clientIp";
import { RateLimiter } from "@/lib/rateLimit";

const BACKEND_URL = (process.env.ASTRO_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const INTERNAL_API_KEY = process.env.ASTRO_INTERNAL_API_KEY;

// Anonymous calculator traffic is limited per IP; signed-in users get a larger
// per-user budget. Expensive (PDF / AI) calls have their own, much lower cap.
const anonLimiter = new RateLimiter(Number(process.env.PROXY_ANON_RPM) || 120, 60_000);
const userLimiter = new RateLimiter(Number(process.env.PROXY_USER_RPM) || 600, 60_000);
const heavyLimiter = new RateLimiter(Number(process.env.PROXY_HEAVY_RPM) || 10, 60_000);

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

export async function POST(request: NextRequest) {
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
      if (method === "POST" && heavyLimiter.hit(`u:${session.userId}`)) return rateLimited();
    } else {
      session = await getVerifiedSession();
    }
    if (session ? userLimiter.hit(`u:${session.userId}`) : anonLimiter.hit(`ip:${ip}`)) return rateLimited();

    const targetUrl = target.url;
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
    return NextResponse.json(response.data, { status: response.status });
  } catch (err: unknown) {
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
    if (userLimiter.hit(`u:${session.userId}`)) return rateLimited();

    const { searchParams } = new URL(request.url);
    const dlMode = searchParams.get("dl");
    const jobId = searchParams.get("job_id");
    const endpoint = searchParams.get("endpoint");

    if (dlMode === "pdf" && jobId) {
      const safeJobId = jobId.replace(/[^a-zA-Z0-9_-]/g, "");
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
