import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { getGitHubAccessToken } from "@/lib/integrations/githubClient";
import { listUserRepos, GitHubApiError } from "@/lib/integrations/githubClient";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const token = await getGitHubAccessToken(user.id);
  if (!token) return NextResponse.json({ connected: false, repos: [] });

  try {
    const repos = await listUserRepos(token);
    return NextResponse.json({
      connected: true,
      repos: repos.map((r) => ({
        fullName: r.full_name,
        defaultBranch: r.default_branch,
        private: r.private,
        htmlUrl: r.html_url,
      })),
    });
  } catch (err) {
    const status = err instanceof GitHubApiError ? err.status : 500;
    return NextResponse.json({ connected: true, repos: [], error: "github_api_error", status });
  }
}
