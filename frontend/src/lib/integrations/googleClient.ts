import { prisma } from "@/lib/prisma";
import { decryptToken, encryptToken } from "@/lib/integrations/crypto";
import type { GoogleIntegrationProvider } from "@/lib/integrations/providers";

const REFRESH_MARGIN_MS = 60_000;

/**
 * Returns a valid (non-expired) access token for the user's connection to the given Google
 * integration, refreshing it via the stored refresh_token if needed. Returns null if the user
 * isn't connected, or if refreshing fails (e.g. the user revoked access from their Google
 * account — the stored connection then needs to be re-authorized, not silently retried forever).
 */
export async function getValidGoogleAccessToken(
  userId: string,
  provider: GoogleIntegrationProvider
): Promise<string | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider } },
  });
  if (!integration || integration.status !== "connected") return null;

  const expiresAt = integration.tokenExpiresAt;
  const needsRefresh = !expiresAt || expiresAt.getTime() - REFRESH_MARGIN_MS < Date.now();
  if (!needsRefresh) return decryptToken(integration.accessTokenEnc);

  if (!integration.refreshTokenEnc) return decryptToken(integration.accessTokenEnc);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: decryptToken(integration.refreshTokenEnc),
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    if (res.status === 400 || res.status === 401) {
      // Refresh token itself is no longer valid (revoked from the Google Account side) —
      // mark disconnected so the UI prompts a real re-connect instead of failing silently on
      // every future call.
      await prisma.integration.update({
        where: { id: integration.id },
        data: { status: "disconnected" },
      });
    }
    return null;
  }

  const data = await res.json();
  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      accessTokenEnc: encryptToken(data.access_token),
      tokenExpiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
    },
  });

  return data.access_token as string;
}
