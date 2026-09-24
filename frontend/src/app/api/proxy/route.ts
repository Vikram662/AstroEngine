import { NextRequest, NextResponse } from "next/server";
import axios, { type AxiosRequestConfig } from "axios";

const BACKEND_URL = (process.env.ASTRO_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const INTERNAL_API_KEY = process.env.ASTRO_INTERNAL_API_KEY;

// Rate limiting map: IP -> timestamp array
const ipHits = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3000; // 3000 req/min for calculator traffic

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipHits.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  recent.push(now);
  ipHits.set(ip, recent);
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        {
          status: "error",
          code: "RATE_LIMIT_EXCEEDED",
          message: "Calculator rate limit exceeded. Please wait a moment before trying again."
        },
        { status: 429 }
      );
    }

    if (!INTERNAL_API_KEY) {
      return NextResponse.json(
        {
          status: "error",
          message: "ASTRO_INTERNAL_API_KEY is not configured on the server."
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { endpoint, payload, queryParams, method = "POST" } = body;

    if (!endpoint || typeof endpoint !== "string" || !endpoint.startsWith("/api/v1/")) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid target endpoint. Target must start with /api/v1/"
        },
        { status: 400 }
      );
    }

    // Build destination URL
    const targetUrl = new URL(endpoint, BACKEND_URL);
    if (queryParams && typeof queryParams === "object") {
      Object.entries(queryParams).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          targetUrl.searchParams.append(k, String(v));
        }
      });
    }

    // Forward request to FastAPI backend securely using INTERNAL_API_KEY
    // The browser never receives this key
    const axiosConfig: AxiosRequestConfig = {
      method: method.toUpperCase(),
      url: targetUrl.toString(),
      headers: {
        "x-api-key": INTERNAL_API_KEY,
        "Content-Type": "application/json"
      },
      timeout: 15000
    };

    if (method.toUpperCase() === "POST" && payload) {
      axiosConfig.data = payload;
    }

    // Special case for SVG charts
    if (endpoint.endsWith("/svg") || endpoint.endsWith("/wheel-svg")) {
      axiosConfig.responseType = "text";
      const response = await axios(axiosConfig);
      return new NextResponse(response.data, {
        status: response.status,
        headers: {
          "Content-Type": "image/svg+xml"
        }
      });
    }

    const response = await axios(axiosConfig);

    return NextResponse.json(response.data, { status: response.status });
  } catch (err: unknown) {
    const status = axios.isAxiosError(err) ? (err.response?.status || 500) : 500;
    const data = (axios.isAxiosError(err) && err.response?.data) || {
      status: "error",
      message: err instanceof Error ? err.message : "Failed to execute astrology engine calculation."
    };

    return NextResponse.json(data, { status });
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!INTERNAL_API_KEY) {
      return NextResponse.json({ status: "error", message: "Server not configured." }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const dlMode = searchParams.get("dl");
    const jobId = searchParams.get("job_id");
    const endpoint = searchParams.get("endpoint");

    // \u2500\u2500 PDF Binary Download Mode \u2500\u2500
    if (dlMode === "pdf" && jobId) {
      const safeJobId = jobId.replace(/[^a-zA-Z0-9_-]/g, "");
      const targetUrl = `${BACKEND_URL}/api/v1/pdf/download/${safeJobId}`;
      const response = await axios({
        method: "GET",
        url: targetUrl,
        headers: { "x-api-key": INTERNAL_API_KEY },
        responseType: "arraybuffer",
        timeout: 30000
      });
      return new NextResponse(response.data, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeJobId}.pdf"`
        }
      });
    }

    // \u2500\u2500 Generic GET proxy (PDF status polling) \u2500\u2500
    if (endpoint && typeof endpoint === "string" && endpoint.startsWith("/api/v1/")) {
      const targetUrl = new URL(endpoint, BACKEND_URL);
      const response = await axios({
        method: "GET",
        url: targetUrl.toString(),
        headers: { "x-api-key": INTERNAL_API_KEY, "Content-Type": "application/json" },
        timeout: 10000
      });
      return NextResponse.json(response.data, { status: response.status });
    }

    return NextResponse.json({ status: "error", message: "Missing required params." }, { status: 400 });
  } catch (err: unknown) {
    const status = axios.isAxiosError(err) ? (err.response?.status || 500) : 500;
    return NextResponse.json({
      status: "error",
      message: err instanceof Error ? err.message : "Proxy GET failed."
    }, { status });
  }
}
