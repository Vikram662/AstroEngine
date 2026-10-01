import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "@/lib/session";
import { currentStep, generateTotpSecret, otpauthUri, totpAtStep, verifyTotp } from "@/lib/totp";
import { verifyPasswordAsync } from "@/lib/passwords";
import { hashPassword as seedHash } from "../../prisma/seed-helpers.mts";

describe("totp (RFC 6238)", () => {
  it("matches the RFC 6238 SHA-1 test vectors (6 digit truncation)", () => {
    // Secret "12345678901234567890" in base32; vectors from RFC 6238 appendix B (last 6 digits).
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    const at = (t: number) => totpAtStep(secret, Math.floor(t / 30));
    expect(at(59)).toBe("287082");
    expect(at(1111111109)).toBe("081804");
    expect(at(1111111111)).toBe("050471");
    expect(at(1234567890)).toBe("005924");
    expect(at(2000000000)).toBe("279037");
  });

  it("generates 160-bit base32 secrets", () => {
    const s = generateTotpSecret();
    expect(s).toMatch(/^[A-Z2-7]{32}$/);
    expect(generateTotpSecret()).not.toBe(s);
  });

  it("accepts the current code and +/-1 step of drift, rejects older ones and bad input", () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const step = currentStep(now);
    expect(verifyTotp(secret, totpAtStep(secret, step), now)).toBe(step);
    expect(verifyTotp(secret, totpAtStep(secret, step - 1), now)).toBe(step - 1);
    expect(verifyTotp(secret, totpAtStep(secret, step + 1), now)).toBe(step + 1);
    expect(verifyTotp(secret, totpAtStep(secret, step - 3), now)).toBeNull();
    expect(verifyTotp(secret, "12345", now)).toBeNull();
    expect(verifyTotp(secret, "abcdef", now)).toBeNull();
  });

  it("builds an otpauth URI", () => {
    const uri = otpauthUri("a@b.com", "ABC234");
    expect(uri.startsWith("otpauth://totp/AstroEngine%3Aa%40b.com?secret=ABC234")).toBe(true);
    expect(uri).toContain("period=30");
  });
});

describe("session iat (password change revocation)", () => {
  it("stamps iat and exp", () => {
    const p = verifySessionToken(createSessionToken({ userId: "u", email: "a@x.com", role: "USER" }));
    expect(p?.iat).toBeTypeOf("number");
    expect((p?.exp ?? 0) - (p?.iat ?? 0)).toBe(72 * 3600);
  });
});

describe("seed helpers", () => {
  it("hash format is verifiable by the app", async () => {
    expect(await verifyPasswordAsync("s3cret-pass", seedHash("s3cret-pass"))).toBe(true);
    expect(await verifyPasswordAsync("other", seedHash("s3cret-pass"))).toBe(false);
  });
});
