"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Tag from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { SketchBox, StatCard, InfoCallout } from "@/components/ui/SketchBox";
import { LoadingTimer, useLoadingTimer } from "@/components/ui/LoadingTimer";

type Severity = "high" | "medium" | "low";
type Finding = {
  id: string;
  ruleId: string;
  category: string;
  severity: Severity;
  url: string;
  evidence: Record<string, unknown>;
};
type Scan = {
  id: string;
  siteUrl: string;
  status: "running" | "complete" | "failed";
  pagesScanned: number;
  truncated: boolean;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  findings: Finding[];
};
type ScanResult = { scan: Scan } | { error: string; message?: string };

type FixPrStatus = {
  exists: boolean;
  number?: number;
  status?: "open" | "closed" | "merged";
  htmlUrl?: string;
  files?: string[];
};
type FixedItem = { url: string; path: string; fields: string[] };
type SkippedItem = { url?: string; brokenUrl?: string; reason: string };
type FixResult =
  | { prNumber: number; prUrl: string; fixed: FixedItem[]; skipped: SkippedItem[] }
  | { error: string; message?: string; skipped?: SkippedItem[] };

type DiffFile = { filename: string; status: string; additions: number; deletions: number; patch: string | null };

const AUTO_FIXABLE_RULES = new Set([
  "CANONICAL_MISSING",
  "TITLE_MISSING",
  "TITLE_DUPLICATE",
  "META_DESCRIPTION_MISSING",
  "META_DESCRIPTION_DUPLICATE",
  "H1_MISSING",
  "BROKEN_INTERNAL_LINK",
]);

const SEVERITY_VARIANT: Record<Severity, "warn" | "pending" | "neutral"> = {
  high: "warn",
  medium: "pending",
  low: "neutral",
};

const RULE_LABELS: Record<string, string> = {
  PAGE_STATUS_ERROR: "Page returns an error status",
  PAGE_UNREACHABLE: "Page could not be reached",
  TITLE_MISSING: "Missing title tag",
  TITLE_DUPLICATE: "Duplicate title tag",
  META_DESCRIPTION_MISSING: "Missing meta description",
  META_DESCRIPTION_DUPLICATE: "Duplicate meta description",
  H1_MISSING: "Missing H1",
  H1_MULTIPLE: "Multiple H1 tags",
  CANONICAL_MISSING: "Missing canonical tag",
  CANONICAL_INVALID: "Invalid canonical URL",
  CANONICAL_TARGET_ERROR: "Canonical target is broken",
  BROKEN_INTERNAL_LINK: "Broken internal link",
};

function evidenceSummary(finding: Finding): string | null {
  const e = finding.evidence;
  if (finding.ruleId === "BROKEN_INTERNAL_LINK" && typeof e.brokenLink === "string") {
    return `Links to ${e.brokenLink}${e.statusCode ? ` (status ${e.statusCode})` : " (unreachable)"}`;
  }
  if ((finding.ruleId === "PAGE_STATUS_ERROR" || finding.ruleId === "CANONICAL_TARGET_ERROR") && e.statusCode) {
    return `Status ${e.statusCode}`;
  }
  if (finding.ruleId === "TITLE_DUPLICATE" && Array.isArray(e.otherUrls) && e.otherUrls.length > 0) {
    return `Same title as ${e.otherUrls.length} other page${e.otherUrls.length > 1 ? "s" : ""}`;
  }
  if (finding.ruleId === "META_DESCRIPTION_DUPLICATE" && Array.isArray(e.otherUrls) && e.otherUrls.length > 0) {
    return `Same description as ${e.otherUrls.length} other page${e.otherUrls.length > 1 ? "s" : ""}`;
  }
  if (finding.ruleId === "H1_MULTIPLE" && typeof e.count === "number") {
    return `${e.count} H1 tags found`;
  }
  if (finding.ruleId === "CANONICAL_INVALID" && typeof e.canonical === "string") {
    return `Canonical value: ${e.canonical}`;
  }
  return null;
}

export default function TechnicalSeoPage() {
  const [url, setUrl] = useState("");
  const [running, setRunning] = useState(false);
  const [scan, setScan] = useState<Scan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [githubRepoConnected, setGithubRepoConnected] = useState(false);
  const [fixPr, setFixPr] = useState<FixPrStatus | null>(null);
  const [fixing, setFixing] = useState(false);
  const [fixResult, setFixResult] = useState<FixResult | null>(null);
  const [prAction, setPrAction] = useState<"merge" | "close" | "delete" | null>(null);
  const scanTimer = useLoadingTimer();
  const fixTimer = useLoadingTimer();
  const prActionTimer = useLoadingTimer();

  useEffect(() => {
    fetch("/api/technical-seo/scan")
      .then((res) => res.json())
      .then((data: { siteUrl: string | null; scan: Scan | null; githubRepoConnected: boolean }) => {
        if (data.siteUrl) setUrl(data.siteUrl);
        if (data.scan) setScan(data.scan);
        setGithubRepoConnected(data.githubRepoConnected);
        if (data.scan) loadFixPrStatus(data.scan.id);
      })
      .catch(() => {});
  }, []);

  function loadFixPrStatus(scanId: string) {
    fetch(`/api/technical-seo/fix?scanId=${scanId}`)
      .then((res) => res.json())
      .then((data: FixPrStatus) => setFixPr(data))
      .catch(() => {});
  }

  async function openFixPr() {
    if (!scan) return;
    setFixing(true);
    fixTimer.start();
    setFixResult(null);
    try {
      const res = await fetch("/api/technical-seo/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId: scan.id }),
      });
      const data: FixResult = await res.json();
      setFixResult(data);
      if ("prNumber" in data) loadFixPrStatus(scan.id);
    } catch {
      setFixResult({ error: "network_error", message: "Couldn't reach the server. Please try again." });
    } finally {
      setFixing(false);
      fixTimer.stop();
    }
  }

  async function actOnFixPr(action: "merge" | "close" | "delete") {
    if (!scan) return;
    if (action === "delete" && !window.confirm("Close the PR (if still open) and delete its branch? This can't be undone.")) {
      return;
    }
    setPrAction(action);
    prActionTimer.start();
    try {
      await fetch(`/api/technical-seo/fix/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId: scan.id }),
      });
      loadFixPrStatus(scan.id);
    } finally {
      setPrAction(null);
      prActionTimer.stop();
    }
  }

  async function runScan(e: React.FormEvent) {
    e.preventDefault();
    await performScan();
  }

  async function rerunScan() {
    await performScan();
  }

  async function performScan() {
    if (!url) return;
    setRunning(true);
    scanTimer.start();
    setError(null);
    setFixPr(null);
    setFixResult(null);
    try {
      const res = await fetch("/api/technical-seo/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data: ScanResult = await res.json();
      if ("error" in data) {
        setError(data.message ?? "Couldn't run the audit. Try again in a moment.");
        return;
      }
      setScan(data.scan);
      loadFixPrStatus(data.scan.id);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setRunning(false);
      scanTimer.stop();
    }
  }

  const counts = scan ? tallyBySeverity(scan.findings) : null;

  return (
    <main className="flex-1 bg-paper">
      <header className="border-b-2 border-ink bg-white">
        <div className="mx-auto max-w-[960px] px-4 sm:px-8 py-6">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Real audit, not mock data</p>
          <h1 className="mt-1 text-2xl font-bold">Technical SEO audit</h1>
        </div>
      </header>

      <div className="mx-auto max-w-[960px] px-4 sm:px-8 py-10">
        <p className="max-w-2xl text-muted">
          Crawls a site (same-origin, up to 40 pages) and runs deterministic technical-SEO checks —
          titles, meta descriptions, headings, canonical tags, and broken internal links. Every
          finding here comes from the actual crawl, not a template.
        </p>

        <SketchBox className="mt-6 p-5">
          <form onSubmit={runScan} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              URL to audit
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://friscoplumbingco.com"
                className="rounded border-2 border-ink px-3.5 py-3 text-sm outline-none focus:border-accent"
              />
            </label>

            {error && (
              <p className="rounded border-2 border-warn bg-warn-soft px-3 py-2 text-sm text-warn">{error}</p>
            )}

            <div className="mt-2 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Button type="submit" disabled={running} className="w-full justify-center sm:w-auto">
                {running ? "Crawling and auditing…" : "Run technical SEO audit →"}
              </Button>
              <LoadingTimer active={running} seconds={scanTimer.seconds} label="Crawling and auditing (up to a minute)" />
            </div>
          </form>
        </SketchBox>

        {scan && scan.status === "complete" && (
          <>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                Audited <span className="font-mono text-ink">{scan.siteUrl}</span> ·{" "}
                {scan.pagesScanned} page{scan.pagesScanned === 1 ? "" : "s"}
                {scan.truncated ? " (crawl cap reached — site may have more pages)" : ""} ·{" "}
                {scan.completedAt ? new Date(scan.completedAt).toLocaleString() : ""}
              </p>
              <div className="flex items-center gap-3">
                <Button type="button" variant="ghost" disabled={running} onClick={rerunScan}>
                  {running ? "Running…" : "Re-run audit ↻"}
                </Button>
                <LoadingTimer active={running} seconds={scanTimer.seconds} label="Running" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <StatCard value={String(counts!.high)} label="High severity" />
              <StatCard value={String(counts!.medium)} label="Medium severity" />
              <StatCard value={String(counts!.low)} label="Low severity" />
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-bold">Findings</h2>
              <SketchBox className="mt-3 p-0">
                {scan.findings.length === 0 && (
                  <p className="p-4 text-sm text-muted">No issues found across the crawled pages.</p>
                )}
                {scan.findings.map((finding, i) => (
                  <div
                    key={finding.id}
                    className={`flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between ${
                      i !== scan.findings.length - 1 ? "border-b border-[#eeece2]" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Tag variant={SEVERITY_VARIANT[finding.severity]}>{finding.severity}</Tag>
                        <span className="font-bold">{RULE_LABELS[finding.ruleId] ?? finding.ruleId}</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted">{finding.url}</p>
                      {evidenceSummary(finding) && (
                        <p className="mt-1 text-sm text-muted">{evidenceSummary(finding)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </SketchBox>
            </div>

            <FixIssuesSection
              scan={scan}
              githubRepoConnected={githubRepoConnected}
              fixPr={fixPr}
              fixing={fixing}
              fixSeconds={fixTimer.seconds}
              fixResult={fixResult}
              prAction={prAction}
              prActionSeconds={prActionTimer.seconds}
              onOpenFixPr={openFixPr}
              onActOnFixPr={actOnFixPr}
            />
          </>
        )}

        {scan && scan.status === "failed" && (
          <p className="mt-8 rounded border-2 border-warn bg-warn-soft px-3 py-2 text-sm text-warn">
            {scan.errorMessage ?? "The last audit run failed."}
          </p>
        )}

        {!scan && !running && (
          <div className="mt-8">
            <InfoCallout>
              Enter a URL above and run an audit — this crawls the real site and evaluates real
              rules, not mock/demo data.
            </InfoCallout>
          </div>
        )}
      </div>
    </main>
  );
}

function tallyBySeverity(findings: Finding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.severity]++;
  return counts;
}

/** Auto-fixable findings become one PR; everything else (things that would need fabricated
 *  content — new page content, invented link targets) stays a human-only recommendation. See
 *  pageMetadataFix.ts and deadLinkFix.ts for exactly what each rule type does and why. */
function FixIssuesSection({
  scan,
  githubRepoConnected,
  fixPr,
  fixing,
  fixSeconds,
  fixResult,
  prAction,
  prActionSeconds,
  onOpenFixPr,
  onActOnFixPr,
}: {
  scan: Scan;
  githubRepoConnected: boolean;
  fixPr: FixPrStatus | null;
  fixing: boolean;
  fixSeconds: number;
  fixResult: FixResult | null;
  prAction: "merge" | "close" | "delete" | null;
  prActionSeconds: number;
  onOpenFixPr: () => void;
  onActOnFixPr: (action: "merge" | "close" | "delete") => void;
}) {
  const fixableCount = scan.findings.filter((f) => AUTO_FIXABLE_RULES.has(f.ruleId)).length;
  if (fixableCount === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold">Fix issues</h2>

      {!githubRepoConnected && (
        <SketchBox className="mt-3 p-5">
          <p className="text-sm text-muted">
            Connect a GitHub repo to let Seovate open a pull request fixing the {fixableCount}{" "}
            issue{fixableCount === 1 ? "" : "s"} below it can safely auto-fix.
          </p>
          <Link
            href="/github/select-repo"
            className="mt-3 inline-flex items-center justify-center gap-2 rounded border-2 border-ink bg-white px-4 py-2 text-sm font-bold text-ink hover:bg-neutral-soft"
          >
            Connect GitHub →
          </Link>
        </SketchBox>
      )}

      {githubRepoConnected && !fixPr?.exists && (
        <SketchBox className="mt-3 p-5">
          <p className="text-sm text-muted">
            Opens one pull request, as one commit, fixing every issue below Seovate can safely
            auto-fix: missing/duplicate titles, meta descriptions, canonical tags and H1s (Next.js
            App Router pages only), and dead internal links (removed, not fabricated — Seovate
            never invents replacement page content). Anything it can&apos;t safely handle is listed
            in the PR instead of guessed at. Nothing is merged without your review.
          </p>
          <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Button type="button" onClick={onOpenFixPr} disabled={fixing}>
              {fixing ? "Opening PR…" : `Open fix PR for ${fixableCount} issue${fixableCount === 1 ? "" : "s"} →`}
            </Button>
            <LoadingTimer active={fixing} seconds={fixSeconds} label="Opening PR" />
          </div>

          {fixResult && "error" in fixResult && (
            <div className="mt-3 rounded border-2 border-warn bg-warn-soft px-3 py-2 text-sm text-warn">
              {fixResult.error === "no_fixable_findings"
                ? "None of these could be safely auto-fixed."
                : (fixResult.message ?? "Couldn't open the fix PR.")}
              {fixResult.skipped && fixResult.skipped.length > 0 && (
                <ul className="mt-2 list-disc pl-5">
                  {fixResult.skipped.map((s, i) => (
                    <li key={i}>
                      {s.url ?? s.brokenUrl} — {s.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {fixResult && "prNumber" in fixResult && (
            <div className="mt-3 text-sm text-muted">
              <p>
                Fixed {fixResult.fixed.length} item{fixResult.fixed.length === 1 ? "" : "s"}
                {fixResult.skipped.length > 0
                  ? `, ${fixResult.skipped.length} needs a manual look (see the PR description)`
                  : ""}
                .
              </p>
            </div>
          )}
        </SketchBox>
      )}

      {githubRepoConnected && fixPr?.exists && (
        <SketchBox className="mt-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Tag variant={fixPr.status === "merged" ? "success" : fixPr.status === "closed" ? "neutral" : "pending"}>
              {fixPr.status}
            </Tag>
            <span className="font-bold">PR #{fixPr.number}</span>
            <a href={fixPr.htmlUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-accent">
              View on GitHub ↗
            </a>
          </div>
          {fixPr.files && fixPr.files.length > 0 && (
            <p className="mt-2 text-sm text-muted">Changes {fixPr.files.length} file{fixPr.files.length === 1 ? "" : "s"}.</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {fixPr.status === "open" && (
              <>
                <Button type="button" disabled={prAction !== null} onClick={() => onActOnFixPr("merge")}>
                  {prAction === "merge" ? "Merging…" : "Merge"}
                </Button>
                <Button type="button" variant="ghost" disabled={prAction !== null} onClick={() => onActOnFixPr("close")}>
                  {prAction === "close" ? "Closing…" : "Close"}
                </Button>
              </>
            )}
            <Button type="button" variant="ghost" disabled={prAction !== null} onClick={() => onActOnFixPr("delete")}>
              {prAction === "delete" ? "Deleting…" : "Delete"}
            </Button>
            <LoadingTimer
              active={prAction !== null}
              seconds={prActionSeconds}
              label={prAction === "merge" ? "Merging" : prAction === "close" ? "Closing" : "Deleting"}
            />
          </div>

          <DiffViewer scanId={scan.id} />
        </SketchBox>
      )}
    </div>
  );
}

/** Fetches and renders the fix PR's unified diffs inline, so changes can be reviewed without
 *  leaving Seovate. Loaded on demand (not on every scan/PR-status poll) since it's only useful
 *  once someone actually wants to look. */
function DiffViewer({ scanId }: { scanId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<DiffFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const diffTimer = useLoadingTimer();

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (files || loading) return;
    setLoading(true);
    diffTimer.start();
    setError(null);
    try {
      const res = await fetch(`/api/technical-seo/fix/diff?scanId=${scanId}`);
      const data = await res.json();
      if (data.error) {
        setError("Couldn't load the diff from GitHub.");
        return;
      }
      setFiles(data.files);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setLoading(false);
      diffTimer.stop();
    }
  }

  return (
    <div className="mt-4 border-t border-[#eeece2] pt-4">
      <button type="button" onClick={toggle} className="text-sm font-bold text-accent">
        {open ? "Hide changes ▲" : "Review changes ▼"}
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-4">
          <LoadingTimer active={loading} seconds={diffTimer.seconds} label="Loading diff" />
          {error && <p className="text-sm text-warn">{error}</p>}
          {files?.map((f) => (
            <div key={f.filename} className="overflow-hidden rounded border-2 border-ink">
              <div className="flex items-center justify-between bg-neutral-soft px-3 py-1.5 text-xs font-bold">
                <span className="font-mono">{f.filename}</span>
                <span className="text-muted">
                  <span className="text-accent">+{f.additions}</span> <span className="text-warn">-{f.deletions}</span>
                </span>
              </div>
              {f.patch ? (
                <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
                  {f.patch.split("\n").map((line, i) => (
                    <div
                      key={i}
                      className={
                        line.startsWith("+") && !line.startsWith("+++")
                          ? "bg-accent-soft text-accent"
                          : line.startsWith("-") && !line.startsWith("---")
                            ? "bg-warn-soft text-warn"
                            : line.startsWith("@@")
                              ? "text-muted"
                              : ""
                      }
                    >
                      {line || " "}
                    </div>
                  ))}
                </pre>
              ) : (
                <p className="p-3 text-xs text-muted">No inline diff available for this file.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
