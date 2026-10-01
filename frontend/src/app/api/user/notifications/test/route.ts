import { NextResponse } from "next/server";
import { getVerifiedSession } from "@/lib/authGuard";
import { notify, processNotificationQueue } from "@/lib/notifications";
import { SharedRateLimiter } from "@/lib/rateLimit";

const limiter = new SharedRateLimiter("notif-test", 3, 60_000);

// POST /api/user/notifications/test - sends a test notification to the signed-in user,
// through the real queue, regardless of their on/off switches.
export async function POST() {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
  if (await limiter.hit(session.userId)) {
    return NextResponse.json({ status: "error", message: "Please wait a minute before sending another test." }, { status: 429 });
  }

  const queued = await notify(session.userId, "TEST", {}, { force: true });
  const result = await processNotificationQueue(5);
  return NextResponse.json({ status: "success", queued, delivered: result.sent, failed: result.failed + result.retried });
}
