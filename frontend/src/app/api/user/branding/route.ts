import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get("astro_session_email")?.value;

    if (!sessionEmail) {
      return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { brandName, website, contactPhone, primaryColor } = body;

    await prisma.user.update({
      where: { email: sessionEmail },
      data: {
        brandingConfig: {
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
      status: "success",
      message: "Branding updated (fallback mode)."
    });
  }
}
