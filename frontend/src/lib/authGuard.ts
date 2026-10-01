import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/session";

export interface AuthContext {
  userId: string;
  email: string;
  role: string;
}

/**
 * Validates the signed session token from httpOnly cookies.
 * Returns the verified user context, or null if invalid/expired.
 */
export async function getVerifiedSession(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("astro_session_token")?.value;
  const verified = verifySessionToken(token);

  if (!verified || !verified.email) {
    return null;
  }

  // Double check that user still exists in DB and is not blocked
  const user = await prisma.user.findUnique({
    where: { email: verified.email },
    select: { id: true, email: true, role: true, isBlocked: true, passwordChangedAt: true }
  });

  if (!user || user.isBlocked) {
    return null;
  }

  // A password change / reset revokes every session issued before it.
  if (user.passwordChangedAt && (verified.iat ?? 0) < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role
  };
}

/**
 * Enforces that caller must be a verified ADMIN or SUPER_ADMIN.
 * Throws or returns null if not an admin.
 */
export async function requireAdminSession(): Promise<AuthContext | null> {
  const session = await getVerifiedSession();
  if (!session) return null;
  if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
    return null;
  }
  return session;
}
