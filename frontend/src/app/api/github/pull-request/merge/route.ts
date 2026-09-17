import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { getGitHubSelection } from "@/lib/integrations/githubSelection";
import { mergePullRequest, GitHubApiError } from "@/lib/integrations/githubClient";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const selection = await getGitHubSelection(user.id);
  if (!selection || !selection.lastPrNumber) {
    return NextResponse.json({ error: "No open pull request to merge." }, { status: 400 });
  }

  try {
    await mergePullRequest(selection.accessToken, selection.repoFullName, selection.lastPrNumber);
    return NextResponse.json({ status: "merged" });
  } catch (err) {
    const status = err instanceof GitHubApiError ? err.status : 500;
    return NextResponse.json({ error: "merge_failed", status }, { status: 200 });
  }
}
