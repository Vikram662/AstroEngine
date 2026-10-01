import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";
import { validateLogoFile, uploadFileToR2, logoExtension, LogoUploadError } from "@/lib/r2Upload";
import { publicMessage } from "@/lib/apiErrors";

export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedSession();
    if (!session || !session.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.email } });
    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found." }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("logo") as File | null;
    validateLogoFile(file);

    const ext = logoExtension(file);
    const objectKey = `branding/user_${user.id}_logo_${Date.now()}.${ext}`;
    const publicUrl = await uploadFileToR2(file, objectKey);

    const existingConfig = (user.brandingConfig as Record<string, unknown>) || {};
    await prisma.user.update({
      where: { id: user.id },
      data: { brandingConfig: { ...existingConfig, logoUrl: publicUrl } }
    });

    return NextResponse.json({ status: "success", logoUrl: publicUrl });
  } catch (error: unknown) {
    if (error instanceof LogoUploadError) {
      return NextResponse.json({ status: "error", message: publicMessage(error) }, { status: error.status });
    }
    console.error("[upload-logo]", error);
    return NextResponse.json({ status: "error", message: "Upload failed." }, { status: 500 });
  }
}
