import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/support - List user tickets (or all tickets if ADMIN)
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get("astro_session_email")?.value;
    const sessionRole = cookieStore.get("astro_session_role")?.value;

    if (!sessionEmail) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: sessionEmail }
    });

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const isAdmin = sessionRole === "ADMIN" || sessionRole === "SUPER_ADMIN";
    const url = new URL(req.url);
    const filterAll = url.searchParams.get("all") === "true";

    const tickets = await prisma.supportTicket.findMany({
      where: (isAdmin && filterAll) ? {} : { userId: user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            planTier: true
          }
        },
        messages: {
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json({
      status: "success",
      data: tickets
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}

// POST /api/support - Create a new support ticket
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
    const { subject, category, priority, message } = body;

    if (!subject || !message) {
      return NextResponse.json({ status: "error", message: "Subject and message are required" }, { status: 400 });
    }

    // Generate ticket number
    const count = await prisma.supportTicket.count();
    const ticketNumber = `TCK-${1001 + count}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: user.id,
        subject,
        category: category || "API_INTEGRATION",
        priority: priority || "MEDIUM",
        status: "OPEN",
        messages: {
          create: {
            senderRole: "USER",
            senderName: user.name || user.email.split("@")[0],
            message
          }
        }
      },
      include: {
        messages: true
      }
    });

    return NextResponse.json({
      status: "success",
      message: "Ticket created successfully",
      data: ticket
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  }
}
