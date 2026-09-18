import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";
import axios from "axios";

const BACKEND_URL = process.env.ASTRO_BACKEND_URL || "http://127.0.0.1:8000";
const INTERNAL_API_KEY = process.env.ASTRO_INTERNAL_API_KEY || "ak_live_dev_test_master_key_astro2026";

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

    // Call FastAPI background PDF generator endpoint
    const backendRes = await axios.post(`${BACKEND_URL}/api/v1/pdf/generate`, {
      report_type: reportType || "brihat_kundli",
      birth_data: birthData,
      branding: branding || user.brandingConfig || {
        company_name: user.name || "Astro SaaS Client",
        website: "https://astroengine.io",
        contact_number: "+91 98765 43210",
        primary_color: "#0f172a"
      },
      lang: lang || "hi"
    }, {
      headers: {
        "x-api-key": INTERNAL_API_KEY,
        "Content-Type": "application/json"
      },
      timeout: 10000
    });

    const jobResult = backendRes.data?.data || backendRes.data;

    const savedJob = await prisma.pdfGenerationJob.create({
      data: {
        id: jobResult.job_id || `pdf_job_${Date.now()}`,
        userId: user.id,
        reportType: reportType || "brihat_kundli",
        language: lang || "hi",
        status: "COMPLETED",
        fileUrl: jobResult.file_url || `https://cdn.astroengine.io/reports/${jobResult.job_id}.pdf`,
        creditsCost: 15.0
      }
    });

    return NextResponse.json({
      status: "success",
      job: jobResult
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({
      status: "error",
      message: err.message || "Failed to trigger PDF generation worker"
    }, { status: 500 });
  }
}
