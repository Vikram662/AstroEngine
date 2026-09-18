import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";

// POST /api/support/[id]/reply - Reply to a ticket or update status
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const ticket = await prisma.supportTicket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return NextResponse.json({ status: "error", message: "Ticket not found" }, { status: 404 });
    }

    const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN";
    if (!isAdmin && ticket.userId !== user.id) {
      return NextResponse.json({ status: "error", message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { message, newStatus } = body;

    if (newStatus) {
      await prisma.supportTicket.update({
        where: { id },
        data: { status: newStatus }
      });
    }

    let createdMsg = null;
    if (message && message.trim()) {
      createdMsg = await prisma.ticketMessage.create({
        data: {
          ticketId: id,
          senderRole: isAdmin ? "ADMIN" : "USER",
          senderName: user.name || (isAdmin ? "Support Engineer" : user.email.split("@")[0]),
          message: message.trim()
        }
      });

      // If user replied and status was RESOLVED, re-open ticket
      if (!isAdmin && ticket.status === "RESOLVED") {
        await prisma.supportTicket.update({
          where: { id },
          data: { status: "OPEN" }
        });
      } else if (isAdmin && ticket.status === "OPEN") {
        await prisma.supportTicket.update({
          where: { id },
          data: { status: "IN_PROGRESS" }
        });
      }
    }

    const updatedTicket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true, planTier: true }
        },
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    return NextResponse.json({
      status: "success",
      message: "Reply posted",
      data: updatedTicket
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
