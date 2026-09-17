import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { getGitHubSelection } from "@/lib/integrations/githubSelection";
import {
  getFileContent,
  getRef,
  getRepoTree,
  createBranch,
  createOrUpdateFile,
  createPullRequest,
  getRepo,
  GitHubApiError,
} from "@/lib/integrations/githubClient";
import { crawlSite, verifyUrlsLive } from "@/lib/integrations/siteCrawler";
import {
  deriveDisallowRules,
  derivePagesFromRepo,
  generateRobotsTxt,
  generateSitemapXml,
} from "@/lib/integrations/seoFiles";
import { prisma } from "@/lib/prisma";

type MissingFile = { path: string; content: string };
type AuditStats = { crawledPages: number; repoPages: number; totalPages: number; repoTruncated: boolean };

async function buildMissingFiles(selection: {
  accessToken: string;
  repoFullName: string;
  siteUrl: string | null;
}): Promise<{ missing: MissingFile[]; stats: AuditStats }> {
  if (!selection.siteUrl) throw new Error("No site URL configured to audit.");

  const [sitemap, robots, repo] = await Promise.all([
    getFileContent(selection.accessToken, selection.repoFullName, "sitemap.xml"),
    getFileContent(selection.accessToken, selection.repoFullName, "robots.txt"),
    getRepo(selection.accessToken, selection.repoFullName),
  ]);

  const missing: MissingFile[] = [];
  const stats: AuditStats = { crawledPages: 0, repoPages: 0, totalPages: 0, repoTruncated: false };

  if (!sitemap || !robots) {
    const origin = new URL(selection.siteUrl).origin;

    const [crawledUrls, tree] = await Promise.all([
      crawlSite(selection.siteUrl),
      getRepoTree(selection.accessToken, selection.repoFullName, repo.default_branch),
    ]);

    const repoRoutes = derivePagesFromRepo(tree.entries);
    const crawledSet = new Set(crawledUrls);
    const repoUrlCandidates = repoRoutes
      .map((route) => new URL(route, origin).toString())
      .filter((url) => !crawledSet.has(url));

    // Repo-derived routes are guesses from file names/conventions — confirm each one actually
    // resolves live before trusting it, so unused template/demo/draft pages in the repo don't end
    // up as broken URLs in the sitemap. Crawled URLs are already known-live (the crawler only
    // followed links it found on pages that returned 200).
    const verifiedRepoUrls = await verifyUrlsLive(repoUrlCandidates);

    const allUrls = Array.from(new Set([...crawledUrls, ...verifiedRepoUrls]));
    stats.crawledPages = crawledUrls.length;
    stats.repoPages = verifiedRepoUrls.length;
    stats.totalPages = allUrls.length;
    stats.repoTruncated = tree.truncated;

    if (!sitemap) missing.push({ path: "sitemap.xml", content: generateSitemapXml(allUrls) });
    if (!robots) {
      const disallowRules = deriveDisallowRules(tree.entries);
      missing.push({ path: "robots.txt", content: generateRobotsTxt(selection.siteUrl, disallowRules) });
    }
  }

  return { missing, stats };
}

/** Dry-run preview: audits the live site AND the repo's own file structure, and returns the file
 *  contents Seovate would add, without touching the repo. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const selection = await getGitHubSelection(user.id);
  if (!selection) return NextResponse.json({ error: "No repo selected." }, { status: 400 });

  try {
    const { missing, stats } = await buildMissingFiles(selection);
    return NextResponse.json({ missing, stats, allPresent: missing.length === 0 });
  } catch (err) {
    const status = err instanceof GitHubApiError ? err.status : 500;
    return NextResponse.json({ error: "generate_failed", status }, { status: 200 });
  }
}

/** Creates a branch, commits the missing files, and opens a real pull request. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const selection = await getGitHubSelection(user.id);
  if (!selection) return NextResponse.json({ error: "No repo selected." }, { status: 400 });

  try {
    const { missing } = await buildMissingFiles(selection);
    if (missing.length === 0) {
      return NextResponse.json({ error: "Nothing to generate — both files already exist." }, { status: 400 });
    }

    const repo = await getRepo(selection.accessToken, selection.repoFullName);
    const baseBranch = repo.default_branch;
    const branchName = `seovate/seo-scaffolding-${Date.now()}`;
    const baseSha = await getRef(selection.accessToken, selection.repoFullName, baseBranch);
    await createBranch(selection.accessToken, selection.repoFullName, branchName, baseSha);

    for (const file of missing) {
      await createOrUpdateFile(
        selection.accessToken,
        selection.repoFullName,
        file.path,
        file.content,
        `Add ${file.path} (Seovate SEO scaffolding)`,
        branchName
      );
    }

    const pr = await createPullRequest(
      selection.accessToken,
      selection.repoFullName,
      `Add ${missing.map((f) => f.path).join(" and ")}`,
      "Opened automatically by Seovate after auditing both the live site and this repo's file structure — adds the missing SEO scaffolding files listed in the title. Nothing is merged until you approve it, here or on GitHub.",
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
