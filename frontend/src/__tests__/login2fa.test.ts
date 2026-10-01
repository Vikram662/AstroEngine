import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  emailOtp: { findUnique: vi.fn(), deleteMany: vi.fn(), updateMany: vi.fn() },
  systemSetting: { findMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { POST } from "@/app/api/auth/session/route";
import { hashPasswordAsync } from "@/lib/passwords";
import { currentStep, generateTotpSecret, totpAtStep } from "@/lib/totp";

const PASSWORD = "pw-12345678";
const secret = generateTotpSecret();
let passwordHash = "";
let n = 0;

const login = (body: object) =>
  new NextRequest("http://x/api/auth/session", {
    method: "POST",
    body: JSON.stringify({ email: "admin@example.com", password: PASSWORD, action: "login", ...body }),
    headers: { "x-forwarded-for": `10.1.0.${++n}` },
  });

beforeAll(async () => {
  passwordHash = await hashPasswordAsync(PASSWORD);
});

beforeEach(() => {
  vi.clearAllMocks();
  db.user.findUnique.mockImplementation(async () => ({
    id: "u1", email: "admin@example.com", role: "ADMIN", isBlocked: false,
    password: passwordHash, totpEnabled: true, totpSecret: secret, totpLastStep: null,
  }));
  db.user.updateMany.mockResolvedValue({ count: 1 });
});

describe("login with two-factor authentication", () => {
  it("asks for the code after a correct password and issues no session yet", async () => {
    const res = await POST(login({}));
    expect(res.status).toBe(401);
    expect((await res.json()).status).toBe("totp_required");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("rejects a wrong code", async () => {
    const res = await POST(login({ totp: "000000" }));
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(db.user.updateMany).not.toHaveBeenCalled();
  });

  it("accepts the current code, records the step and sets the session cookie", async () => {
    const step = currentStep();
    const res = await POST(login({ totp: totpAtStep(secret, step) }));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("astro_session_token=");
    const claim = db.user.updateMany.mock.calls[0][0];
    expect(claim.data).toEqual({ totpLastStep: step });
    expect(claim.where.OR).toEqual([{ totpLastStep: null }, { totpLastStep: { lt: step } }]);
  });

  it("refuses a replayed code (step already used)", async () => {
    db.user.updateMany.mockResolvedValue({ count: 0 }); // atomic claim lost: step was used before
    const res = await POST(login({ totp: totpAtStep(secret, currentStep()) }));
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("does not prompt for a code when the password is wrong", async () => {
    const res = await POST(login({ password: "wrong-password" }));
    expect(res.status).toBe(401);
    expect((await res.json()).status).toBe("error");
  });

  it("accounts without 2FA sign in with the password alone", async () => {
    db.user.findUnique.mockImplementation(async () => ({
      id: "u2", email: "admin@example.com", role: "USER", isBlocked: false,
      password: passwordHash, totpEnabled: false, totpSecret: null, totpLastStep: null,
    }));
    const res = await POST(login({}));
    expect(res.status).toBe(200);
  });
});
