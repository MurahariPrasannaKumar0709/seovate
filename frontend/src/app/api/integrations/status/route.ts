import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { INTEGRATION_PROVIDERS, type IntegrationProvider } from "@/lib/integrations/providers";
import { prisma } from "@/lib/prisma";

export type IntegrationStatus = {
  provider: IntegrationProvider;
  connected: boolean;
  label: string | null;
  connectedAt: string | null;
};

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);

  const base: Record<IntegrationProvider, IntegrationStatus> = Object.fromEntries(
    INTEGRATION_PROVIDERS.map((provider) => [
      provider,
      { provider, connected: false, label: null, connectedAt: null },
    ])
  ) as Record<IntegrationProvider, IntegrationStatus>;

  if (!user) {
    return NextResponse.json({ integrations: Object.values(base) });
  }

  const rows = await prisma.integration.findMany({ where: { userId: user.id } });
  for (const row of rows) {
    if (row.provider in base) {
      base[row.provider as IntegrationProvider] = {
        provider: row.provider as IntegrationProvider,
        connected: row.status === "connected",
        label: row.externalLabel,
        connectedAt: row.connectedAt.toISOString(),
      };
    }
  }

  return NextResponse.json({ integrations: Object.values(base) });
}
