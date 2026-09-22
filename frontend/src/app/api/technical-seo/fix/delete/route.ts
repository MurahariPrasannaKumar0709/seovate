import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { getGitHubAccessToken } from "@/lib/integrations/githubClient";
import { prisma } from "@/lib/prisma";
import { getPullRequest, closePullRequest, deleteBranch, GitHubApiError } from "@/lib/integrations/githubClient";

/** Closes the fix PR (if still open) and deletes its branch, then forgets it on the scan so the
 *  UI goes back to offering a fresh "Open fix PR" — full cleanup, not just closing. GitHub itself
 *  has no "delete a pull request" API (a merged/closed PR's history stays forever); removing the
 *  branch is the closest real equivalent and is what "delete" means here. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const scanId = typeof body.scanId === "string" ? body.scanId : null;
  if (!scanId) return NextResponse.json({ error: "missing_scan_id" }, { status: 400 });

  const scan = await prisma.technicalSeoScan.findFirst({ where: { id: scanId, userId: user.id } });
  if (!scan || !scan.fixPrNumber || !scan.fixPrRepoFullName) {
    return NextResponse.json({ error: "no_fix_pr" }, { status: 404 });
  }

  const token = await getGitHubAccessToken(user.id);
  if (!token) return NextResponse.json({ error: "github_not_connected" }, { status: 200 });

  try {
    const pr = await getPullRequest(token, scan.fixPrRepoFullName, scan.fixPrNumber);
    if (pr.state === "open") {
      await closePullRequest(token, scan.fixPrRepoFullName, scan.fixPrNumber);
    }
    await deleteBranch(token, scan.fixPrRepoFullName, pr.head.ref);

    await prisma.technicalSeoScan.update({
      where: { id: scan.id },
      data: { fixPrNumber: null, fixPrRepoFullName: null },
    });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    const status = err instanceof GitHubApiError ? err.status : 500;
    return NextResponse.json({ error: "delete_failed", status }, { status: 200 });
  }
}
