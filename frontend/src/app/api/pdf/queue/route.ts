import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";
import { buildPdfPayload, dispatchPdfJob } from "@/lib/pdfEngine";

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
    const { reportType, birthData, branding, lang, subjectName } = body;

    const { report, resolvedLang, payload } = buildPdfPayload(
      reportType || "kundli_brihat",
      birthData,
      branding,
      lang,
      user
    );

    const { jobId, jobResult, finalStatus, fileUrl } = await dispatchPdfJob(report, payload);

    const savedJob = await prisma.pdfGenerationJob.create({
      data: {
        id: jobId,
        userId: user.id,
        reportType: report.backendType,
        language: resolvedLang,
        status: finalStatus as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED",
        fileUrl,
        creditsCost: report.creditsCost,
        subjectName: subjectName || birthData?.name || null,
        requestPayload: JSON.parse(JSON.stringify({ birthData, branding, lang: resolvedLang }))
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
