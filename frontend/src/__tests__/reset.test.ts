import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn() },
  emailOtp: { upsert: vi.fn(), findUnique: vi.fn(), deleteMany: vi.fn() },
}));
const mail = vi.hoisted(() => ({ sendPasswordResetEmail: vi.fn(async () => ({ success: true })) }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/email", () => mail);

import { POST, PUT } from "@/app/api/auth/reset/route";
import { hashOtp } from "@/lib/otp";
import { verifyPasswordAsync } from "@/lib/passwords";

let ipCounter = 0;
const req = (method: "POST" | "PUT", body: object) =>
  new NextRequest("http://x/api/auth/reset", {
    method,
    body: JSON.stringify(body),
    headers: { "x-forwarded-for": `10.0.0.${++ipCounter}` }, // distinct IP per call: rate limits are tested separately
  });

const EMAIL = "user@example.com";

beforeEach(() => {
  vi.clearAllMocks();
  db.user.findUnique.mockResolvedValue({ id: "u1", isBlocked: false });
  db.emailOtp.deleteMany.mockResolvedValue({ count: 1 });
});

describe("POST /api/auth/reset (request a code)", () => {
  it("answers identically for unknown accounts and sends nothing", async () => {
    db.user.findUnique.mockResolvedValue(null);
    const unknown = await POST(req("POST", { email: "nobody@example.com" }));
    const unknownBody = await unknown.json();

    db.user.findUnique.mockResolvedValue({ id: "u1", isBlocked: false });
    const known = await POST(req("POST", { email: "someone@example.com" }));
    const knownBody = await known.json();

    expect(unknown.status).toBe(200);
    expect(known.status).toBe(200);
    expect(unknownBody).toEqual(knownBody);
    expect(mail.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  it("stores only a hash of the code", async () => {
    await POST(req("POST", { email: "hash@example.com" }));
    const [code] = mail.sendPasswordResetEmail.mock.calls[0].slice(1) as unknown as [string];
    const stored = db.emailOtp.upsert.mock.calls[0][0].create.otp as string;
    expect(stored).not.toContain(code);
    expect(stored).toHaveLength(64);
  });

  it("rejects malformed emails and rate-limits repeated requests per email", async () => {
    expect((await POST(req("POST", { email: "not-an-email" }))).status).toBe(400);
    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) statuses.push((await POST(req("POST", { email: "spam@example.com" }))).status);
    expect(statuses).toEqual([200, 200, 200, 429]);
  });
});

describe("PUT /api/auth/reset (set a new password)", () => {
  const record = (code: string, email = EMAIL, expiresInMs = 60_000) => ({
    id: "o1",
    email,
    otp: hashOtp(`reset:${email}`, code),
    expiresAt: new Date(Date.now() + expiresInMs),
  });

  it("changes the password with a valid code and burns it", async () => {
    db.emailOtp.findUnique.mockResolvedValue(record("123456"));
    const res = await PUT(req("PUT", { email: EMAIL, otp: "123456", newPassword: "a-new-password" }));
    expect(res.status).toBe(200);
    expect(db.emailOtp.deleteMany).toHaveBeenCalledWith({ where: { id: "o1" } });
    const saved = db.user.update.mock.calls[0][0].data.password as string;
    expect(saved.startsWith("scrypt$")).toBe(true);
    expect(await verifyPasswordAsync("a-new-password", saved)).toBe(true);
  });

  it("rejects a wrong or expired code without touching the password", async () => {
    db.emailOtp.findUnique.mockResolvedValue(record("123456"));
    expect((await PUT(req("PUT", { email: EMAIL, otp: "000000", newPassword: "a-new-password" }))).status).toBe(400);
    db.emailOtp.findUnique.mockResolvedValue(record("123456", EMAIL, -1000));
    expect((await PUT(req("PUT", { email: EMAIL, otp: "123456", newPassword: "a-new-password" }))).status).toBe(400);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("does not accept a sign-up verification code as a reset code", async () => {
    db.emailOtp.findUnique.mockResolvedValue({
      id: "o2", email: EMAIL, otp: hashOtp(EMAIL, "123456"), expiresAt: new Date(Date.now() + 60_000),
    });
    expect((await PUT(req("PUT", { email: EMAIL, otp: "123456", newPassword: "a-new-password" }))).status).toBe(400);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("enforces password strength and a code that was already used", async () => {
    db.emailOtp.findUnique.mockResolvedValue(record("123456"));
    expect((await PUT(req("PUT", { email: EMAIL, otp: "123456", newPassword: "short" }))).status).toBe(400);
    db.emailOtp.deleteMany.mockResolvedValue({ count: 0 }); // lost the race to another request
    expect((await PUT(req("PUT", { email: EMAIL, otp: "123456", newPassword: "a-new-password" }))).status).toBe(400);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("locks guessing after repeated wrong codes and invalidates the code", async () => {
    const email = "brute@example.com";
    db.emailOtp.findUnique.mockResolvedValue(record("123456", email));
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      statuses.push((await PUT(req("PUT", { email, otp: "000000", newPassword: "a-new-password" }))).status);
    }
    expect(statuses.slice(0, 5)).toEqual([400, 400, 400, 400, 400]);
    expect(statuses[5]).toBe(429);
    expect(db.emailOtp.deleteMany).toHaveBeenCalledWith({ where: { email } });
  });
});
