import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const repoFullName = typeof body?.repoFullName === "string" ? body.repoFullName.trim() : "";
  const siteUrl = typeof body?.siteUrl === "string" ? body.siteUrl.trim() : "";

  if (!repoFullName || !/^[^/]+\/[^/]+$/.test(repoFullName)) {
    return NextResponse.json({ error: "A repo in owner/name form is required." }, { status: 400 });
  }
  if (!siteUrl) {
    return NextResponse.json({ error: "A site URL to audit is required." }, { status: 400 });
  }
  try {
    new URL(siteUrl);
  } catch {
    return NextResponse.json({ error: "That doesn't look like a valid URL." }, { status: 400 });
  }

  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId: user.id, provider: "github" } },
  });
  if (!integration || integration.status !== "connected") {
    return NextResponse.json({ error: "Connect GitHub first." }, { status: 400 });
  }

  await prisma.integration.update({
    where: { id: integration.id },
    data: { repoFullName, siteUrl, lastPrNumber: null },
  });

  return NextResponse.json({ repoFullName, siteUrl });
}
