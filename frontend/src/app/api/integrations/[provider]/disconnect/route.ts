import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { isIntegrationProvider } from "@/lib/integrations/providers";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;

  if (!isIntegrationProvider(provider)) {
    return NextResponse.json({ error: "Unknown provider." }, { status: 400 });
  }

  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  await prisma.integration
    .delete({ where: { userId_provider: { userId: user.id, provider } } })
    .catch(() => undefined);

  return NextResponse.json({ provider, connected: false });
}
