import { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookieValue } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/** First real server-side read of the session cookie — everything else only writes/deletes it. */
export function getSessionEmail(req: NextRequest): string | null {
  return verifySessionCookieValue(req.cookies.get(SESSION_COOKIE_NAME)?.value);
}

/** Resolves the session cookie to an actual User row (id + email), or null if not logged in. */
export async function getSessionUser(
  req: NextRequest
): Promise<{ id: string; email: string } | null> {
  const email = getSessionEmail(req);
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
  return user;
}
