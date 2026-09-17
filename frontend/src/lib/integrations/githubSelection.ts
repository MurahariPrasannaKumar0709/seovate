import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/integrations/crypto";

export type GitHubSelection = {
  accessToken: string;
  repoFullName: string;
  siteUrl: string | null;
  lastPrNumber: number | null;
};

/** Loads the connected GitHub token plus the repo/site the user picked, or null if any piece
 *  is missing (not connected, or connected but hasn't picked a repo yet). */
export async function getGitHubSelection(userId: string): Promise<GitHubSelection | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "github" } },
  });
  if (!integration || integration.status !== "connected" || !integration.repoFullName) return null;

  return {
    accessToken: decryptToken(integration.accessTokenEnc),
    repoFullName: integration.repoFullName,
    siteUrl: integration.siteUrl,
    lastPrNumber: integration.lastPrNumber,
  };
}
