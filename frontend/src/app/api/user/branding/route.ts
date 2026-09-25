import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";

export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedSession();
    if (!session || !session.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
    }

    const sessionEmail = session.email;

    const body = await req.json();
    const { brandName, website, contactPhone, primaryColor } = body;

    const user = await prisma.user.findUnique({ where: { email: sessionEmail } });
    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found." }, { status: 404 });
    }

    const existingConfig = (user.brandingConfig as Record<string, unknown>) || {};
    await prisma.user.update({
      where: { email: sessionEmail },
      data: {
        brandingConfig: {
          ...existingConfig,
          brandName,
          website,
          contactPhone,
          primaryColor
        }
      }
    });

    return NextResponse.json({
      status: "success",
      message: "Branding configuration saved successfully to MySQL."
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({
      status: "error",
      message: error.message || "Failed to save branding configuration."
    }, { status: 500 });
  }
}
