import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { getGitHubSelection } from "@/lib/integrations/githubSelection";
import { GitHubApiError } from "@/lib/integrations/githubClient";
import { auditSeoFiles } from "@/lib/integrations/fileAudit";

const DESCRIPTIONS: Record<string, string> = {
  "sitemap.xml": "Tells search engines every page on your site",
  "robots.txt": "Tells crawlers what they're allowed to index",
};

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const selection = await getGitHubSelection(user.id);
  if (!selection) {
    return NextResponse.json({ selected: false });
  }

  try {
    const { files } = await auditSeoFiles(selection);
    const reported = files.map((f) => ({
      path: f.path,
      description: DESCRIPTIONS[f.path.split("/").pop() ?? f.path] ?? "",
      status: f.status,
    }));
    return NextResponse.json({
      selected: true,
      repoFullName: selection.repoFullName,
      siteUrl: selection.siteUrl,
      files: reported,
      allPresent: reported.every((f) => f.status === "up_to_date"),
    });
  } catch (err) {
    const status = err instanceof GitHubApiError ? err.status : 500;
    return NextResponse.json({ selected: true, error: "github_api_error", status }, { status: 200 });
  }
}
