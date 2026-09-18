"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import Tag from "@/components/ui/Tag";
import { Button, LinkButton } from "@/components/ui/Button";
import { SketchBox, InfoCallout } from "@/components/ui/SketchBox";

type PrFile = { path: string; additions: number; deletions: number };
type PrResponse =
  | { exists: false }
  | { exists: true; error: string; status?: number }
  | {
      exists: true;
      number: number;
      status: "open" | "merged" | "closed";
      htmlUrl: string;
      title: string;
      repoFullName: string;
      head: string;
      base: string;
      files: PrFile[];
    };

export default function GitHubPullRequestPage() {
  const [data, setData] = useState<PrResponse | null>(null);
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/github/pull-request")
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData({ exists: false }));
  }, []);

  async function runAction(path: "merge" | "close") {
    setUpdating(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/github/pull-request/${path}`, { method: "POST" });
      const result = await res.json();
      if (!res.ok || result.error) {
        setActionError(
          path === "merge"
            ? "Couldn't merge on GitHub — it may need a review, or a check may be failing. Try on GitHub directly."
            : "Couldn't close the pull request on GitHub."
        );
        return;
      }
      setData((prev) => (prev && prev.exists && !("error" in prev) ? { ...prev, status: result.status } : prev));
    } catch {
      setActionError("Couldn't reach the server. Please try again.");
    } finally {
      setUpdating(false);
    }
  }

  if (!data) {
    return (
      <main className="flex-1 bg-paper px-4 sm:px-8 py-12">
        <p className="text-sm text-muted">Loading pull request…</p>
      </main>
    );
  }

  if (!data.exists) {
    return (
      <main className="flex-1 bg-paper px-4 sm:px-8 py-12">
        <div className="mx-auto max-w-[640px]">
          <Link href="/github/repo-scan" className="text-sm font-bold text-muted hover:text-ink">
            ← Back
          </Link>
          <h1 className="mt-4 text-2xl font-bold">No pull request yet</h1>
          <div className="mt-6">
            <InfoCallout>Seovate hasn&apos;t opened a scaffolding pull request yet.</InfoCallout>
          </div>
          <div className="mt-6">
            <LinkButton href="/github/repo-scan">Scan the repository →</LinkButton>
          </div>
        </div>
      </main>
    );
  }

  if ("error" in data) {
    return (
      <main className="flex-1 bg-paper px-4 sm:px-8 py-12">
        <div className="mx-auto max-w-[640px]">
          <Link href="/github/repo-scan" className="text-sm font-bold text-muted hover:text-ink">
            ← Back
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Pull request</h1>
          <div className="mt-6">
            <InfoCallout>Couldn&apos;t load the pull request from GitHub right now.</InfoCallout>
          </div>
        </div>
      </main>
    );
  }

  const { status } = data;

  return (
    <main className="flex-1 bg-paper px-4 sm:px-8 py-12">
      <div className="mx-auto max-w-[800px]">
        <Link href="/github/repo-scan" className="text-sm font-bold text-muted hover:text-ink">
          ← Back
        </Link>
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-muted">
          <Logo size={20} /> opened a pull request on <span className="font-mono">{data.repoFullName}</span>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Tag variant={status === "merged" ? "success" : status === "closed" ? "neutral" : "success"}>
              {status === "merged" ? "Merged" : status === "closed" ? "Closed" : "Open"}
            </Tag>
            <h1 className="mt-3 text-2xl font-bold">{data.title}</h1>
            <p className="mt-2 text-sm text-muted">
              <span className="font-bold">Seovate</span> wants to merge {data.files.length} file
              {data.files.length === 1 ? "" : "s"} into <span className="font-mono">{data.base}</span> from{" "}
              <span className="font-mono">{data.head}</span> · #{data.number}
            </p>
          </div>
          <a
            href={data.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center rounded border-2 border-ink bg-white px-4 py-2 text-sm font-bold hover:bg-neutral-soft"
          >
            View on GitHub ↗
          </a>
        </div>

        <h2 className="mt-8 font-bold">
          Files changed ({data.files.length})
        </h2>
        <SketchBox className="mt-3 p-0">
          {data.files.map((f, i) => (
            <div
              key={f.path}
              className={`flex items-center justify-between gap-3 p-4 ${
                i !== data.files.length - 1 ? "border-b border-[#eeece2]" : ""
              }`}
            >
              <span className="min-w-0 truncate font-mono text-sm" title={f.path}>
                {f.path}
              </span>
              <span className="shrink-0 font-mono text-sm font-bold text-accent">+{f.additions}</span>
            </div>
          ))}
        </SketchBox>

        <div className="mt-8">
          <InfoCallout>
            <span className="font-bold text-ink">Nothing has changed on your live site yet. </span>
            Merge right here when you&apos;re ready, or open it on GitHub if you&apos;d rather
            review and merge it yourself there.
          </InfoCallout>
        </div>

        {actionError && (
          <p className="mt-4 rounded border-2 border-warn bg-warn-soft px-3 py-2 text-sm text-warn">
            {actionError}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="accent"
            disabled={status !== "open" || updating}
            onClick={() => runAction("merge")}
          >
            {status === "merged" ? "Merged" : updating ? "Merging…" : "Merge pull request"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={status !== "open" || updating}
            onClick={() => runAction("close")}
          >
            Close without merging
          </Button>
        </div>
      </div>
    </main>
  );
}
