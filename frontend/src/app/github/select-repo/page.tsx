"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { SketchBox, InfoCallout } from "@/components/ui/SketchBox";

type Repo = { fullName: string; defaultBranch: string; private: boolean; htmlUrl: string };
type ReposResponse = { connected: boolean; repos: Repo[]; error?: string };

export default function SelectRepoPage() {
  const router = useRouter();
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [connected, setConnected] = useState(true);
  const [repoFullName, setRepoFullName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/github/repos")
      .then((res) => res.json())
      .then((data: ReposResponse) => {
        setConnected(data.connected);
        setRepos(data.repos);
        if (data.repos.length > 0) setRepoFullName(data.repos[0].fullName);
      })
      .catch(() => setRepos([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/github/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoFullName, siteUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push("/github/repo-scan");
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 bg-paper px-8 py-12">
      <div className="mx-auto max-w-[560px]">
        <Link href="/settings/integrations" className="text-sm font-bold text-muted hover:text-ink">
          ← Back to Integrations
        </Link>
        <div className="mt-4">
          <Logo size={24} />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Pick a repository</h1>
        <p className="mt-2 text-muted">
          Seovate will check this repo for <span className="font-mono">sitemap.xml</span> and{" "}
          <span className="font-mono">robots.txt</span>, and open a pull request if either is
          missing — nothing is committed without your approval.
        </p>

        {!connected && (
          <div className="mt-6">
            <InfoCallout>Connect GitHub in Settings → Integrations first.</InfoCallout>
          </div>
        )}

        {connected && repos && repos.length === 0 && (
          <div className="mt-6">
            <InfoCallout>
              No repositories found on this GitHub account (or Seovate wasn&apos;t granted access
              to any). Check the GitHub App/OAuth authorization and try again.
            </InfoCallout>
          </div>
        )}

        {connected && repos && repos.length > 0 && (
          <SketchBox className="mt-8 p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Repository
                <select
                  value={repoFullName}
                  onChange={(e) => setRepoFullName(e.target.value)}
                  className="rounded border-2 border-ink px-3.5 py-3 text-sm outline-none focus:border-accent"
                >
                  {repos.map((r) => (
                    <option key={r.fullName} value={r.fullName}>
                      {r.fullName} {r.private ? "(private)" : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Live site URL to audit
                <input
                  type="url"
                  required
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://friscoplumbingco.com"
                  className="rounded border-2 border-ink px-3.5 py-3 text-sm outline-none focus:border-accent"
                />
              </label>

              {error && (
                <p className="rounded border-2 border-warn bg-warn-soft px-3 py-2 text-sm text-warn">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={submitting} className="mt-2 w-full justify-center">
                {submitting ? "Saving…" : "Continue →"}
              </Button>
            </form>
          </SketchBox>
        )}
      </div>
    </main>
  );
}
