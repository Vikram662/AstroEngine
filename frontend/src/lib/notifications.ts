import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";
import { safePostJson } from "@/lib/ssrf";
import { isEmailOnlyEvent, isEventEnabled, type NotificationEvent } from "@/lib/notificationPrefs";
import { renderNotification } from "@/lib/notificationTemplates";

// Notification queue (transactional outbox).
//
//   event happens -> enqueueNotification(): checks the user's switch for that event
//   (Dashboard > Settings > Notifications) and, only if it is ON (or the event is a security
//   event), writes one row per channel (EMAIL, and WEBHOOK when the user configured an
//   account webhook). When called with the transaction client of the business operation, the
//   row commits or rolls back together with it.
//
//   worker -> processNotificationQueue(): sends due rows, retrying with back-off.

type Db = Prisma.TransactionClient;

const MAX_ATTEMPTS = 5;
const BACKOFF_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 3600_000, 6 * 3600_000];
const STUCK_AFTER_MS = 10 * 60_000;

export interface NotifyOptions {
  /** One notification per key and channel (e.g. one low-balance alert per day). */
  dedupeKey?: string;
  /** Ignore the user's switch (the settings-page test button). */
  force?: boolean;
}

/** Queues the notification if the user wants it. Returns the number of rows queued. */
export async function enqueueNotification(
  db: Db,
  userId: string,
  event: NotificationEvent,
  data: Record<string, unknown> = {},
  opts: NotifyOptions = {}
): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, notificationPrefs: true, accountWebhookUrl: true },
  });
  if (!user || !user.email) return 0;
  if (!opts.force && !isEventEnabled(event, user.notificationPrefs)) return 0;

  const payload = { ...data, ...(opts.force ? { _force: true } : {}) } as Prisma.InputJsonValue;
  const rows: Array<{ userId: string; event: string; channel: string; payload: Prisma.InputJsonValue; dedupeKey: string | null }> = [
    { userId, event, channel: "EMAIL", payload, dedupeKey: opts.dedupeKey ?? null },
  ];
  if (user.accountWebhookUrl && !isEmailOnlyEvent(event) && event !== "TEST") {
    rows.push({ userId, event, channel: "WEBHOOK", payload, dedupeKey: opts.dedupeKey ?? null });
  }

  // skipDuplicates (INSERT IGNORE): a repeated dedupeKey is silently ignored.
  const res = await db.notification.createMany({ data: rows, skipDuplicates: true });
  return res.count;
}

/**
 * For code that is NOT inside a transaction: queue and start delivering. Never throws, so a
 * notification problem can never break the payment / call / report that triggered it.
 */
export async function notify(userId: string, event: NotificationEvent, data: Record<string, unknown> = {}, opts: NotifyOptions = {}) {
  try {
    const n = await enqueueNotification(prisma as unknown as Db, userId, event, data, opts);
    if (n > 0) kickWorker();
    return n;
  } catch (e) {
    console.error(`[notifications] could not queue ${event}:`, e);
    return 0;
  }
}

/** Same as enqueueNotification but swallows errors: safe to call inside a business transaction. */
export async function safeEnqueue(db: Db, userId: string, event: NotificationEvent, data: Record<string, unknown> = {}, opts: NotifyOptions = {}) {
  try {
    return await enqueueNotification(db, userId, event, data, opts);
  } catch (e) {
    console.error(`[notifications] could not queue ${event}:`, e);
    return 0;
  }
}

let kickScheduled = false;
/** Start delivering right away without waiting for the scheduler (best effort, non-blocking). */
export function kickWorker() {
  if (kickScheduled) return;
  kickScheduled = true;
  setTimeout(() => {
    kickScheduled = false;
    processNotificationQueue(10).catch((e) => console.error("[notifications] worker error:", e));
  }, 250);
}

type DueRow = {
  id: string; userId: string; event: string; channel: string; payload: unknown; attempts: number;
  user: { name: string | null; email: string; notificationPrefs: unknown; accountWebhookUrl: string | null; accountWebhookSecret: string | null };
};

async function deliver(n: DueRow): Promise<"SENT" | "SKIPPED"> {
  const event = n.event as NotificationEvent;
  const data = (n.payload && typeof n.payload === "object" ? n.payload : {}) as Record<string, unknown>;
  const forced = data._force === true;

  // The user may have switched the event off while it was waiting in the queue.
  if (!forced && !isEventEnabled(event, n.user.notificationPrefs)) return "SKIPPED";

  if (n.channel === "EMAIL") {
    const { subject, html } = renderNotification(event, n.user, data);
    const res = await sendNotificationEmail({ to: n.user.email, subject, html });
    if (!res || (res as { success?: boolean }).success === false) throw new Error("E-mail could not be sent");
    return "SENT";
  }

  if (n.channel === "WEBHOOK") {
    if (!n.user.accountWebhookUrl) return "SKIPPED";
    const { _force, ...clean } = data;
    void _force;
    const body = JSON.stringify({ event, userId: n.userId, timestamp: new Date().toISOString(), data: clean });
    const signature = n.user.accountWebhookSecret
      ? crypto.createHmac("sha256", n.user.accountWebhookSecret).update(body).digest("hex")
      : "";
    const res = await safePostJson(n.user.accountWebhookUrl, body, { "x-astroengine-signature": signature });
    if (!res.ok) throw new Error(`Webhook responded with HTTP ${res.status}`);
    return "SENT";
  }

  return "SKIPPED";
}

/** Sends due notifications. Safe to run concurrently (rows are claimed atomically). */
export async function processNotificationQueue(limit = 20) {
  const now = new Date();

  // A worker that died mid-send leaves SENDING rows behind: put them back in line.
  await prisma.notification.updateMany({
    where: { status: "SENDING", nextAttemptAt: { lt: new Date(now.getTime() - STUCK_AFTER_MS) } },
    data: { status: "PENDING" },
  });

  const due = (await prisma.notification.findMany({
    where: { status: "PENDING", nextAttemptAt: { lte: now } },
    orderBy: { nextAttemptAt: "asc" },
    take: limit,
    include: { user: { select: { name: true, email: true, notificationPrefs: true, accountWebhookUrl: true, accountWebhookSecret: true } } },
  })) as unknown as DueRow[];

  const result = { sent: 0, skipped: 0, retried: 0, failed: 0 };

  for (const n of due) {
    const claim = await prisma.notification.updateMany({
      where: { id: n.id, status: "PENDING" },
      data: { status: "SENDING", attempts: { increment: 1 }, nextAttemptAt: new Date() },
    });
    if (claim.count !== 1) continue; // another worker took it

    const attempt = n.attempts + 1;
    try {
      const outcome = await deliver(n);
      await prisma.notification.update({
        where: { id: n.id },
        data: { status: outcome, sentAt: outcome === "SENT" ? new Date() : null, lastError: outcome === "SKIPPED" ? "skipped: switched off by the user" : null },
      });
      if (outcome === "SENT") result.sent++;
      else result.skipped++;
    } catch (err) {
      const message = (err instanceof Error ? err.message : String(err)).slice(0, 300);
      if (attempt >= MAX_ATTEMPTS) {
        await prisma.notification.update({ where: { id: n.id }, data: { status: "FAILED", lastError: message } });
        result.failed++;
      } else {
        const wait = BACKOFF_MS[Math.min(attempt - 1, BACKOFF_MS.length - 1)];
        await prisma.notification.update({
          where: { id: n.id },
          data: { status: "PENDING", lastError: message, nextAttemptAt: new Date(Date.now() + wait) },
        });
        result.retried++;
      }
    }
  }
  return result;
}

/**
 * Error-spike alert: more than 5% of a customer's calls failed in the last 10 minutes
 * (at least 20 calls). Failed calls are the ones whose status was set to >= 400 when they
 * were refunded. One alert per customer per hour.
 */
export async function detectErrorSpikes() {
  const since = new Date(Date.now() - 10 * 60_000);
  const busy = await prisma.apiRequestLog.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    having: { userId: { _count: { gte: 20 } } },
  });
  if (busy.length === 0) return 0;

  const failed = await prisma.apiRequestLog.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: since }, statusCode: { gte: 400 }, userId: { in: busy.map((b: { userId: string }) => b.userId) } },
    _count: { _all: true },
  });
  const failedBy = new Map(failed.map((f: { userId: string; _count: { _all: number } }) => [f.userId, f._count._all]));

  let alerts = 0;
  const hour = new Date().toISOString().substring(0, 13);
  for (const b of busy as Array<{ userId: string; _count: { _all: number } }>) {
    const errors = failedBy.get(b.userId) || 0;
    const rate = (errors / b._count._all) * 100;
    if (rate > 5) {
      alerts += await notify(b.userId, "ERROR_SPIKE", { errors, calls: b._count._all, rate: rate.toFixed(1) }, { dedupeKey: `ERROR_SPIKE:${b.userId}:${hour}` });
    }
  }
  return alerts;
}
