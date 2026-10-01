// Single source of truth for the session-signing secret (shared by the Node
// and Edge/Web-Crypto session modules).
//
// SESSION_SECRET is mandatory everywhere except `next dev`. It is intentionally
// NOT derived from ASTRO_INTERNAL_SECRET: leaking the service-to-service secret
// must not let anyone mint admin session cookies.
const DEV_ONLY_SECRET = "dev-only-session-secret-never-use-in-production";

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "development") return DEV_ONLY_SECRET;
  throw new Error("SECURITY: SESSION_SECRET must be configured (only `next dev` may run without it).");
}
