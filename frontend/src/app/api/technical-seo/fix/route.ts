import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { getGitHubSelection } from "@/lib/integrations/githubSelection";
import { prisma } from "@/lib/prisma";
import { planPageFixes, titleFromSlug, descriptionFromTitle, type DesiredPageFixes } from "@/lib/integrations/pageMetadataFix";
import { planDeadLinkRemovals, removeLinksTo } from "@/lib/integrations/deadLinkFix";
import { findSyntaxErrors } from "@/lib/integrations/codeValidation";
import {
  getRepo,
  getRef,
  createBranch,
  commitFiles,
  createPullRequest,
  getPullRequest,
  listPullRequestFiles,
  GitHubApiError,
} from "@/lib/integrations/githubClient";

export const maxDuration = 60;

/** Status of the fix PR for a given scan, if one has been opened. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  const scanId = req.nextUrl.searchParams.get("scanId");
  if (!scanId) return NextResponse.json({ error: "missing_scan_id" }, { status: 400 });

  const scan = await prisma.technicalSeoScan.findFirst({ where: { id: scanId, userId: user.id } });
  if (!scan || !scan.fixPrNumber || !scan.fixPrRepoFullName) {
    return NextResponse.json({ exists: false });
  }

  const selection = await getGitHubSelection(user.id);
  if (!selection) return NextResponse.json({ exists: false });

  try {
    const [pr, files] = await Promise.all([
      getPullRequest(selection.accessToken, scan.fixPrRepoFullName, scan.fixPrNumber),
      listPullRequestFiles(selection.accessToken, scan.fixPrRepoFullName, scan.fixPrNumber),
    ]);
    const status = pr.merged ? "merged" : pr.state === "closed" ? "closed" : "open";
    return NextResponse.json({
      exists: true,
      number: pr.number,
      status,
      htmlUrl: pr.html_url,
      repoFullName: scan.fixPrRepoFullName,
      base: pr.base.ref,
      head: pr.head.ref,
      files: files.map((f) => f.filename),
    });
  } catch (err) {
    const status = err instanceof GitHubApiError ? err.status : 500;
    return NextResponse.json({ exists: false, error: "github_api_error", status });
  }
}

const AUTO_FIXABLE_RULES = new Set([
  "CANONICAL_MISSING",
  "TITLE_MISSING",
  "TITLE_DUPLICATE",
  "META_DESCRIPTION_MISSING",
  "META_DESCRIPTION_DUPLICATE",
  "H1_MISSING",
]);

/** Opens one PR, as one commit, addressing every finding this pipeline can safely auto-fix:
 *  missing/duplicate titles and meta descriptions, missing canonical tags, missing H1s (all via
 *  pageMetadataFix.ts), and dead internal links (via deadLinkFix.ts, which removes the link
 *  rather than fabricating the missing page — see that file for why). Everything else stays a
 *  human-only recommendation. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const scanId = typeof body.scanId === "string" ? body.scanId : null;
  if (!scanId) return NextResponse.json({ error: "missing_scan_id" }, { status: 400 });

  const scan = await prisma.technicalSeoScan.findFirst({
    where: { id: scanId, userId: user.id },
    include: { findings: true },
  });
  if (!scan) return NextResponse.json({ error: "scan_not_found" }, { status: 404 });

  const selection = await getGitHubSelection(user.id);
  if (!selection) return NextResponse.json({ error: "github_not_connected" }, { status: 200 });

  const desiredByUrl = new Map<string, DesiredPageFixes>();
  const brokenUrls = new Set<string>();

  for (const finding of scan.findings) {
    if (!AUTO_FIXABLE_RULES.has(finding.ruleId) && finding.ruleId !== "BROKEN_INTERNAL_LINK") continue;

    if (finding.ruleId === "BROKEN_INTERNAL_LINK") {
      const evidence = finding.evidence as Record<string, unknown>;
      if (typeof evidence.brokenLink === "string") brokenUrls.add(evidence.brokenLink);
      continue;
    }

    let pathname: string;
    try {
      pathname = new URL(finding.url).pathname;
    } catch {
      continue;
    }
    const desired = desiredByUrl.get(finding.url) ?? {};
    const title = titleFromSlug(pathname);

    switch (finding.ruleId) {
      case "CANONICAL_MISSING":
        desired.canonical = finding.url;
        break;
      case "TITLE_MISSING":
        desired.title = { mode: "insertIfMissing", value: title };
        break;
      case "TITLE_DUPLICATE":
        desired.title = { mode: "replaceExisting", value: title };
        break;
      case "META_DESCRIPTION_MISSING":
        desired.description = { mode: "insertIfMissing", value: descriptionFromTitle(title) };
        break;
      case "META_DESCRIPTION_DUPLICATE":
        desired.description = { mode: "replaceExisting", value: descriptionFromTitle(title) };
        break;
      case "H1_MISSING":
        desired.h1 = title;
        break;
    }
    desiredByUrl.set(finding.url, desired);
  }

  if (desiredByUrl.size === 0 && brokenUrls.size === 0) {
    return NextResponse.json({ error: "no_fixable_findings" }, { status: 200 });
  }

  try {
    const repo = await getRepo(selection.accessToken, selection.repoFullName);

    const [{ targets: metadataTargets, skipped: metadataSkipped }, { targets: linkTargets, skipped: linkSkipped }] =
      await Promise.all([
        planPageFixes(selection.accessToken, selection.repoFullName, repo.default_branch, desiredByUrl),
        brokenUrls.size > 0
          ? planDeadLinkRemovals(selection.accessToken, selection.repoFullName, repo.default_branch, [...brokenUrls])
          : Promise.resolve({ targets: [], skipped: [] }),
      ]);

    // A dead link and a metadata fix can both target the same file (e.g. a page whose own source
    // renders the dead link directly, not via a separate shared component). Both planners start
    // from the same pre-fix content, so when that happens, re-run the (pure, no-network) link
    // removal against the metadata-patched text instead of picking just one of the two changes.
    const filesByPath = new Map<string, string>();
    for (const t of metadataTargets) filesByPath.set(t.path, t.newContent);
    for (const t of linkTargets) {
      const existing = filesByPath.get(t.path);
      if (existing === undefined) {
        filesByPath.set(t.path, t.newContent);
        continue;
      }
      const pathname = new URL(t.brokenUrl).pathname;
      const reapplied = removeLinksTo(existing, pathname);
      filesByPath.set(t.path, reapplied.removedCount > 0 ? reapplied.content : existing);
    }

    // Quality gate: never commit a file that doesn't even parse as valid syntax. This can't catch
    // everything (it has no project context, so a cross-file type error like an inferred `never[]`
    // slips through — that's what the required post-merge deploy check below is for), but it's a
    // real, cheap backstop against a string-splicing edit producing outright malformed output, and
    // it runs with zero code execution (see codeValidation.ts for why that matters here).
    const syntaxSkipped: { path: string; reasons: string[] }[] = [];
    for (const [path, content] of filesByPath) {
      const errors = findSyntaxErrors(content, path);
      if (errors.length > 0) {
        syntaxSkipped.push({ path, reasons: errors });
        filesByPath.delete(path);
      }
    }
    const invalidPaths = new Set(syntaxSkipped.map((s) => s.path));
    const validMetadataTargets = metadataTargets.filter((t) => !invalidPaths.has(t.path));
    const validLinkTargets = linkTargets.filter((t) => !invalidPaths.has(t.path));
    const syntaxSkippedFindings = syntaxSkipped.map((s) => ({
      url: s.path,
      reason: `Generated edit failed a syntax check, so it was left out of the PR: ${s.reasons[0]}`,
    }));

    if (filesByPath.size === 0) {
      return NextResponse.json(
        { error: "no_fixable_findings", skipped: [...metadataSkipped, ...linkSkipped, ...syntaxSkippedFindings] },
        { status: 200 }
      );
    }

    const baseSha = await getRef(selection.accessToken, selection.repoFullName, repo.default_branch);
    const branch = `seovate/auto-fixes-${scan.id.slice(-8)}-${Date.now()}`;
    await createBranch(selection.accessToken, selection.repoFullName, branch, baseSha);

    const files = [...filesByPath.entries()].map(([path, content]) => ({ path, content }));
    await commitFiles(
      selection.accessToken,
      selection.repoFullName,
      branch,
      `Seovate: auto-fix ${files.length} file${files.length === 1 ? "" : "s"} from technical-SEO audit`,
      files
    );

    const bodyLines = [
      `Automated fixes from Seovate's technical-SEO audit — ${files.length} file${files.length === 1 ? "" : "s"} changed, one commit.`,
      "",
      "**Fixed:**",
      ...validMetadataTargets.map((t) => `- \`${t.path}\` (${t.url}) — ${t.fixedFields.join(", ")}`),
      ...validLinkTargets.map((t) => `- \`${t.path}\` — removed ${t.occurrences} dead link${t.occurrences === 1 ? "" : "s"} to ${t.brokenUrl}`),
    ];
    const allSkipped = [...metadataSkipped, ...linkSkipped, ...syntaxSkippedFindings];
    if (allSkipped.length > 0) {
      bodyLines.push(
        "",
        "**Not fixed automatically (needs a human look):**",
        ...metadataSkipped.map((s) => `- ${s.url} — ${s.reason}`),
        ...linkSkipped.map((s) => `- ${s.brokenUrl} — ${s.reason}`),
        ...syntaxSkippedFindings.map((s) => `- ${s.url} — ${s.reason}`)
      );
    }
    bodyLines.push(
      "",
      "_Generated titles/descriptions are deterministic placeholders derived from each page's own URL — worth a human pass before treating them as final copy._"
    );

    const pr = await createPullRequest(
      selection.accessToken,
      selection.repoFullName,
      `Seovate: auto-fix ${files.length} file${files.length === 1 ? "" : "s"} from technical-SEO audit`,
      bodyLines.join("\n"),
      branch,
      repo.default_branch
    );

    await prisma.technicalSeoScan.update({
      where: { id: scan.id },
      data: { fixPrNumber: pr.number, fixPrRepoFullName: selection.repoFullName },
    });

    return NextResponse.json({
      prNumber: pr.number,
      prUrl: pr.html_url,
      fixed: [
        ...validMetadataTargets.map((t) => ({ url: t.url, path: t.path, fields: t.fixedFields })),
        ...validLinkTargets.map((t) => ({ url: t.brokenUrl, path: t.path, fields: ["removed dead link"] })),
      ],
      skipped: allSkipped,
    });
  } catch (err) {
    console.error("Auto-fix PR failed:", err);
    const status = err instanceof GitHubApiError ? err.status : 500;
    return NextResponse.json({ error: "fix_failed", message: "Couldn't open the fix PR.", status }, { status: 200 });
  }
}
