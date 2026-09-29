import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { toJsonSafe } from "@/lib/money";
import { ApiData, toApiError } from "@/lib/apiTypes";

const badRequest = (message: string) => NextResponse.json({ status: "error", message }, { status: 400 });

export async function GET() {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ status: "error", message: "Forbidden: Admin authorization required." }, { status: 403 });
    }
    const offers = await (prisma as ApiData).offer.findMany({
      include: {
        assignedUser: { select: { id: true, email: true, name: true } },
        _count: { select: { redemptions: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ status: "success", data: toJsonSafe(offers) });
  } catch (error) {
    return NextResponse.json({ status: "error", message: error instanceof Error ? error.message : "Offers could not be loaded." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ status: "error", message: "Forbidden: Admin authorization required." }, { status: 403 });
    }
    const body = await req.json();
    const id = body.id ? String(body.id) : undefined;
    const code = String(body.code || "").trim().toUpperCase();
    const scope = String(body.scope || "GLOBAL").toUpperCase();
    const targetType = String(body.targetType || "PLAN").toUpperCase();
    const discountType = String(body.discountType || "PERCENT").toUpperCase();
    const discountValue = Number(body.discountValue);
    const minimumAmount = Number(body.minimumAmount || 0);
    const maxDiscount = body.maxDiscount === "" || body.maxDiscount === null || body.maxDiscount === undefined
      ? null
      : Number(body.maxDiscount);
    const startsAt = new Date(body.startsAt);
    const endsAt = new Date(body.endsAt);

    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return badRequest("Offer code must be 3-32 letters, numbers, _ or -.");
    if (!body.title?.trim()) return badRequest("Offer title is required.");
    if (!(["GLOBAL", "PERSONALIZED"] as string[]).includes(scope)) return badRequest("Invalid offer scope.");
    if (!(["PLAN", "ADDON"] as string[]).includes(targetType)) return badRequest("Invalid target type.");
    if (!(["PERCENT", "FIXED"] as string[]).includes(discountType)) return badRequest("Invalid discount type.");
    if (!Number.isFinite(discountValue) || discountValue <= 0 || (discountType === "PERCENT" && discountValue > 100)) {
      return badRequest("Enter a valid discount value (percentage cannot exceed 100).");
    }
    if (!Number.isFinite(minimumAmount) || minimumAmount < 0 || (maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount <= 0))) {
      return badRequest("Minimum amount or maximum discount is invalid.");
    }
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      return badRequest("Offer end date must be later than its start date.");
    }

    let assignedUserId: string | null = null;
    if (scope === "PERSONALIZED") {
      const email = String(body.assignedUserEmail || "").trim().toLowerCase();
      if (!email) return badRequest("User email is required for a personalized offer.");
      const assignedUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (!assignedUser) return badRequest("No user exists with that email address.");
      assignedUserId = assignedUser.id;
    }

    const data = {
      code,
      title: String(body.title).trim(),
      description: body.description ? String(body.description).trim() : null,
      scope,
      assignedUserId,
      targetType,
      targetId: body.targetId ? String(body.targetId).trim() : null,
      discountType,
      discountValue,
      maxDiscount,
      minimumAmount,
      startsAt,
      endsAt,
      isActive: body.isActive !== false,
    };

    const offer = id
      ? await (prisma as ApiData).offer.update({ where: { id }, data })
      : await (prisma as ApiData).offer.create({ data });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.userId,
        actorRole: admin.role as ApiData,
        action: id ? "OFFER_UPDATED" : "OFFER_CREATED",
        targetType: "Offer",
        targetId: offer.id,
        metadata: { code, scope, targetType, targetId: data.targetId },
      },
    });
    return NextResponse.json({ status: "success", data: toJsonSafe(offer), message: `Offer ${code} saved successfully.` });
  } catch (errorCaught) { const error = toApiError(errorCaught);
    const duplicate = error?.code === "P2002";
    return NextResponse.json(
      { status: "error", message: duplicate ? "That offer code already exists." : (error?.message || "Offer could not be saved.") },
      { status: duplicate ? 409 : 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ status: "error", message: "Forbidden: Admin authorization required." }, { status: 403 });
    }
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return badRequest("Offer id is required.");
    const current = await (prisma as ApiData).offer.findUnique({ where: { id }, select: { isActive: true, code: true } });
    if (!current) return badRequest("Offer not found.");
    const offer = await (prisma as ApiData).offer.update({ where: { id }, data: { isActive: !current.isActive } });
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.userId,
        actorRole: admin.role as ApiData,
        action: offer.isActive ? "OFFER_ACTIVATED" : "OFFER_DEACTIVATED",
        targetType: "Offer",
        targetId: id,
        metadata: { code: current.code },
      },
    });
    return NextResponse.json({ status: "success", data: toJsonSafe(offer) });
  } catch (error) {
    return NextResponse.json({ status: "error", message: error instanceof Error ? error.message : "Offer could not be updated." }, { status: 500 });
  }
}
