import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/getSession";
import { getGitHubSelection } from "@/lib/integrations/githubSelection";
import { prisma } from "@/lib/prisma";
import { crawlSiteDetailed } from "@/lib/integrations/siteCrawler";
import { runTechnicalSeoRules } from "@/lib/integrations/technicalSeoRules";

// A 40-page crawl plus rule evaluation can take longer than Vercel's default function timeout.
export const maxDuration = 60;

/** Prefills the form with the site the user already told Seovate about (via the GitHub
 *  scaffolding flow) and returns their most recent scan, if any. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ siteUrl: null, scan: null, githubRepoConnected: false });

  const selection = await getGitHubSelection(user.id);
  const scan = await prisma.technicalSeoScan.findFirst({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
    include: { findings: true },
  });

  return NextResponse.json({
    siteUrl: selection?.siteUrl ?? null,
    scan,
    githubRepoConnected: Boolean(selection),
  });
}

/** Runs a real crawl + the deterministic technical-SEO rule engine against the given URL, session-
 *  gated the same way as the Lighthouse/GitHub routes. Synchronous (no worker/queue infra exists
 *  yet) — capped to a small page count via `crawlSiteDetailed` so it fits the function timeout. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const url = typeof body.url === "string" ? body.url : null;
  if (!url) return NextResponse.json({ error: "missing_url" }, { status: 400 });

  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  const scan = await prisma.technicalSeoScan.create({
    data: { userId: user.id, siteUrl: url, status: "running" },
  });

  try {
    const { pages, truncated } = await crawlSiteDetailed(url);
    const findings = runTechnicalSeoRules(pages, origin);

    const completed = await prisma.technicalSeoScan.update({
      where: { id: scan.id },
      data: {
        status: "complete",
        pagesScanned: pages.length,
        truncated,
        completedAt: new Date(),
        findings: {
          create: findings.map((f) => ({
            ruleId: f.ruleId,
            category: f.category,
            severity: f.severity,
            url: f.url,
            evidence: f.evidence as Prisma.InputJsonValue,
          })),
        },
      },
      include: { findings: true },
    });

    return NextResponse.json({ scan: completed });
  } catch (err) {
    console.error("Technical SEO scan failed:", err);
    await prisma.technicalSeoScan.update({
      where: { id: scan.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      },
    });
    return NextResponse.json({ error: "scan_failed", message: "Couldn't complete the crawl. Try again in a moment." }, { status: 200 });
  }
}
