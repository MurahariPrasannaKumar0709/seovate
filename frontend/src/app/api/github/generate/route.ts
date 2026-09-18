import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { getGitHubSelection } from "@/lib/integrations/githubSelection";
import {
  getRef,
  createBranch,
  createOrUpdateFile,
  createPullRequest,
  getRepo,
  GitHubApiError,
} from "@/lib/integrations/githubClient";
import { auditSeoFiles, type FileAuditEntry } from "@/lib/integrations/fileAudit";
import { prisma } from "@/lib/prisma";

/** Dry-run preview: audits the live site AND the repo's own file structure, and returns the file
 *  contents Seovate would add or update, without touching the repo. Existing files whose content
 *  still matches the audit (nothing added/removed since the last PR) are left out — only
 *  missing/outdated files are reported as changes. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const selection = await getGitHubSelection(user.id);
  if (!selection) return NextResponse.json({ error: "No repo selected." }, { status: 400 });

  try {
    const { files, stats } = await auditSeoFiles(selection);
    const changes = files.filter((f) => f.status !== "up_to_date");
    return NextResponse.json({ changes, stats, allPresent: changes.length === 0 });
  } catch (err) {
    const status = err instanceof GitHubApiError ? err.status : 500;
    return NextResponse.json({ error: "generate_failed", status }, { status: 200 });
  }
}

/** Creates a branch, commits the missing/outdated files, and opens a real pull request. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const selection = await getGitHubSelection(user.id);
  if (!selection) return NextResponse.json({ error: "No repo selected." }, { status: 400 });

  try {
    const { files } = await auditSeoFiles(selection);
    const changes: FileAuditEntry[] = files.filter((f) => f.status !== "up_to_date");
    if (changes.length === 0) {
      return NextResponse.json(
        { error: "Nothing to generate — sitemap.xml and robots.txt are both already up to date." },
        { status: 400 }
      );
    }

    const repo = await getRepo(selection.accessToken, selection.repoFullName);
    const baseBranch = repo.default_branch;
    const branchName = `seovate/seo-scaffolding-${Date.now()}`;
    const baseSha = await getRef(selection.accessToken, selection.repoFullName, baseBranch);
    await createBranch(selection.accessToken, selection.repoFullName, branchName, baseSha);

    for (const file of changes) {
      const verb = file.status === "missing" ? "Add" : "Update";
      await createOrUpdateFile(
        selection.accessToken,
        selection.repoFullName,
        file.path,
        file.content!,
        `${verb} ${file.path} (Seovate SEO scaffolding)`,
        branchName,
        file.sha ?? undefined
      );
    }

    const added = changes.filter((f) => f.status === "missing").map((f) => f.path);
    const updated = changes.filter((f) => f.status === "outdated").map((f) => f.path);
    const titleParts = [
      added.length > 0 ? `Add ${added.join(" and ")}` : null,
      updated.length > 0 ? `Update ${updated.join(" and ")}` : null,
    ].filter(Boolean);

    const pr = await createPullRequest(
      selection.accessToken,
      selection.repoFullName,
      titleParts.join(", "),
      "Opened automatically by Seovate after auditing both the live site and this repo's file structure — adds or updates the SEO scaffolding files listed in the title to match what's actually live. Nothing is merged until you approve it, here or on GitHub.",
      branchName,
      baseBranch
    );

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: user.id, provider: "github" } },
    });
    if (integration) {
      await prisma.integration.update({ where: { id: integration.id }, data: { lastPrNumber: pr.number } });
    }

    return NextResponse.json({ prNumber: pr.number, htmlUrl: pr.html_url });
  } catch (err) {
    const status = err instanceof GitHubApiError ? err.status : 500;
    return NextResponse.json({ error: "generate_failed", status }, { status: 200 });
  }
}
