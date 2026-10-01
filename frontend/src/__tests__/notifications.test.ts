import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// ── In-memory notification table ───────────────────────────────────────────────────────
type Row = {
  id: string; userId: string; event: string; channel: string; status: string; payload: Record<string, unknown>;
  attempts: number; nextAttemptAt: Date; lastError: string | null; dedupeKey: string | null; sentAt: Date | null; createdAt: Date;
};
const store = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>>, users: {} as Record<string, Record<string, unknown>>, seq: 0 }));

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  notification: { createMany: vi.fn(), findMany: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
  apiRequestLog: { groupBy: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));

const mail = vi.hoisted(() => ({ sendNotificationEmail: vi.fn(async () => ({ success: true })) }));
vi.mock("@/lib/email", () => mail);
const ssrf = vi.hoisted(() => ({ safePostJson: vi.fn(async () => ({ ok: true, status: 200 })) }));
vi.mock("@/lib/ssrf", () => ssrf);
const auth = vi.hoisted(() => ({ getVerifiedSession: vi.fn(), requireAdminSession: vi.fn() }));
vi.mock("@/lib/authGuard", () => auth);
const recon = vi.hoisted(() => ({ reconcileOpenPdfJobs: vi.fn(async () => 2) }));
vi.mock("@/lib/pdfReconcile", () => recon);

import { enqueueNotification, notify, processNotificationQueue, detectErrorSpikes } from "@/lib/notifications";
import { DEFAULT_PREFS, isEventEnabled, resolvePrefs, EVENT_SWITCH } from "@/lib/notificationPrefs";
import { renderNotification } from "@/lib/notificationTemplates";
import { POST as dispatchPost } from "@/app/api/notifications/dispatch/route";
import { POST as processPost } from "@/app/api/internal/notifications/process/route";
import { POST as testPost } from "@/app/api/user/notifications/test/route";

const rows = () => store.rows as unknown as Row[];
const USER = { name: "Asha <b>", email: "asha@example.com", notificationPrefs: null, accountWebhookUrl: null, accountWebhookSecret: null };

function wire() {
  store.rows.length = 0;
  store.seq = 0;
  store.users = { u1: { ...USER } };

  db.user.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => store.users[where.id] ?? null);

  db.notification.createMany.mockImplementation(async ({ data }: { data: Array<Record<string, unknown>> }) => {
    let count = 0;
    for (const d of data) {
      const dup = d.dedupeKey && rows().some((r) => r.dedupeKey === d.dedupeKey && r.channel === d.channel);
      if (dup) continue;
      store.rows.push({ id: `n${++store.seq}`, status: "PENDING", attempts: 0, nextAttemptAt: new Date(), lastError: null, sentAt: null, createdAt: new Date(), ...d });
      count++;
    }
    return { count };
  });
  db.notification.findMany.mockImplementation(async ({ where, take }: { where: { status: string; nextAttemptAt: { lte: Date } }; take: number }) =>
    rows()
      .filter((r) => r.status === where.status && r.nextAttemptAt <= where.nextAttemptAt.lte)
      .slice(0, take)
      .map((r) => ({ ...r, user: store.users[r.userId] })));
  db.notification.updateMany.mockImplementation(async ({ where, data }: { where: { id?: string; status?: string; nextAttemptAt?: unknown }; data: Record<string, unknown> }) => {
    const hit = rows().filter((r) => (where.id ? r.id === where.id : true) && (where.status ? r.status === where.status : true) && (where.id ? true : false));
    for (const r of hit) {
      for (const [k, v] of Object.entries(data)) {
        if (v && typeof v === "object" && "increment" in (v as object)) (r as Record<string, unknown>)[k] = (r[k as keyof Row] as number) + (v as { increment: number }).increment;
        else (r as Record<string, unknown>)[k] = v;
      }
    }
    return { count: hit.length };
  });
  db.notification.update.mockImplementation(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
    const r = rows().find((x) => x.id === where.id)!;
    Object.assign(r, data);
    return r;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mail.sendNotificationEmail.mockResolvedValue({ success: true });
  ssrf.safePostJson.mockResolvedValue({ ok: true, status: 200 });
  wire();
});

// ── Preferences (the user-panel switches) ───────────────────────────────────────────────────
describe("notification preferences", () => {
  it("falls back to defaults for switches the user never touched, and ignores junk", () => {
    expect(resolvePrefs(null)).toEqual(DEFAULT_PREFS);
    expect(resolvePrefs({ emailPayments: false, hacker: true, emailInvoices: "yes" })).toEqual({ ...DEFAULT_PREFS, emailPayments: false });
  });

  it("every business event has a switch, and security events cannot be switched off", () => {
    for (const [event, sw] of Object.entries(EVENT_SWITCH)) {
      if (["PASSWORD_CHANGED", "TWO_FA_CHANGED", "TEST"].includes(event)) {
        expect(sw).toBeNull();
        expect(isEventEnabled(event as never, { emailPayments: false, emailInvoices: false })).toBe(true);
      } else {
        expect(sw && sw in DEFAULT_PREFS).toBe(true);
      }
    }
  });

  it("the quota switch covers both 80% and 100%", () => {
    expect(isEventEnabled("QUOTA_80", { emailQuotaWarning: false })).toBe(false);
    expect(isEventEnabled("QUOTA_100", { emailQuotaWarning: false })).toBe(false);
  });
});

// ── Queueing ──────────────────────────────────────────────────────────────────────────────────
describe("enqueueNotification", () => {
  it("queues an e-mail when the switch is on", async () => {
    expect(await enqueueNotification(db as never, "u1", "PAYMENT_RECEIVED", { amount: 100 })).toBe(1);
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toMatchObject({ event: "PAYMENT_RECEIVED", channel: "EMAIL", status: "PENDING", userId: "u1" });
  });

  it("queues NOTHING when the user switched that event off", async () => {
    store.users.u1.notificationPrefs = { emailPayments: false, emailInvoices: false, emailRefunds: false, emailLowBalance: false };
    for (const ev of ["PAYMENT_RECEIVED", "INVOICE_ISSUED", "REFUND_ISSUED", "LOW_BALANCE"] as const) {
      expect(await enqueueNotification(db as never, "u1", ev, {})).toBe(0);
    }
    expect(rows()).toHaveLength(0);
  });

  it("respects the existing opt-in default of 'PDF ready'", async () => {
    expect(await enqueueNotification(db as never, "u1", "PDF_READY", {})).toBe(0);
    store.users.u1.notificationPrefs = { emailPdfReady: true };
    expect(await enqueueNotification(db as never, "u1", "PDF_READY", {})).toBe(1);
  });

  it("security events are queued even when everything else is off, and never go to the webhook", async () => {
    store.users.u1.notificationPrefs = Object.fromEntries(Object.keys(DEFAULT_PREFS).map((k) => [k, false]));
    store.users.u1.accountWebhookUrl = "https://hook.example.com/x";
    expect(await enqueueNotification(db as never, "u1", "PASSWORD_CHANGED", { via: "reset" })).toBe(1);
    expect(rows().map((r) => r.channel)).toEqual(["EMAIL"]);
  });

  it("also queues a WEBHOOK delivery when the user configured an account webhook", async () => {
    store.users.u1.accountWebhookUrl = "https://hook.example.com/x";
    expect(await enqueueNotification(db as never, "u1", "INVOICE_ISSUED", { number: "AE/25-26/000001" })).toBe(2);
    expect(rows().map((r) => r.channel).sort()).toEqual(["EMAIL", "WEBHOOK"]);
  });

  it("dedupes: one alert per key (e.g. one low-balance alert per day)", async () => {
    const key = { dedupeKey: "LOW_BALANCE:u1:2026-03-05" };
    expect(await enqueueNotification(db as never, "u1", "LOW_BALANCE", { balance: 10 }, key)).toBe(1);
    expect(await enqueueNotification(db as never, "u1", "LOW_BALANCE", { balance: 9 }, key)).toBe(0);
    expect(rows()).toHaveLength(1);
  });

  it("force (the Send Test button) ignores the switches", async () => {
    store.users.u1.notificationPrefs = { emailPayments: false };
    expect(await enqueueNotification(db as never, "u1", "PAYMENT_RECEIVED", {}, { force: true })).toBe(1);
  });

  it("notify() never throws, even if the queue table is missing", async () => {
    db.notification.createMany.mockRejectedValue(new Error("table does not exist"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(notify("u1", "PAYMENT_RECEIVED", {})).resolves.toBe(0);
    spy.mockRestore();
  });
});

// ── Worker ───────────────────────────────────────────────────────────────────────────────────
describe("processNotificationQueue", () => {
  it("sends the e-mail and marks the row SENT", async () => {
    await enqueueNotification(db as never, "u1", "PAYMENT_RECEIVED", { amount: 499, description: "PRO plan" });
    const r = await processNotificationQueue();
    expect(r.sent).toBe(1);
    expect(mail.sendNotificationEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "asha@example.com", subject: expect.stringContaining("499") }));
    expect(rows()[0]).toMatchObject({ status: "SENT", attempts: 1 });
    expect(rows()[0].sentAt).toBeInstanceOf(Date);
  });

  it("retries with back-off and finally gives up after 5 attempts", async () => {
    mail.sendNotificationEmail.mockResolvedValue({ success: false });
    await enqueueNotification(db as never, "u1", "PAYMENT_RECEIVED", {});
    const row = rows()[0];

    const r1 = await processNotificationQueue();
    expect(r1.retried).toBe(1);
    expect(row.status).toBe("PENDING");
    expect(row.attempts).toBe(1);
    expect(row.nextAttemptAt.getTime()).toBeGreaterThan(Date.now() + 50_000);   // ~1 minute back-off
    expect(row.lastError).toContain("could not be sent");

    // not due yet: nothing happens
    expect((await processNotificationQueue()).retried).toBe(0);

    for (let i = 2; i <= 5; i++) {
      row.nextAttemptAt = new Date(Date.now() - 1000);
      await processNotificationQueue();
    }
    expect(row.attempts).toBe(5);
    expect(row.status).toBe("FAILED");
  });

  it("recovers after a transient failure", async () => {
    mail.sendNotificationEmail.mockResolvedValueOnce({ success: false }).mockResolvedValue({ success: true });
    await enqueueNotification(db as never, "u1", "PAYMENT_RECEIVED", {});
    await processNotificationQueue();
    rows()[0].nextAttemptAt = new Date(Date.now() - 1000);
    await processNotificationQueue();
    expect(rows()[0].status).toBe("SENT");
    expect(rows()[0].attempts).toBe(2);
  });

  it("does not send if the user switched the event off while it was waiting", async () => {
    await enqueueNotification(db as never, "u1", "PAYMENT_RECEIVED", {});
    store.users.u1.notificationPrefs = { emailPayments: false };
    const r = await processNotificationQueue();
    expect(r.skipped).toBe(1);
    expect(mail.sendNotificationEmail).not.toHaveBeenCalled();
    expect(rows()[0].status).toBe("SKIPPED");
  });

  it("still sends a forced test and security alerts after the switches are off", async () => {
    store.users.u1.notificationPrefs = Object.fromEntries(Object.keys(DEFAULT_PREFS).map((k) => [k, false]));
    await enqueueNotification(db as never, "u1", "TEST", {}, { force: true });
    await enqueueNotification(db as never, "u1", "TWO_FA_CHANGED", { enabled: false });
    expect((await processNotificationQueue()).sent).toBe(2);
  });

  it("delivers webhooks signed with the user's secret, without internal fields", async () => {
    store.users.u1.accountWebhookUrl = "https://hook.example.com/x";
    store.users.u1.accountWebhookSecret = "whsec_abc";
    await enqueueNotification(db as never, "u1", "REFUND_ISSUED", { amount: 12 }, { force: true });
    rows().filter((r) => r.channel === "EMAIL").forEach((r) => (r.status = "SENT"));
    await processNotificationQueue();
    const [url, body, headers] = ssrf.safePostJson.mock.calls[0] as unknown as [string, string, Record<string, string>];
    expect(url).toBe("https://hook.example.com/x");
    const parsed = JSON.parse(body);
    expect(parsed).toMatchObject({ event: "REFUND_ISSUED", userId: "u1", data: { amount: 12 } });
    expect(JSON.stringify(parsed)).not.toContain("_force");
    expect(headers["x-astroengine-signature"]).toMatch(/^[0-9a-f]{64}$/);
  });

  it("a worker that loses the race for a row does not send it twice", async () => {
    await enqueueNotification(db as never, "u1", "PAYMENT_RECEIVED", {});
    db.notification.updateMany.mockResolvedValueOnce({ count: 0 }); // reclaim sweep
    db.notification.updateMany.mockResolvedValueOnce({ count: 0 }); // claim lost
    const r = await processNotificationQueue();
    expect(r.sent).toBe(0);
    expect(mail.sendNotificationEmail).not.toHaveBeenCalled();
  });
});

describe("detectErrorSpikes", () => {
  it("alerts customers whose failure rate is above 5% (at least 20 calls), once per hour", async () => {
    db.apiRequestLog.groupBy
      .mockResolvedValueOnce([{ userId: "u1", _count: { _all: 100 } }])
      .mockResolvedValueOnce([{ userId: "u1", _count: { _all: 10 } }]);
    expect(await detectErrorSpikes()).toBe(1);
    expect(rows()[0]).toMatchObject({ event: "ERROR_SPIKE", payload: { errors: 10, calls: 100, rate: "10.0" } });

    db.apiRequestLog.groupBy
      .mockResolvedValueOnce([{ userId: "u1", _count: { _all: 100 } }])
      .mockResolvedValueOnce([{ userId: "u1", _count: { _all: 10 } }]);
    expect(await detectErrorSpikes()).toBe(0); // same hour: deduped
  });

  it("stays quiet at 5% or below", async () => {
    db.apiRequestLog.groupBy
      .mockResolvedValueOnce([{ userId: "u1", _count: { _all: 100 } }])
      .mockResolvedValueOnce([{ userId: "u1", _count: { _all: 5 } }]);
    expect(await detectErrorSpikes()).toBe(0);
  });
});

// ── Templates ──────────────────────────────────────────────────────────────────────────────────
describe("renderNotification", () => {
  it("escapes user-controlled text and refuses non-http links", () => {
    const n = renderNotification("PDF_READY", { name: "<script>x</script>" }, { reportType: "kundli\r\nBcc: evil@x.com", downloadUrl: "javascript:alert(1)" });
    expect(n.html).not.toContain("<script>x");
    expect(n.html).toContain("&lt;script&gt;");
    expect(n.html).not.toContain("javascript:");
    expect(n.subject).not.toMatch(/[\r\n]/);
  });

  it("every event renders a subject and a body", () => {
    for (const event of Object.keys(EVENT_SWITCH)) {
      const n = renderNotification(event as never, { name: "A" }, { amount: 5, number: "AE/25-26/000001", gross: 118, balance: 20, used: 80, quota: 100, plan: "PRO", enabled: true });
      expect(n.subject.length).toBeGreaterThan(5);
      expect(n.html).toContain("Notifications");
    }
  });
});

// ── Endpoints ──────────────────────────────────────────────────────────────────────────────────
const post = (url: string, body: object | null, secret: string | null = null) =>
  new NextRequest(`http://x${url}`, { method: "POST", body: body ? JSON.stringify(body) : undefined, headers: secret ? { "x-internal-secret": secret } : {} });

describe("POST /api/notifications/dispatch", () => {
  beforeEach(() => auth.requireAdminSession.mockResolvedValue(null));

  it("is for the engine / admins only", async () => {
    expect((await dispatchPost(post("/api/notifications/dispatch", { userId: "u1", eventType: "LOW_BALANCE" }))).status).toBe(403);
    expect((await dispatchPost(post("/api/notifications/dispatch", { userId: "u1", eventType: "LOW_BALANCE" }, "wrong"))).status).toBe(403);
  });

  it("queues through the preferences, validates the event, and force bypasses the switch", async () => {
    store.users.u1.notificationPrefs = { emailLowBalance: false };
    const skipped = await (await dispatchPost(post("/api/notifications/dispatch", { userId: "u1", eventType: "LOW_BALANCE", data: { balance: 5 } }, "test-internal-secret"))).json();
    expect(skipped).toMatchObject({ queued: 0, skipped: true });
    const forced = await (await dispatchPost(post("/api/notifications/dispatch", { userId: "u1", eventType: "LOW_BALANCE", force: true }, "test-internal-secret"))).json();
    expect(forced.queued).toBe(1);
    expect((await dispatchPost(post("/api/notifications/dispatch", { userId: "u1", eventType: "NOPE" }, "test-internal-secret"))).status).toBe(400);
  });
});

describe("POST /api/internal/notifications/process", () => {
  it("needs the secret or an admin and runs report sweep, spike detection and the queue", async () => {
    auth.requireAdminSession.mockResolvedValue(null);
    expect((await processPost(post("/api/internal/notifications/process", null))).status).toBe(403);

    db.apiRequestLog.groupBy.mockResolvedValue([]);
    await enqueueNotification(db as never, "u1", "PAYMENT_RECEIVED", {});
    const res = await processPost(post("/api/internal/notifications/process", null, "test-internal-secret"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.reportsUpdated).toBe(2);
    expect(body.notifications.sent).toBe(1);
  });
});

describe("POST /api/user/notifications/test", () => {
  it("needs a session, sends through the queue ignoring the switches, and is rate limited", async () => {
    auth.getVerifiedSession.mockResolvedValue(null);
    expect((await testPost()).status).toBe(401);

    auth.getVerifiedSession.mockResolvedValue({ userId: "u1", email: "asha@example.com", role: "USER" });
    store.users.u1.notificationPrefs = Object.fromEntries(Object.keys(DEFAULT_PREFS).map((k) => [k, false]));
    const first = await (await testPost()).json();
    expect(first).toMatchObject({ queued: 1, delivered: 1 });
    expect(mail.sendNotificationEmail).toHaveBeenCalledTimes(1);

    await testPost();
    await testPost();
    expect((await testPost()).status).toBe(429);
  });
});
