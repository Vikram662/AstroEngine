/**
 * Best-effort client IP. X-Forwarded-For is client-controllable on its left
 * side, so we count from the right: TRUSTED_PROXY_HOPS (default 1) is the
 * number of reverse proxies we run in front of the app.
 */
export function getClientIp(req: Request): string {
  const hops = Math.max(1, parseInt(process.env.TRUSTED_PROXY_HOPS || "1", 10) || 1);
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[Math.max(0, parts.length - hops)];
  }
  return req.headers.get("x-real-ip") || "unknown";
}
