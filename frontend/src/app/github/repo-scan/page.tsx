"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import Tag from "@/components/ui/Tag";
import { Button, LinkButton } from "@/components/ui/Button";
import { SketchBox, InfoCallout } from "@/components/ui/SketchBox";
import { IconCheck, IconX } from "@/components/ui/Icons";

type ScanFile = { path: string; description: string; present: boolean };
type ScanResponse =
  | { selected: false }
  | { selected: true; error: string; status?: number }
  | { selected: true; repoFullName: string; siteUrl: string | null; files: ScanFile[]; allPresent: boolean };

export default function GitHubRepoScanPage() {
  const router = useRouter();
  const [data, setData] = useState<ScanResponse | null>(null);

  useEffect(() => {
    fetch("/api/github/scan")
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData({ selected: false }));
  }, []);

  if (!data) {
    return (
      <main className="flex-1 bg-paper px-8 py-12">
        <p className="text-sm text-muted">Checking your repository…</p>
      </main>
    );
  }

  if (!data.selected) {
    return (
      <main className="flex-1 bg-paper px-8 py-12">
        <div className="mx-auto max-w-[640px]">
          <Link href="/settings/integrations" className="text-sm font-bold text-muted hover:text-ink">
            ← Back to Integrations
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Repository scan</h1>
          <div className="mt-6">
            <InfoCallout>
              Connect GitHub and pick a repository first — Seovate needs to know which repo and
              which live site to check.
            </InfoCallout>
          </div>
          <div className="mt-6">
            <LinkButton href="/github/select-repo">Select a repository →</LinkButton>
          </div>
        </div>
      </main>
    );
  }

  if ("error" in data) {
    return (
      <main className="flex-1 bg-paper px-8 py-12">
        <div className="mx-auto max-w-[640px]">
          <Link href="/settings/integrations" className="text-sm font-bold text-muted hover:text-ink">
            ← Back to Integrations
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Repository scan</h1>
          <div className="mt-6">
            <InfoCallout>
              Couldn&apos;t reach GitHub to scan the repository right now. Try again in a moment.
            </InfoCallout>
          </div>
        </div>
      </main>
    );
  }

  const files = data.files.map((f) => ({ ...f, variant: f.present ? ("success" as const) : ("warn" as const) }));
  const missingCount = files.filter((f) => !f.present).length;

  return (
    <main className="flex-1 bg-paper px-8 py-12">
      <div className="mx-auto max-w-[720px]">
        <Link href="/github/select-repo" className="text-sm font-bold text-muted hover:text-ink">
          ← Change repository
        </Link>
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-muted">
          <Logo size={20} /> × <span className="font-mono">{data.repoFullName}</span>
        </div>
        <h1 className="mt-6 text-[26px] font-bold">Scanning your repository</h1>
        <p className="mt-2 text-muted">
          Checking for the files search engines and AI crawlers expect to find. Anything Seovate
          wants to add or change here needs your sign-off first — repo file changes work
          differently from routine on-page fixes.
        </p>

        <SketchBox className="mt-8 divide-y-0 p-0">
          {files.map((file, i) => {
            const Icon = file.present ? IconCheck : IconX;
            return (
              <div
                key={file.path}
                className={`flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between ${
                  i !== files.length - 1 ? "border-b border-[#eeece2]" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon size={18} />
                  <div>
                    <div className="font-mono text-sm font-bold">{file.path}</div>
                    <p className="mt-1 text-sm text-muted">{file.description}</p>
                  </div>
                </div>
                <Tag variant={file.variant}>{file.present ? "Up to date" : "Missing"}</Tag>
              </div>
            );
          })}
        </SketchBox>

        <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {missingCount === 0 ? "All expected files are present." : `${missingCount} file(s) missing`}
          </p>
          {missingCount > 0 && (
            <Button type="button" onClick={() => router.push("/github/consent")}>
              Review & approve changes →
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
