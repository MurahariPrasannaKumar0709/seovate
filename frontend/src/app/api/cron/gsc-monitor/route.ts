import { NextRequest, NextResponse } from "next/server";
import { runSitemapMonitor } from "@/lib/integrations/sitemapMonitor";

/** Hourly check (see vercel.json) for sitemap errors/warnings across every connected Search
 *  Console user — emails only when issues are new/changed since the last run. Vercel Cron sends
 *  `Authorization: Bearer $CRON_SECRET` automatically when that env var is set on the project;
 *  this route rejects anything else so it can't be triggered by an outsider hitting the URL. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runSitemapMonitor();
    return NextResponse.json(result);
  } catch (err) {
    console.error("gsc-monitor cron failed:", err);
    return NextResponse.json({ error: "monitor_failed" }, { status: 500 });
  }
}
