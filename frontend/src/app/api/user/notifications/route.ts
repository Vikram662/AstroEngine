import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";

// GET /api/user/notifications - the signed-in user's recent notifications and their delivery status
export async function GET() {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });

  const rows = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, event: true, channel: true, status: true, attempts: true, createdAt: true, sentAt: true },
  });

  return NextResponse.json({
    status: "success",
    notifications: rows.map((r: (typeof rows)[number]) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      sentAt: r.sentAt ? r.sentAt.toISOString() : null,
    })),
  });
}
