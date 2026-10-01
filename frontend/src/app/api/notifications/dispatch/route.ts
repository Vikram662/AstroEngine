import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/authGuard";
import { hasValidInternalSecret } from "@/lib/internalAuth";
import { EVENT_SWITCH, type NotificationEvent } from "@/lib/notificationPrefs";
import { notify } from "@/lib/notifications";

// POST /api/notifications/dispatch  { userId, eventType, data?, force? }
//
// For the Python engine and admins: puts an event into the notification queue for a user.
// The user's own on/off switches still decide whether anything is sent (unless force=true),
// and delivery (e-mail + account webhook, with retries) is done by the queue worker.
// Customers cannot call this: their "send test" button uses /api/user/notifications/test.
export async function POST(req: NextRequest) {
  try {
    const isInternalAuth = Boolean(process.env.ASTRO_INTERNAL_SECRET) && hasValidInternalSecret(req);
    if (!isInternalAuth) {
      const admin = await requireAdminSession();
      if (!admin) {
        return NextResponse.json(
          { status: "error", message: "Forbidden: Internal engine secret or admin session required." },
          { status: 403 }
        );
      }
    }

    const body = await req.json().catch(() => null);
    const { userId, eventType, data } = body || {};

    if (typeof userId !== "string" || typeof eventType !== "string" || !(eventType in EVENT_SWITCH)) {
      return NextResponse.json(
        { status: "error", message: "userId and a known eventType are required." },
        { status: 400 }
      );
    }

    const queued = await notify(
      userId,
      eventType as NotificationEvent,
      data && typeof data === "object" ? (data as Record<string, unknown>) : {},
      { force: body?.force === true }
    );

    return NextResponse.json({ status: "success", queued, skipped: queued === 0 });
  } catch (error: unknown) {
    console.error("[notifications/dispatch]", error);
    return NextResponse.json({ status: "error", message: "Dispatch failed." }, { status: 500 });
  }
}
