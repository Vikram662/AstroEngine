// Guards for the public calculator proxy: which backend endpoints an anonymous
// browser may reach through the server-held internal API key.

const PUBLIC_PREFIXES = [
  "panchang", "parashari", "dosha-matching", "dosha", "remedies", "dasha", "numerology",
  "core", "kp", "western", "tarot", "advanced", "lalkitab", "vastu", "matchmaking", "general",
];
// Expensive (CPU, storage or LLM cost) - require a signed-in user.
const AUTH_PREFIXES = ["pdf", "ai-astrologer", "ai"];

export type ProxyTarget =
  | { ok: true; url: URL; requiresAuth: boolean; adminOnly: boolean }
  | { ok: false; reason: string };

export function resolveProxyTarget(endpoint: unknown, backendUrl: string): ProxyTarget {
  if (typeof endpoint !== "string" || endpoint.length > 300) return { ok: false, reason: "Invalid endpoint." };
  // Reject encoded or raw traversal, backslashes, control characters and double slashes.
  const hasBadChar = Array.from(endpoint).some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 92);
  if (hasBadChar || /%2e|%2f|%5c|\/\/|\.\./i.test(endpoint)) return { ok: false, reason: "Invalid endpoint." };
  if (!endpoint.startsWith("/api/v1/")) return { ok: false, reason: "Target must start with /api/v1/" };

  let url: URL;
  try {
    url = new URL(endpoint, backendUrl);
  } catch {
    return { ok: false, reason: "Invalid endpoint." };
  }
  if (url.origin !== new URL(backendUrl).origin || !url.pathname.startsWith("/api/v1/")) {
    return { ok: false, reason: "Invalid endpoint." };
  }

  const segment = url.pathname.split("/")[3] || "";
  if (PUBLIC_PREFIXES.includes(segment)) return { ok: true, url, requiresAuth: false, adminOnly: false };
  if (AUTH_PREFIXES.includes(segment)) {
    const adminOnly = url.pathname === "/api/v1/pdf/jobs";
    return { ok: true, url, requiresAuth: true, adminOnly };
  }
  return { ok: false, reason: "Endpoint is not available through the public proxy." };
}
