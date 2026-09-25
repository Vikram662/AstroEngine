import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/authGuard";
import { validateLogoFile, uploadFileToR2, LogoUploadError } from "@/lib/r2Upload";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ status: "error", message: "Forbidden: Admin required." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("logo") as File | null;
    validateLogoFile(file);

    const ext = file.name.split(".").pop() || "png";
    const objectKey = `branding/company_logo_${Date.now()}.${ext}`;
    const publicUrl = await uploadFileToR2(file, objectKey);

    // Auto-save to MySQL SystemSetting table
    await prisma.systemSetting.upsert({
      where: { key: "COMPANY_LOGO_URL" },
      update: { value: publicUrl },
      create: {
        key: "COMPANY_LOGO_URL",
        value: publicUrl,
        category: "COMPANY",
        description: "Company Brand Logo URL (PNG/SVG/WebP)"
      }
    });

    return NextResponse.json({
      status: "success",
      message: "Logo uploaded directly to Cloudflare R2 and saved!",
      logoUrl: publicUrl
    });

  } catch (error: unknown) {
    if (error instanceof LogoUploadError) {
      return NextResponse.json({ status: "error", message: error.message }, { status: error.status });
    }
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
