import { NextRequest, NextResponse } from "next/server";
import { runWeeklyReports } from "@/lib/integrations/sitemapMonitor";

/** Weekly report email (see vercel.json) for every connected Search Console user — see
 *  gsc-monitor/route.ts for the same Vercel Cron auth pattern. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runWeeklyReports();
    return NextResponse.json(result);
  } catch (err) {
    console.error("weekly-report cron failed:", err);
    return NextResponse.json({ error: "report_failed" }, { status: 500 });
  }
}
