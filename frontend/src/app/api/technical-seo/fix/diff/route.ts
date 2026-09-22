import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { getGitHubAccessToken } from "@/lib/integrations/githubClient";
import { prisma } from "@/lib/prisma";
import { getPullRequest, compareCommits, GitHubApiError } from "@/lib/integrations/githubClient";

/** Unified diffs for the fix PR's files, so changes can be reviewed inside Seovate itself instead
 *  of always having to jump to GitHub. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  const scanId = req.nextUrl.searchParams.get("scanId");
  if (!scanId) return NextResponse.json({ error: "missing_scan_id" }, { status: 400 });

  const scan = await prisma.technicalSeoScan.findFirst({ where: { id: scanId, userId: user.id } });
  if (!scan || !scan.fixPrNumber || !scan.fixPrRepoFullName) {
    return NextResponse.json({ error: "no_fix_pr" }, { status: 404 });
  }

  const token = await getGitHubAccessToken(user.id);
  if (!token) return NextResponse.json({ error: "github_not_connected" }, { status: 200 });

  try {
    const pr = await getPullRequest(token, scan.fixPrRepoFullName, scan.fixPrNumber);
    const { files } = await compareCommits(token, scan.fixPrRepoFullName, pr.base.ref, pr.head.ref);
    return NextResponse.json({
      files: files.map((f) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch ?? null,
      })),
    });
  } catch (err) {
    const status = err instanceof GitHubApiError ? err.status : 500;
    return NextResponse.json({ error: "github_api_error", status }, { status: 200 });
  }
}
