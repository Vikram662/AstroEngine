import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/authGuard";
import { toMoney } from "@/lib/money";
import { publicMessage } from "@/lib/apiErrors";

// GET /api/billing/invoices - the signed-in customer's issued GST invoices (newest first)
export async function GET() {
  try {
    const session = await getVerifiedSession();
    if (!session) return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });

    const rows = await prisma.invoice.findMany({
      where: { userId: session.userId },
      orderBy: { issuedAt: "desc" },
      take: 100,
      select: { id: true, number: true, type: true, issuedAt: true, periodStart: true, description: true, quantity: true, gross: true },
    });

    return NextResponse.json({
      status: "success",
      invoices: rows.map((r: (typeof rows)[number]) => ({
        id: r.id,
        number: r.number,
        type: r.type,
        issuedAt: r.issuedAt.toISOString(),
        periodStart: r.periodStart ? r.periodStart.toISOString() : null,
        description: r.description,
        quantity: r.quantity,
        gross: toMoney(r.gross),
      })),
    });
  } catch (error: unknown) {
    return NextResponse.json({ status: "error", message: publicMessage(error) }, { status: 500 });
  }
}
