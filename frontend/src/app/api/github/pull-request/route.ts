import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { getGitHubSelection } from "@/lib/integrations/githubSelection";
import { getPullRequest, listPullRequestFiles, GitHubApiError } from "@/lib/integrations/githubClient";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const selection = await getGitHubSelection(user.id);
  if (!selection || !selection.lastPrNumber) {
    return NextResponse.json({ exists: false });
  }

  try {
    const [pr, files] = await Promise.all([
      getPullRequest(selection.accessToken, selection.repoFullName, selection.lastPrNumber),
      listPullRequestFiles(selection.accessToken, selection.repoFullName, selection.lastPrNumber),
    ]);
    const status = pr.merged ? "merged" : pr.state === "closed" ? "closed" : "open";
    return NextResponse.json({
      exists: true,
      number: pr.number,
      status,
      htmlUrl: pr.html_url,
      title: pr.title,
      repoFullName: selection.repoFullName,
      head: pr.head.ref,
      base: pr.base.ref,
      files: files.map((f) => ({ path: f.filename, additions: f.additions, deletions: f.deletions })),
    });
  } catch (err) {
    const status = err instanceof GitHubApiError ? err.status : 500;
    return NextResponse.json({ exists: false, error: "github_api_error", status });
  }
}
