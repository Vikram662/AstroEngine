import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/authGuard";

// CRUD for AstrologicalPrediction — the multi-lingual interpretation rules
// injected into PDF reports. The model already existed in the schema, but no
// write route was ever built for it, so the admin "Add"/"Edit" buttons had
// nothing to call.
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ status: "error", message: "Forbidden: Admin authorization required." }, { status: 403 });
    }

    const body = await req.json();
    const { ruleKey, lang, category, title, description, remedy } = body;

    if (!ruleKey || !lang || !category || !title || !description) {
      return NextResponse.json({ status: "error", message: "ruleKey, lang, category, title, and description are required." }, { status: 400 });
    }

    const created = await prisma.astrologicalPrediction.create({
      data: { ruleKey, lang, category, title, description, remedy: remedy || null }
    });

    const requestIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.userId,
        actorRole: admin.role as "ADMIN" | "SUPER_ADMIN",
        action: "PREDICTION_RULE_CREATED",
        targetType: "AstrologicalPrediction",
        targetId: String(created.id),
        metadata: { ruleKey, lang },
        ipAddress: requestIp
      }
    });

    return NextResponse.json({ status: "success", data: created });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    if (err.code === "P2002") {
      return NextResponse.json({ status: "error", message: "A rule with this ruleKey + lang combination already exists." }, { status: 409 });
    }
    return NextResponse.json({ status: "error", message: err.message || "Failed to create rule." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ status: "error", message: "Forbidden: Admin authorization required." }, { status: 403 });
    }

    const body = await req.json();
    const { id, ruleKey, lang, category, title, description, remedy } = body;
    if (!id) {
      return NextResponse.json({ status: "error", message: "id required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (ruleKey !== undefined) updateData.ruleKey = ruleKey;
    if (lang !== undefined) updateData.lang = lang;
    if (category !== undefined) updateData.category = category;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (remedy !== undefined) updateData.remedy = remedy;

    const updated = await prisma.astrologicalPrediction.update({
      where: { id: Number(id) },
      data: updateData
    });

    const requestIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.userId,
        actorRole: admin.role as "ADMIN" | "SUPER_ADMIN",
        action: "PREDICTION_RULE_UPDATED",
        targetType: "AstrologicalPrediction",
        targetId: String(id),
        metadata: JSON.parse(JSON.stringify({ updateData })),
        ipAddress: requestIp
      }
    });

    return NextResponse.json({ status: "success", data: updated });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message || "Failed to update rule." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ status: "error", message: "Forbidden: Admin authorization required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ status: "error", message: "id required" }, { status: 400 });
    }

    await prisma.astrologicalPrediction.delete({ where: { id: Number(id) } });

    const requestIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.userId,
        actorRole: admin.role as "ADMIN" | "SUPER_ADMIN",
        action: "PREDICTION_RULE_DELETED",
        targetType: "AstrologicalPrediction",
        targetId: id,
        ipAddress: requestIp
      }
    });

    return NextResponse.json({ status: "success" });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ status: "error", message: err.message || "Failed to delete rule." }, { status: 500 });
  }
}
