import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { isIntegrationProvider } from "@/lib/integrations/providers";
import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/integrations/crypto";

/** Just deleting our own Integration row leaves the OAuth grant itself still active on GitHub's
 *  side — since the user's browser is normally still logged into github.com, reconnecting then
 *  silently re-authorizes with the same account (GitHub skips the consent screen entirely for an
 *  already-authorized app) instead of prompting anything. Revoking the grant here means a
 *  reconnect always goes through GitHub's real consent screen again. Best-effort: a failure here
 *  (e.g. the token was already invalid) shouldn't block disconnecting locally. */
async function revokeGitHubGrant(accessToken: string): Promise<void> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return;

  await fetch(`https://api.github.com/applications/${clientId}/grant`, {
    method: "DELETE",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ access_token: accessToken }),
  }).catch(() => undefined);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;

  if (!isIntegrationProvider(provider)) {
    return NextResponse.json({ error: "Unknown provider." }, { status: 400 });
  }

  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  if (provider === "github") {
    const existing = await prisma.integration.findUnique({ where: { userId_provider: { userId: user.id, provider } } });
    if (existing) {
      try {
        await revokeGitHubGrant(decryptToken(existing.accessTokenEnc));
      } catch {
        // Token already unreadable/invalid — nothing to revoke, proceed with local disconnect.
      }
    }
  }

  await prisma.integration
    .delete({ where: { userId_provider: { userId: user.id, provider } } })
    .catch(() => undefined);

  return NextResponse.json({ provider, connected: false });
}
