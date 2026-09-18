import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get("astro_session_email")?.value;

    if (!sessionEmail) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: sessionEmail },
      include: {
        teamMembers: {
          orderBy: { invitedAt: "desc" }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: "success",
      members: user.teamMembers
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get("astro_session_email")?.value;

    if (!sessionEmail) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: sessionEmail }
    });

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json({ status: "error", message: "Email is required" }, { status: 400 });
    }

    const rawKey = `ak_live_sub_${crypto.randomBytes(16).toString("hex")}`;
    const apiKeyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const apiKeyPrefix = rawKey.substring(0, 15);

    const member = await prisma.teamMember.create({
      data: {
        ownerId: user.id,
        email,
        role: role === "OPERATOR" ? "OPERATOR" : "VIEWER",
        apiKeyHash,
        apiKeyPrefix,
        invitedAt: new Date()
      }
    });

    return NextResponse.json({
      status: "success",
      member
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get("astro_session_email")?.value;

    if (!sessionEmail) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: sessionEmail }
    });

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ status: "error", message: "Member ID required" }, { status: 400 });
    }

    await prisma.teamMember.delete({
      where: { id }
    });

    return NextResponse.json({ status: "success", message: "Member removed" });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
