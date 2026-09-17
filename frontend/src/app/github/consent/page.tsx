"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Tag from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { SketchBox, InfoCallout } from "@/components/ui/SketchBox";

type MissingFile = { path: string; content: string };
type AuditStats = { crawledPages: number; repoPages: number; totalPages: number; repoTruncated: boolean };
type PreviewResponse =
  | { error: string; status?: number }
  | { missing: MissingFile[]; stats: AuditStats; allPresent: boolean };

export default function GitHubConsentPage() {
  const router = useRouter();
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/github/generate")
      .then((res) => res.json())
      .then(setPreview)
      .catch(() => setPreview({ error: "generate_failed" }));
  }, []);

  async function handleApprove() {
    setApproving(true);
    setError(null);
    try {
      const res = await fetch("/api/github/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError("Couldn't open the pull request on GitHub. Please try again.");
        return;
      }
      router.push("/github/pull-request");
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setApproving(false);
    }
  }

  if (!preview) {
    return (
      <main className="flex-1 bg-paper px-8 py-12">
        <p className="text-sm text-muted">Auditing your site…</p>
      </main>
    );
  }

  if ("error" in preview) {
    return (
      <main className="flex-1 bg-paper px-8 py-12">
        <div className="mx-auto max-w-[640px]">
          <Link href="/github/repo-scan" className="text-sm font-bold text-muted hover:text-ink">
            ← Back
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Review changes</h1>
          <div className="mt-6">
            <InfoCallout>Couldn&apos;t audit the site or reach GitHub. Try again in a moment.</InfoCallout>
          </div>
        </div>
      </main>
    );
  }

  if (preview.allPresent) {
    return (
      <main className="flex-1 bg-paper px-8 py-12">
        <div className="mx-auto max-w-[640px]">
          <Link href="/github/repo-scan" className="text-sm font-bold text-muted hover:text-ink">
            ← Back
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Nothing to change</h1>
          <div className="mt-6">
            <InfoCallout>sitemap.xml and robots.txt are both already present in the repo.</InfoCallout>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-paper px-8 py-12">
      <div className="mx-auto max-w-[760px]">
        <Link href="/github/repo-scan" className="text-sm font-bold text-muted hover:text-ink">
          ← Back
        </Link>
        <div className="mt-4">
          <Tag variant="success">Requires your approval</Tag>
        </div>
        <h1 className="mt-4 text-[28px] font-bold">
          Seovate wants to add {preview.missing.length} file{preview.missing.length === 1 ? "" : "s"}
        </h1>
        <p className="mt-3 text-muted">
          This is different from routine SEO fixes, which Seovate makes automatically. New or
          restructured files in your repository always go through a pull request — Seovate will
          never commit directly to your codebase.
        </p>
        <p className="mt-2 text-muted">
          Generated from {preview.stats.totalPages} page{preview.stats.totalPages === 1 ? "" : "s"} total —{" "}
          {preview.stats.crawledPages} found crawling your live site
          {preview.stats.repoPages > 0 &&
            ` and ${preview.stats.repoPages} more found in the repo's own routes/pages (not yet linked anywhere the crawler could reach)`}
          . Review the content below, then approve to open the pull request.
        </p>
        {preview.stats.repoTruncated && (
          <p className="mt-2 text-sm text-warn">
            This repo&apos;s file tree is large enough that GitHub truncated the listing — some
            repo-only pages may not have been found.
          </p>
        )}

        <div className="mt-8 flex flex-col gap-6">
          {preview.missing.map((change) => (
            <SketchBox key={change.path} className="p-5">
              <div className="flex items-center gap-3">
                <input type="checkbox" defaultChecked readOnly className="h-4 w-4" />
                <span className="font-mono text-sm font-bold">{change.path}</span>
                <Tag variant="success">New file</Tag>
              </div>
              <pre className="mt-3 max-h-64 overflow-auto rounded bg-ink p-4 font-mono text-[13px] leading-relaxed text-[#7ec99a]">
                {change.content}
              </pre>
            </SketchBox>
          ))}
        </div>

        {error && (
          <p className="mt-6 rounded border-2 border-warn bg-warn-soft px-3 py-2 text-sm text-warn">{error}</p>
        )}

        <div className="mt-6">
          <InfoCallout>
            Opening this pull request does not change your live site. You can merge it right here
            in Seovate once it&apos;s open, or review and merge it yourself on GitHub — whichever
            you prefer.
          </InfoCallout>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" type="button" onClick={() => router.push("/github/repo-scan")}>
            Not now
          </Button>
          <Button type="button" disabled={approving} onClick={handleApprove}>
            {approving ? "Opening…" : "Open pull request →"}
          </Button>
        </div>
      </div>
    </main>
  );
}
