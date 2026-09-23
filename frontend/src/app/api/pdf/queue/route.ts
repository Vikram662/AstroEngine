import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";
import axios from "axios";

const BACKEND_URL = process.env.ASTRO_BACKEND_URL || "http://127.0.0.1:8000";
const INTERNAL_API_KEY = process.env.ASTRO_INTERNAL_API_KEY || "ak_live_dev_test_master_key_astro2026";

// The FastAPI backend has no single POST /api/v1/pdf/generate route — each report
// type is its own endpoint (see backend/app/pdf_engine/router.py). Both the
// "reportType" spellings used elsewhere in the frontend (e.g. "brihat_kundli" in
// pdf-reports/page.tsx vs "kundli_brihat" in demo/components/PdfTab.tsx) are
// accepted here and normalized to the backend's own report_type slug.
const REPORT_ENDPOINTS: Record<string, { path: string; backendType: string; creditsCost: number }> = {
  kundli_basic: { path: "/api/v1/pdf/kundli/basic", backendType: "kundli_basic", creditsCost: 5.0 },
  basic_kundli: { path: "/api/v1/pdf/kundli/basic", backendType: "kundli_basic", creditsCost: 5.0 },
  kundli_brihat: { path: "/api/v1/pdf/kundli/brihat", backendType: "kundli_brihat", creditsCost: 12.0 },
  brihat_kundli: { path: "/api/v1/pdf/kundli/brihat", backendType: "kundli_brihat", creditsCost: 12.0 },
  matchmaking: { path: "/api/v1/pdf/matching/report", backendType: "matching_report", creditsCost: 6.0 },
  matching_report: { path: "/api/v1/pdf/matching/report", backendType: "matching_report", creditsCost: 6.0 },
  lalkitab: { path: "/api/v1/pdf/lalkitab/full", backendType: "lalkitab_full", creditsCost: 9.0 },
  lalkitab_full: { path: "/api/v1/pdf/lalkitab/full", backendType: "lalkitab_full", creditsCost: 9.0 },
  varshphal: { path: "/api/v1/pdf/varshphal/annual", backendType: "varshphal_annual", creditsCost: 8.0 },
  varshphal_annual: { path: "/api/v1/pdf/varshphal/annual", backendType: "varshphal_annual", creditsCost: 8.0 },
  numerology: { path: "/api/v1/pdf/numerology/report", backendType: "numerology_report", creditsCost: 5.0 },
  numerology_report: { path: "/api/v1/pdf/numerology/report", backendType: "numerology_report", creditsCost: 5.0 },
  sadesati: { path: "/api/v1/pdf/dosha/sade-sati", backendType: "sadesati_guide", creditsCost: 4.0 },
  sadesati_guide: { path: "/api/v1/pdf/dosha/sade-sati", backendType: "sadesati_guide", creditsCost: 4.0 },
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET() {
  try {
    const session = await getVerifiedSession();
    if (!session || !session.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.email }
    });

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const jobs = await prisma.pdfGenerationJob.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return NextResponse.json({ status: "success", jobs });
  } catch (err) {
    return NextResponse.json({ status: "success", jobs: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedSession();
    if (!session || !session.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.email }
    });

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { reportType, birthData, branding, lang } = body;

    const report = REPORT_ENDPOINTS[reportType as string] || REPORT_ENDPOINTS.kundli_brihat;

    // brandingConfig on User is stored camelCase (logoUrl/brandName/...); the
    // backend's BrandingConfig schema expects snake_case fields, so it has to be
    // remapped rather than passed straight through.
    const storedBranding = user.brandingConfig as {
      logoUrl?: string;
      brandName?: string;
      website?: string;
      primaryColor?: string;
      contactPhone?: string;
    } | null;

    const resolvedLang = lang || "hi";
    const payload: Record<string, unknown> = {
      dob: birthData?.dob,
      tob: birthData?.tob,
      lat: birthData?.lat,
      lon: birthData?.lon,
      tz: birthData?.tz ?? 5.5,
      lang: resolvedLang,
      branding: branding || {
        company_name: storedBranding?.brandName || user.name || "Astro SaaS Client",
        logo_url: storedBranding?.logoUrl,
        website: storedBranding?.website || "https://astroengine.io",
        contact_number: storedBranding?.contactPhone || "+91 98765 43210",
        primary_color: storedBranding?.primaryColor || "#0f172a"
      }
    };

    if (report.backendType === "matching_report") {
      payload.girl_dob = birthData?.girl_dob;
      payload.girl_tob = birthData?.girl_tob;
      payload.girl_lat = birthData?.girl_lat;
      payload.girl_lon = birthData?.girl_lon;
      payload.girl_tz = birthData?.girl_tz ?? 5.5;
    }
    if (report.backendType === "varshphal_annual") {
      payload.target_year = birthData?.target_year;
    }

    // Call the report's own FastAPI endpoint (there is no single generic
    // POST /api/v1/pdf/generate route on the backend).
    const backendRes = await axios.post(`${BACKEND_URL}${report.path}`, payload, {
      headers: {
        "x-api-key": INTERNAL_API_KEY,
        "Content-Type": "application/json"
      },
      timeout: 10000
    });

    const jobResult = backendRes.data?.data || backendRes.data;
    const jobId: string = jobResult.job_id;

    // The backend renders the PDF via a BackgroundTasks worker, so the create
    // call above returns PENDING immediately. These reports typically finish in
    // a few seconds (in-process Swiss Ephemeris calc + ReportLab render, no
    // external calls) — give it a short bounded window to land as COMPLETED so
    // most jobs don't get persisted as stuck at PENDING. If it's still running
    // after that, we persist the real in-progress status rather than fabricating
    // a COMPLETED result and a fake download URL.
    let finalStatus: string = jobResult.status || "PENDING";
    let fileUrl: string | null = null;
    for (let attempt = 0; attempt < 5 && finalStatus !== "COMPLETED" && finalStatus !== "FAILED"; attempt++) {
      await sleep(1500);
      try {
        const statusRes = await axios.get(`${BACKEND_URL}/api/v1/pdf/status/${jobId}`, {
          headers: { "x-api-key": INTERNAL_API_KEY },
          timeout: 5000
        });
        const statusData = statusRes.data?.data || statusRes.data;
        finalStatus = statusData.status;
        fileUrl = statusData.file_url || null;
      } catch {
        break;
      }
    }

    const savedJob = await prisma.pdfGenerationJob.create({
      data: {
        id: jobId,
        userId: user.id,
        reportType: report.backendType,
        language: resolvedLang,
        status: finalStatus as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED",
        fileUrl,
        creditsCost: report.creditsCost
      }
    });

    return NextResponse.json({
      status: "success",
      job: { ...jobResult, status: finalStatus, file_url: fileUrl, db_id: savedJob.id }
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({
      status: "error",
      message: err.message || "Failed to trigger PDF generation worker"
    }, { status: 500 });
  }
}
