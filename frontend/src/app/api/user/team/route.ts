import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";

export async function GET() {
  try {
    const session = await getVerifiedSession();
    if (!session || !session.email) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.email },
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
    const { email, role } = body;

    if (!email) {
      return NextResponse.json({ status: "error", message: "Email is required" }, { status: 400 });
    }

    const newMember = await prisma.teamMember.create({
      data: {
        ownerId: user.id,
        email,
        role: role === "OPERATOR" ? "OPERATOR" : "VIEWER",
        invitedAt: new Date()
      }
    });

    return NextResponse.json({
      status: "success",
      message: `Invitation sent to ${email}`,
      member: newMember
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ status: "error", message: "Member ID required" }, { status: 400 });
    }

    // Ensure member belongs to this authenticated user
    const existing = await prisma.teamMember.findFirst({
      where: { id, ownerId: user.id }
    });

    if (!existing) {
      return NextResponse.json({ status: "error", message: "Team member not found or unauthorized." }, { status: 404 });
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
