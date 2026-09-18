import { getFileContent, getRepo, getRepoTree } from "@/lib/integrations/githubClient";
import { crawlSite, verifyUrlsLive } from "@/lib/integrations/siteCrawler";
import {
  deriveDisallowRules,
  derivePagesFromRepo,
  detectStaticAssetDir,
  generateRobotsTxt,
  generateSitemapXml,
  robotsNeedsUpdate,
  sitemapNeedsUpdate,
} from "@/lib/integrations/seoFiles";

export type FileAuditStatus = "missing" | "outdated" | "up_to_date";
export type FileAuditEntry = { path: string; status: FileAuditStatus; content: string | null; sha: string | null };
export type AuditStats = { crawledPages: number; repoPages: number; totalPages: number; repoTruncated: boolean };

/**
 * Audits both sitemap.xml and robots.txt against the live site and the repo's own file structure —
 * every time, not just when a file is missing, so a page added or removed since the last PR shows
 * up as "outdated" instead of silently going stale. Shared by the presence-check (repo-scan) and
 * the dry-run/apply (consent + generate) routes so they can never disagree on what's out of date.
 *
 * Files are placed under `public/` for Next.js (or any repo that already has a `public/` dir) —
 * anywhere else and the framework never actually serves them, which 404s live even after a
 * successful merge.
 */
export async function auditSeoFiles(selection: {
  accessToken: string;
  repoFullName: string;
  siteUrl: string | null;
}): Promise<{ files: FileAuditEntry[]; stats: AuditStats }> {
  if (!selection.siteUrl) throw new Error("No site URL configured to audit.");
  const siteUrl = selection.siteUrl;

  const repo = await getRepo(selection.accessToken, selection.repoFullName);
  const [tree, crawledUrls] = await Promise.all([
    getRepoTree(selection.accessToken, selection.repoFullName, repo.default_branch),
    crawlSite(siteUrl),
  ]);

  const dir = detectStaticAssetDir(tree.entries);
  const sitemapPath = `${dir}sitemap.xml`;
  const robotsPath = `${dir}robots.txt`;

  const [sitemap, robots] = await Promise.all([
    getFileContent(selection.accessToken, selection.repoFullName, sitemapPath),
    getFileContent(selection.accessToken, selection.repoFullName, robotsPath),
  ]);

  const origin = new URL(siteUrl).origin;
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
  const disallowRules = deriveDisallowRules(tree.entries);

  const stats: AuditStats = {
    crawledPages: crawledUrls.length,
    repoPages: verifiedRepoUrls.length,
    totalPages: allUrls.length,
    repoTruncated: tree.truncated,
  };

  const files: FileAuditEntry[] = [];

  if (!sitemap) {
    files.push({ path: sitemapPath, status: "missing", content: generateSitemapXml(allUrls), sha: null });
  } else if (sitemapNeedsUpdate(sitemap.content, allUrls)) {
    files.push({ path: sitemapPath, status: "outdated", content: generateSitemapXml(allUrls), sha: sitemap.sha });
  } else {
    files.push({ path: sitemapPath, status: "up_to_date", content: null, sha: sitemap.sha });
  }

  if (!robots) {
    files.push({
      path: robotsPath,
      status: "missing",
      content: generateRobotsTxt(siteUrl, disallowRules),
      sha: null,
    });
  } else if (robotsNeedsUpdate(robots.content, disallowRules)) {
    files.push({
      path: robotsPath,
      status: "outdated",
      content: generateRobotsTxt(siteUrl, disallowRules),
      sha: robots.sha,
    });
  } else {
    files.push({ path: robotsPath, status: "up_to_date", content: null, sha: robots.sha });
  }

  return { files, stats };
}
