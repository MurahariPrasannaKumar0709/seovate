import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId: user.id, provider: "google_search_console" } },
  });
  return NextResponse.json({ enabled: integration?.notifyByEmail ?? true });
}

/** Lets the user opt out of sitemap-issue and weekly-report emails — the consent mechanism for
 *  the automated monitoring/report cron, since there's no way to ask for real-time approval on a
 *  scheduled job. Defaults to on when connecting, same as most product-notification settings. */
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId: user.id, provider: "google_search_console" } },
  });
  if (!integration) return NextResponse.json({ error: "not_connected" }, { status: 400 });

  await prisma.integration.update({ where: { id: integration.id }, data: { notifyByEmail: body.enabled } });
  return NextResponse.json({ enabled: body.enabled });
}
