import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { creditsForAmount, isPlanTier, isUnusableSecret, verifyHmacHex } from "@/lib/razorpay";
import { hashPasswordAsync, validatePasswordStrength, verifyPasswordAsync } from "@/lib/passwords";
import { generateOtp, hashOtp, otpMatches } from "@/lib/otp";
import { RateLimiter } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/clientIp";
import { resolveProxyTarget } from "@/lib/backendProxy";
import { isPrivateIp } from "@/lib/ssrf";
import { safeEqual } from "@/lib/internalAuth";
import { createSessionToken, verifySessionToken } from "@/lib/session";
import crypto from "crypto";

describe("razorpay helpers", () => {
  it("rejects the public dummy and placeholder secrets", () => {
    for (const v of ["whsec_astro_enterprise_live2026", "s8e8w9f0a1b2c3d4e5f6g7h8", "", "  ", "placeholder_key", null]) {
      expect(isUnusableSecret(v as string | null)).toBe(true);
    }
    expect(isUnusableSecret("whsec_realLooking_9f8a7b6c")).toBe(false);
  });

  it("applies volume bonus tiers", () => {
    expect(creditsForAmount(100)).toBe(100);
    expect(creditsForAmount(2000)).toBeCloseTo(2200);
    expect(creditsForAmount(5000)).toBeCloseTo(5800);
    expect(creditsForAmount(10000)).toBeCloseTo(12500);
  });

  it("verifies HMAC signatures without throwing on bad input", () => {
    const sig = crypto.createHmac("sha256", "k").update("a|b").digest("hex");
    expect(verifyHmacHex("a|b", sig, "k")).toBe(true);
    expect(verifyHmacHex("a|b", sig.slice(0, 10), "k")).toBe(false);
    expect(verifyHmacHex("a|b", "", "k")).toBe(false);
    expect(verifyHmacHex("a|c", sig, "k")).toBe(false);
  });

  it("validates plan tiers", () => {
    expect(isPlanTier("PRO")).toBe(true);
    expect(isPlanTier("FREE")).toBe(false);
    expect(isPlanTier({})).toBe(false);
  });
});

describe("passwords", () => {
  it("enforces length bounds", () => {
    expect(validatePasswordStrength("short")).toMatch(/at least/);
    expect(validatePasswordStrength("x".repeat(200))).toMatch(/at most/);
    expect(validatePasswordStrength("a-good-password")).toBeNull();
  });

  it("hashes with scrypt and verifies", async () => {
    const h = await hashPasswordAsync("correct horse");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPasswordAsync("correct horse", h)).toBe(true);
    expect(await verifyPasswordAsync("wrong", h)).toBe(false);
  });

  it("never authenticates a missing account", async () => {
    expect(await verifyPasswordAsync("anything", null)).toBe(false);
  });

  it("still accepts legacy sha256 hashes", async () => {
    const legacy = crypto.createHash("sha256").update("old-pass").digest("hex");
    expect(await verifyPasswordAsync("old-pass", legacy)).toBe(true);
    expect(await verifyPasswordAsync("nope", legacy)).toBe(false);
  });
});

describe("otp", () => {
  it("generates 6 digits and matches only the right email+code", () => {
    for (let i = 0; i < 50; i++) expect(generateOtp()).toMatch(/^[1-9]\d{5}$/);
    const h = hashOtp("a@x.com", "123456");
    expect(h).not.toContain("123456");
    expect(otpMatches("a@x.com", "123456", h)).toBe(true);
    expect(otpMatches("a@x.com", "123457", h)).toBe(false);
    expect(otpMatches("b@x.com", "123456", h)).toBe(false);
  });
});

describe("session tokens", () => {
  it("round-trips and rejects tampering and missing exp", () => {
    const t = createSessionToken({ userId: "u1", email: "A@x.com", role: "USER" });
    expect(verifySessionToken(t)?.email).toBe("a@x.com");
    const [p, s] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ userId: "u1", email: "a@x.com", role: "ADMIN", exp: 9999999999 })).toString("base64url");
    expect(verifySessionToken(`${forged}.${s}`)).toBeNull();
    expect(verifySessionToken(`${p}.AAAA`)).toBeNull();
    expect(verifySessionToken("garbage")).toBeNull();
    expect(verifySessionToken(createSessionToken({ userId: "u", email: "a@x.com", role: "USER" }, -1))).toBeNull();
  });
});

describe("rate limiter", () => {
  it("blocks after the limit and can be reset", () => {
    const rl = new RateLimiter(3, 60_000);
    expect([rl.hit("k"), rl.hit("k"), rl.hit("k"), rl.hit("k")]).toEqual([false, false, false, true]);
    expect(rl.isLimited("k")).toBe(true);
    rl.reset("k");
    expect(rl.isLimited("k")).toBe(false);
  });
});

describe("client ip", () => {
  const req = (xff: string) => new Request("http://x", { headers: { "x-forwarded-for": xff } });
  it("uses the right-most hop by default so spoofed prefixes are ignored", () => {
    expect(getClientIp(req("1.1.1.1, 2.2.2.2, 9.9.9.9"))).toBe("9.9.9.9");
    expect(getClientIp(req("6.6.6.6"))).toBe("6.6.6.6");
    expect(getClientIp(new Request("http://x"))).toBe("unknown");
  });
});

describe("proxy target resolution", () => {
  const B = "http://127.0.0.1:8000";
  it("allows public calculators and flags expensive ones as auth-only", () => {
    const pub = resolveProxyTarget("/api/v1/panchang/daily", B);
    expect(pub.ok && !pub.requiresAuth).toBe(true);
    const pdf = resolveProxyTarget("/api/v1/pdf/kundli/basic", B);
    expect(pdf.ok && pdf.requiresAuth && !pdf.adminOnly).toBe(true);
    const jobs = resolveProxyTarget("/api/v1/pdf/jobs", B);
    expect(jobs.ok && jobs.adminOnly).toBe(true);
  });

  it("rejects traversal, encoded tricks, other prefixes and absolute URLs", () => {
    for (const e of ["/api/v1/../docs", "/api/v1/%2e%2e/docs", "/api/v1//x", "/api/v1/core" + String.fromCharCode(92) + "x", "/docs", "http://evil.com/api/v1/x", "/api/v1/unknown/x", 5, null]) {
      expect(resolveProxyTarget(e, B).ok).toBe(false);
    }
  });
});

describe("ssrf ip filter", () => {
  it("blocks internal ranges including mapped and NAT64 forms", () => {
    for (const ip of ["127.0.0.1", "10.0.0.1", "169.254.169.254", "0.0.0.0", "100.64.0.1", "::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "fe80::1", "64:ff9b::7f00:1"]) {
      expect(isPrivateIp(ip)).toBe(true);
    }
    for (const ip of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"]) expect(isPrivateIp(ip)).toBe(false);
  });
});

describe("safeEqual", () => {
  it("handles different lengths without throwing", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abcd")).toBe(false);
    expect(safeEqual("", "x")).toBe(false);
  });
});

import { decryptSetting, encryptSetting, isEncrypted } from "@/lib/secretBox";
import { SharedRateLimiter } from "@/lib/rateLimit";
import { cached, clearCache } from "@/lib/ttlCache";

describe("secretBox", () => {
  it("passes values through unchanged when no key is configured", () => {
    delete process.env.SETTINGS_ENCRYPTION_KEY;
    expect(encryptSetting("plain")).toBe("plain");
    expect(decryptSetting("plain")).toBe("plain");
  });

  it("round-trips with a key, uses a fresh IV, and detects tampering or a wrong key", () => {
    process.env.SETTINGS_ENCRYPTION_KEY = "unit-test-key";
    const a = encryptSetting("rzp_secret_value");
    const b = encryptSetting("rzp_secret_value");
    expect(isEncrypted(a)).toBe(true);
    expect(a).not.toContain("rzp_secret_value");
    expect(a).not.toBe(b);
    expect(decryptSetting(a)).toBe("rzp_secret_value");
    expect(encryptSetting(a)).toBe(a); // idempotent

    const tampered = a.slice(0, -2) + (a.endsWith("AA") ? "BB" : "AA");
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(decryptSetting(tampered)).toBe("");
    process.env.SETTINGS_ENCRYPTION_KEY = "another-key";
    expect(decryptSetting(a)).toBe("");
    errSpy.mockRestore();
    delete process.env.SETTINGS_ENCRYPTION_KEY;
  });
});

describe("shared rate limiter (in-memory fallback without REDIS_URL)", () => {
  it("limits, and resets", async () => {
    const rl = new SharedRateLimiter("t", 2, 60_000);
    expect([await rl.hit("k"), await rl.hit("k"), await rl.hit("k")]).toEqual([false, false, true]);
    expect(await rl.isLimited("k")).toBe(true);
    await rl.reset("k");
    expect(await rl.isLimited("k")).toBe(false);
  });
});

describe("ttl cache", () => {
  it("serves cached values and collapses concurrent misses", async () => {
    clearCache();
    const loader = vi.fn(async () => "v");
    const [a, b] = await Promise.all([cached("k1", 1000, loader), cached("k1", 1000, loader)]);
    expect([a, b]).toEqual(["v", "v"]);
    await cached("k1", 1000, loader);
    expect(loader).toHaveBeenCalledTimes(1);
  });
});
