"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SketchBox, StatCard, InfoCallout } from "@/components/ui/SketchBox";
import { Button, LinkButton } from "@/components/ui/Button";

type Totals = { clicks: number; impressions: number; ctr: number; position: number };
type DailyPoint = { date: string; clicks: number; impressions: number };
type QueryRow = { query: string; clicks: number; impressions: number; ctr: number; position: number };
type PageRow = { page: string; clicks: number; impressions: number; ctr: number; position: number };
type CountryRow = { country: string; clicks: number; impressions: number };
type DeviceRow = { device: string; clicks: number; impressions: number };
type SitemapSummary = {
  path: string;
  submitted: number;
  indexed: number;
  lastSubmitted: string | null;
  errors: string | null;
  warnings: string | null;
};
type Site = { siteUrl: string; permissionLevel: string };
type LinkedRepo = { repoFullName: string; prNumber: number | null };

type SearchConsoleData = {
  connected: boolean;
  reason?: "not_logged_in" | "not_connected" | "no_sites" | "api_error";
  apiStatus?: number;
  sites?: Site[];
  selectedSite?: string;
  linkedRepo?: LinkedRepo | null;
  dateRange?: { start: string; end: string };
  totals?: Totals;
  daily?: DailyPoint[];
  topQueries?: QueryRow[];
  topPages?: PageRow[];
  countries?: CountryRow[];
  devices?: DeviceRow[];
  indexing?: { totalSubmitted: number; totalIndexed: number; sitemaps: SitemapSummary[] };
};

const TABS = ["Queries", "Pages", "Countries", "Devices"] as const;
type TabName = (typeof TABS)[number];

function LineChart({ daily }: { daily: DailyPoint[] }) {
  if (daily.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">No performance data for this period yet.</p>;
  }
  const width = 800;
  const height = 200;
  const padding = 24;
  const maxClicks = Math.max(1, ...daily.map((d) => d.clicks));
  const maxImpressions = Math.max(1, ...daily.map((d) => d.impressions));
  const stepX = (width - padding * 2) / Math.max(1, daily.length - 1);

  const toPath = (values: number[], max: number) =>
    values
      .map((v, i) => {
        const x = padding + i * stepX;
        const y = height - padding - (v / max) * (height - padding * 2);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#e4e2d8"
          strokeWidth={1}
        />
        <path
          d={toPath(
            daily.map((d) => d.impressions),
            maxImpressions
          )}
          fill="none"
          stroke="#8b6ac8"
          strokeWidth={2}
        />
        <path
          d={toPath(
            daily.map((d) => d.clicks),
            maxClicks
          )}
          fill="none"
          stroke="#2f6b4f"
          strokeWidth={2}
        />
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span>{daily[0]?.date}</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" /> Clicks
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-[#8b6ac8]" /> Impressions
          </span>
        </div>
        <span>{daily[daily.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export default function SearchConsolePage() {
  const [data, setData] = useState<SearchConsoleData | null>(null);
  const [site, setSite] = useState<string | null>(null);
  const [tab, setTab] = useState<TabName>("Queries");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [confirmingResubmit, setConfirmingResubmit] = useState(false);

  useEffect(() => {
    setLoading(true);
    const qs = site ? `?site=${encodeURIComponent(site)}` : "";
    fetch(`/api/integrations/google-search-console/data${qs}`)
      .then((res) => res.json())
      .then((d: SearchConsoleData) => {
        setData(d);
        if (d.selectedSite) setSite(d.selectedSite);
      })
      .finally(() => setLoading(false));
  }, [site]);

  async function handleSubmitSitemap() {
    if (!data?.selectedSite) return;
    setSubmitting(true);
    setSubmitMessage(null);
    try {
      const res = await fetch("/api/integrations/google-search-console/submit-sitemap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteUrl: data.selectedSite, feedpath: "sitemap.xml" }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        setSubmitMessage("Couldn't submit the sitemap to Search Console. Try again in a moment.");
        return;
      }
      setSubmitMessage("Submitted sitemap.xml to Search Console.");
      const qs = `?site=${encodeURIComponent(data.selectedSite)}`;
      fetch(`/api/integrations/google-search-console/data${qs}`)
        .then((res) => res.json())
        .then(setData);
    } catch {
      setSubmitMessage("Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const ctrPct = useMemo(
    () => (data?.totals ? `${(data.totals.ctr * 100).toFixed(1)}%` : "—"),
    [data]
  );

  if (loading && !data) {
    return (
      <main className="flex-1 bg-paper px-8 py-12">
        <p className="text-sm text-muted">Loading Search Console data…</p>
      </main>
    );
  }

  if (!data?.connected) {
    return (
      <main className="flex-1 bg-paper px-8 py-12">
        <div className="mx-auto max-w-[640px]">
          <h1 className="text-2xl font-bold">Search Console</h1>
          <div className="mt-6">
            <InfoCallout>
              {data?.reason === "not_logged_in"
                ? "Log in to see your Search Console performance data."
                : "Connect Google Search Console to see rankings, impressions, and indexing status here."}
            </InfoCallout>
          </div>
          {data?.reason !== "not_logged_in" && (
            <div className="mt-6">
              <LinkButton href="/settings/integrations" variant="accent">
                Go to Integrations →
              </LinkButton>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (data.reason === "no_sites") {
    return (
      <main className="flex-1 bg-paper px-8 py-12">
        <div className="mx-auto max-w-[640px]">
          <h1 className="text-2xl font-bold">Search Console</h1>
          <div className="mt-6">
            <InfoCallout>
              Your Google account is connected, but Search Console doesn&apos;t have any verified
              properties on it yet. Add and verify your site in Search Console, then refresh this
              page.
            </InfoCallout>
          </div>
        </div>
      </main>
    );
  }

  if (data.reason === "api_error") {
    return (
      <main className="flex-1 bg-paper px-8 py-12">
        <div className="mx-auto max-w-[640px]">
          <h1 className="text-2xl font-bold">Search Console</h1>
          <div className="mt-6">
            <InfoCallout>
              {data.apiStatus === 403
                ? "Your Google account is connected, but the Search Console API isn't enabled on the connected Google Cloud project yet. Enable \"Google Search Console API\" in Google Cloud Console (APIs & Services → Library), then refresh this page."
                : "Couldn't load Search Console data right now — Google's API returned an error. Try again in a moment."}
            </InfoCallout>
          </div>
        </div>
      </main>
    );
  }

  const sites = data.sites ?? [];
  const totals = data.totals ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const daily = data.daily ?? [];
  const indexing = data.indexing ?? { totalSubmitted: 0, totalIndexed: 0, sitemaps: [] };
  const sitemapIssues = indexing.sitemaps.filter(
    (sm) => (parseInt(sm.errors ?? "0", 10) || 0) > 0 || (parseInt(sm.warnings ?? "0", 10) || 0) > 0
  );

  return (
    <main className="flex-1 bg-paper">
      <header className="border-b-2 border-ink bg-white">
        <div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-3 px-8 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Google Search Console</p>
            <h1 className="mt-1 text-2xl font-bold">Search performance</h1>
          </div>
          {sites.length > 1 && (
            <select
              value={site ?? sites[0].siteUrl}
              onChange={(e) => setSite(e.target.value)}
              className="rounded border-2 border-ink bg-white px-3 py-2 text-sm font-bold"
            >
              {sites.map((s) => (
                <option key={s.siteUrl} value={s.siteUrl}>
                  {s.siteUrl}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[960px] px-8 py-10">
        {data.linkedRepo && (
          <p className="mb-3 text-xs text-muted">
            Connected repo for this domain:{" "}
            <Link href="/github/repo-scan" className="font-mono font-bold text-ink hover:underline">
              {data.linkedRepo.repoFullName}
            </Link>
          </p>
        )}
        {data.dateRange && (
          <p className="text-xs text-muted">
            {data.dateRange.start} → {data.dateRange.end}
          </p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard value={String(totals.clicks)} label="Total clicks" />
          <StatCard value={String(totals.impressions)} label="Total impressions" />
          <StatCard value={ctrPct} label="Average CTR" />
          <StatCard value={totals.position ? totals.position.toFixed(1) : "—"} label="Average position" />
        </div>

        <SketchBox className="mt-6 p-5">
          <h2 className="font-bold">Clicks &amp; impressions</h2>
          <div className="mt-4">
            <LineChart daily={daily} />
          </div>
        </SketchBox>

        <SketchBox className="mt-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold">Indexing</h2>
            <Button type="button" variant="ghost" disabled={submitting} onClick={handleSubmitSitemap}>
              {submitting ? "Submitting…" : "Submit sitemap.xml →"}
            </Button>
          </div>
          <p className="mt-1 text-sm text-muted">
            {indexing.totalIndexed} of {indexing.totalSubmitted} submitted URLs indexed, across{" "}
            {indexing.sitemaps.length} sitemap{indexing.sitemaps.length === 1 ? "" : "s"}.
          </p>
          {submitMessage && <p className="mt-2 text-sm text-muted">{submitMessage}</p>}
          {indexing.sitemaps.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {indexing.sitemaps.map((sm) => {
                const errorCount = parseInt(sm.errors ?? "0", 10) || 0;
                const warningCount = parseInt(sm.warnings ?? "0", 10) || 0;
                return (
                  <div key={sm.path} className="border-t border-[#eeece2] pt-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono">{sm.path}</span>
                      <span className="text-muted">
                        {sm.indexed}/{sm.submitted} indexed
                      </span>
                    </div>
                    {(errorCount > 0 || warningCount > 0) && (
                      <p className="mt-1 text-xs text-warn">
                        {errorCount > 0 && `${errorCount} error${errorCount === 1 ? "" : "s"}`}
                        {errorCount > 0 && warningCount > 0 && ", "}
                        {warningCount > 0 && `${warningCount} warning${warningCount === 1 ? "" : "s"}`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {sitemapIssues.length > 0 && (
            <div className="mt-4 rounded border-2 border-warn bg-warn-soft p-4">
              <p className="text-sm font-bold text-warn">
                Search Console reported {sitemapIssues.length} issue{sitemapIssues.length === 1 ? "" : "s"}.
              </p>
              {!confirmingResubmit ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-3"
                  onClick={() => setConfirmingResubmit(true)}
                >
                  Resubmit sitemap.xml →
                </Button>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <p className="text-sm text-warn">Re-submit sitemap.xml to Search Console now?</p>
                  <Button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setConfirmingResubmit(false);
                      handleSubmitSitemap();
                    }}
                  >
                    {submitting ? "Submitting…" : "Confirm resubmit"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setConfirmingResubmit(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </SketchBox>

        <div className="mt-8 flex gap-2 border-b-2 border-ink">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-bold uppercase tracking-wide ${
                tab === t ? "border-b-2 border-ink -mb-0.5 text-ink" : "text-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <SketchBox className="mt-0 rounded-t-none border-t-0 p-0">
          {tab === "Queries" &&
            (data.topQueries ?? []).map((r, i) => (
              <Row key={r.query} label={r.query} clicks={r.clicks} impressions={r.impressions} last={i === (data.topQueries ?? []).length - 1} />
            ))}
          {tab === "Pages" &&
            (data.topPages ?? []).map((r, i) => (
              <Row key={r.page} label={r.page} clicks={r.clicks} impressions={r.impressions} last={i === (data.topPages ?? []).length - 1} />
            ))}
          {tab === "Countries" &&
            (data.countries ?? []).map((r, i) => (
              <Row key={r.country} label={r.country} clicks={r.clicks} impressions={r.impressions} last={i === (data.countries ?? []).length - 1} />
            ))}
          {tab === "Devices" &&
            (data.devices ?? []).map((r, i) => (
              <Row key={r.device} label={r.device} clicks={r.clicks} impressions={r.impressions} last={i === (data.devices ?? []).length - 1} />
            ))}
          {tab === "Queries" && (data.topQueries ?? []).length === 0 && <EmptyRow />}
          {tab === "Pages" && (data.topPages ?? []).length === 0 && <EmptyRow />}
          {tab === "Countries" && (data.countries ?? []).length === 0 && <EmptyRow />}
          {tab === "Devices" && (data.devices ?? []).length === 0 && <EmptyRow />}
        </SketchBox>
      </div>
    </main>
  );
}

function Row({ label, clicks, impressions, last }: { label: string; clicks: number; impressions: number; last: boolean }) {
  return (
    <div className={`flex items-center justify-between p-4 ${last ? "" : "border-b border-[#eeece2]"}`}>
      <span className="truncate text-sm" title={label}>
        {label}
      </span>
      <span className="shrink-0 text-sm text-muted">
        {clicks} clicks · {impressions} impressions
      </span>
    </div>
  );
}

function EmptyRow() {
  return <div className="p-4 text-sm text-muted">No data for this period.</div>;
}
