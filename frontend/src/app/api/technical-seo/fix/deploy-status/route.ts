import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { getGitHubAccessToken, getCommitStatus, GitHubApiError } from "@/lib/integrations/githubClient";
import { prisma } from "@/lib/prisma";

/** Checks whether a merged fix actually deployed, via the GitHub Commit Status API (what Vercel's
 *  GitHub integration posts to a commit). This is the real backstop for what the pre-commit syntax
 *  check can't catch (cross-file type errors) — it can't prevent a bad deploy, but it makes sure
 *  one is never silently missed the way it was the first time this pipeline shipped one. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  const scanId = req.nextUrl.searchParams.get("scanId");
  if (!scanId) return NextResponse.json({ error: "missing_scan_id" }, { status: 400 });

  const scan = await prisma.technicalSeoScan.findFirst({ where: { id: scanId, userId: user.id } });
  if (!scan || !scan.fixPrRepoFullName) {
    return NextResponse.json({ exists: false });
  }
  const checkSha = scan.fixRevertCommitSha ?? scan.fixMergeCommitSha;
  if (!checkSha) return NextResponse.json({ exists: false });

  const token = await getGitHubAccessToken(user.id);
  if (!token) return NextResponse.json({ exists: false });

  try {
    const status = await getCommitStatus(token, scan.fixPrRepoFullName, checkSha);
    return NextResponse.json({
      exists: true,
      reverted: Boolean(scan.fixRevertCommitSha),
      sha: checkSha,
      status: status
        ? { state: status.state, description: status.description, targetUrl: status.targetUrl }
        : { state: "unknown", description: "No deployment status reported for this commit yet.", targetUrl: null },
    });
  } catch (err) {
    const status = err instanceof GitHubApiError ? err.status : 500;
    return NextResponse.json({ exists: false, error: "github_api_error", status });
  }
}
