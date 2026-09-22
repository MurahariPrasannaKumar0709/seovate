import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { getGitHubSelection } from "@/lib/integrations/githubSelection";
import { prisma } from "@/lib/prisma";
import { getRepo, getRef, getCommitDetails, createGitCommit, updateRef, GitHubApiError } from "@/lib/integrations/githubClient";

/** Safely undoes a merged fix whose deployment failed — a forward "revert commit" (same approach
 *  as `git revert`: a new commit whose tree matches the pre-merge state, with the current branch
 *  tip as its parent), not a history-rewriting force-push. Explicit, one-click, and only ever
 *  triggered by the user — an automatic silent revert would be a bigger unilateral action on
 *  someone's real repo than anything else this pipeline does. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const scanId = typeof body.scanId === "string" ? body.scanId : null;
  if (!scanId) return NextResponse.json({ error: "missing_scan_id" }, { status: 400 });

  const scan = await prisma.technicalSeoScan.findFirst({ where: { id: scanId, userId: user.id } });
  if (!scan || !scan.fixMergeCommitSha || !scan.fixPrRepoFullName) {
    return NextResponse.json({ error: "no_merge_to_revert" }, { status: 404 });
  }
  if (scan.fixRevertCommitSha) {
    return NextResponse.json({ error: "already_reverted" }, { status: 200 });
  }

  const selection = await getGitHubSelection(user.id);
  if (!selection) return NextResponse.json({ error: "github_not_connected" }, { status: 200 });

  try {
    const repo = await getRepo(selection.accessToken, scan.fixPrRepoFullName);
    const mergeCommit = await getCommitDetails(selection.accessToken, scan.fixPrRepoFullName, scan.fixMergeCommitSha);
    const preFixCommitSha = mergeCommit.parentShas[0];
    if (!preFixCommitSha) {
      return NextResponse.json({ error: "revert_failed", message: "Couldn't determine the pre-fix state to revert to." }, { status: 200 });
    }
    const preFixTree = await getCommitDetails(selection.accessToken, scan.fixPrRepoFullName, preFixCommitSha);

    const currentHead = await getRef(selection.accessToken, scan.fixPrRepoFullName, repo.default_branch);
    const revertCommitSha = await createGitCommit(
      selection.accessToken,
      scan.fixPrRepoFullName,
      `Revert "Seovate: auto-fix from technical-SEO audit" — deployment failed`,
      preFixTree.treeSha,
      currentHead
    );
    await updateRef(selection.accessToken, scan.fixPrRepoFullName, repo.default_branch, revertCommitSha);

    await prisma.technicalSeoScan.update({
      where: { id: scan.id },
      data: { fixRevertCommitSha: revertCommitSha },
    });

    return NextResponse.json({ reverted: true, revertCommitSha });
  } catch (err) {
    console.error("Revert failed:", err);
    const status = err instanceof GitHubApiError ? err.status : 500;
    return NextResponse.json({ error: "revert_failed", message: "Couldn't revert the merge.", status }, { status: 200 });
  }
}
