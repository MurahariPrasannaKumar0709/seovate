import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { getGitHubSelection } from "@/lib/integrations/githubSelection";
import { getFileContent, GitHubApiError } from "@/lib/integrations/githubClient";

const EXPECTED_FILES = [
  { path: "sitemap.xml", description: "Tells search engines every page on your site" },
  { path: "robots.txt", description: "Tells crawlers what they're allowed to index" },
];

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const selection = await getGitHubSelection(user.id);
  if (!selection) {
    return NextResponse.json({ selected: false });
  }

  try {
    const files = await Promise.all(
      EXPECTED_FILES.map(async (f) => {
        const existing = await getFileContent(selection.accessToken, selection.repoFullName, f.path);
        return { path: f.path, description: f.description, present: existing !== null };
      })
    );
    return NextResponse.json({
      selected: true,
      repoFullName: selection.repoFullName,
      siteUrl: selection.siteUrl,
      files,
      allPresent: files.every((f) => f.present),
    });
  } catch (err) {
    const status = err instanceof GitHubApiError ? err.status : 500;
    return NextResponse.json({ selected: true, error: "github_api_error", status }, { status: 200 });
  }
}
