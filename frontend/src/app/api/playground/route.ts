import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getClientIp } from "@/lib/clientIp";
import { SharedRateLimiter } from "@/lib/rateLimit";

const BACKEND_URL = process.env.ASTRO_BACKEND_URL || "http://127.0.0.1:8000";
const INTERNAL_API_KEY = process.env.ASTRO_INTERNAL_API_KEY;

// Unauthenticated endpoint: keep it tight (per IP).
const playgroundLimiter = new SharedRateLimiter("playgroundLimiter", Number(process.env.PLAYGROUND_RPM) || 20, 60_000);

// Allowed playground endpoints for public testing without authentication
const ALLOWED_PLAYGROUND_TARGETS = [
  "/api/v1/parashari/chart/d1",
  "/api/v1/parashari/chart/d9",
  "/api/v1/parashari/chart/svg",
  "/api/v1/panchang/daily",
  "/api/v1/panchang/choghadiya",
  "/api/v1/core/planets/positions",
  "/api/v1/dasha/vimshottari/current",
  "/api/v1/dosha-matching/matchmaking/ashtakoot",
  "/api/v1/western/tropical-planets"
];

export async function POST(request: NextRequest) {
  try {
    if (await playgroundLimiter.hit(getClientIp(request))) {
      return NextResponse.json(
        { status: "error", message: "Playground rate limit exceeded. Please wait a minute." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { endpoint, payload, queryParams } = body;

    if (!INTERNAL_API_KEY) {
      return NextResponse.json(
        {
          status: "error",
          message: "ASTRO_INTERNAL_API_KEY is not configured in environment variables."
        },
        { status: 500 }
      );
    }

    if (!endpoint || !ALLOWED_PLAYGROUND_TARGETS.includes(endpoint)) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid or unauthorized playground endpoint."
        },
        { status: 400 }
      );
    }

    // Forward to FastAPI with internal server-side API key header
    const targetUrl = new URL(endpoint, BACKEND_URL);
    if (queryParams && typeof queryParams === "object") {
      Object.entries(queryParams).forEach(([k, v]) => {
        if (v) targetUrl.searchParams.append(k, String(v));
      });
    }

    const response = await axios.post(targetUrl.toString(), payload, {
      maxRedirects: 0,
      headers: {
        "x-api-key": INTERNAL_API_KEY,
        "Content-Type": "application/json"
      },
      timeout: 10000
    });

    return NextResponse.json(response.data);
  } catch (err: unknown) {
    const error = err as { response?: { data?: unknown; status?: number }; message?: string };
    if (error.response && (error.response.status ?? 500) < 500) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }
    console.error("[playground] upstream failure:", error.message);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to communicate with AstroEngine calculation backend"
      },
      { status: 502 }
    );
  }
}
