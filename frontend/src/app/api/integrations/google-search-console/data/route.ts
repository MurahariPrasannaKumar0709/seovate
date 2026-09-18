import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { getValidGoogleAccessToken } from "@/lib/integrations/googleClient";
import {
  SearchConsoleError,
  listSearchConsoleSites,
  listSitemaps,
  querySearchAnalytics,
  type SearchAnalyticsRow,
} from "@/lib/integrations/searchConsole";
import { getGitHubSelection } from "@/lib/integrations/githubSelection";
import { matchGithubSiteToGscProperty } from "@/lib/integrations/siteMatch";

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function emptyRow(): { clicks: number; impressions: number; ctr: number; position: number } {
  return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ connected: false, reason: "not_logged_in" });
  }

  const accessToken = await getValidGoogleAccessToken(user.id, "google_search_console");
  if (!accessToken) {
    return NextResponse.json({ connected: false, reason: "not_connected" });
  }

  let sites;
  try {
    sites = await listSearchConsoleSites(accessToken);
  } catch (err) {
    const status = err instanceof SearchConsoleError ? err.status : 500;
    return NextResponse.json({ connected: true, reason: "api_error", apiStatus: status });
  }

  if (sites.length === 0) {
    return NextResponse.json({ connected: true, sites: [], reason: "no_sites" });
  }

  // Google's sites.list API doesn't guarantee a stable order across calls — sort so the default
  // pick below (and the dropdown) stay consistent from one request to the next.
  sites.sort((a, b) => a.siteUrl.localeCompare(b.siteUrl));

  const requestedSite = req.nextUrl.searchParams.get("site");
  const selectedSite = sites.some((s) => s.siteUrl === requestedSite) ? requestedSite! : sites[0].siteUrl;

  // GitHub's connected repo/site and a GSC property are stored on unrelated Integration rows —
  // this is a best-effort domain match so the currently selected property can show which repo (if
  // any) Seovate would scaffold sitemap.xml/robots.txt into for this domain.
  const githubSelection = await getGitHubSelection(user.id);
  const matchedSite = githubSelection ? matchGithubSiteToGscProperty(githubSelection.siteUrl, sites) : null;
  const linkedRepo =
    githubSelection && matchedSite?.siteUrl === selectedSite
      ? { repoFullName: githubSelection.repoFullName, prNumber: githubSelection.lastPrNumber }
      : null;

  // GSC data typically lags 2-3 days; end the range a few days back so the last days aren't
  // just empty/zero from not having reported yet.
  const end = new Date();
  end.setDate(end.getDate() - 3);
  const start = new Date(end);
  start.setDate(start.getDate() - 90);
  const startDate = toDateString(start);
  const endDate = toDateString(end);

  const safeQuery = async (dimensions: string[], rowLimit?: number): Promise<SearchAnalyticsRow[]> => {
    try {
      return await querySearchAnalytics(accessToken, selectedSite, { startDate, endDate, dimensions, rowLimit });
    } catch {
      return [];
    }
  };

  const [totalsRows, dailyRows, queryRows, pageRows, countryRows, deviceRows, sitemaps] = await Promise.all([
    safeQuery([]),
    safeQuery(["date"]),
    safeQuery(["query"], 10),
    safeQuery(["page"], 10),
    safeQuery(["country"], 10),
    safeQuery(["device"]),
    listSitemaps(accessToken, selectedSite).catch(() => []),
  ]);

  const totals = totalsRows[0] ?? emptyRow();

  const daily = dailyRows
    .map((r) => ({ date: r.keys[0], clicks: r.clicks, impressions: r.impressions }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const topQueries = queryRows.map((r) => ({
    query: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
  const topPages = pageRows.map((r) => ({
    page: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
  const countries = countryRows.map((r) => ({
    country: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
  }));
  const devices = deviceRows.map((r) => ({ device: r.keys[0], clicks: r.clicks, impressions: r.impressions }));

  let totalSubmitted = 0;
  let totalIndexed = 0;
  const sitemapSummaries = sitemaps.map((sm) => {
    const submitted = (sm.contents ?? []).reduce((sum, c) => sum + (parseInt(c.submitted, 10) || 0), 0);
    const indexed = (sm.contents ?? []).reduce((sum, c) => sum + (parseInt(c.indexed ?? "0", 10) || 0), 0);
    totalSubmitted += submitted;
    totalIndexed += indexed;
    return {
      path: sm.path,
      submitted,
      indexed,
      lastSubmitted: sm.lastSubmitted ?? null,
      errors: sm.errors ?? null,
      warnings: sm.warnings ?? null,
    };
  });

  return NextResponse.json({
    connected: true,
    sites,
    selectedSite,
    linkedRepo,
    dateRange: { start: startDate, end: endDate },
    totals,
    daily,
    topQueries,
    topPages,
    countries,
    devices,
    indexing: { totalSubmitted, totalIndexed, sitemaps: sitemapSummaries },
  });
}
