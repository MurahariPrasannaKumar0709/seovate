const WEBMASTERS_BASE = "https://www.googleapis.com/webmasters/v3";

export type SearchConsoleSite = { siteUrl: string; permissionLevel: string };

export type SearchAnalyticsRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SearchConsoleSitemap = {
  path: string;
  lastSubmitted?: string;
  isPending?: boolean;
  warnings?: string;
  errors?: string;
  contents?: { type: string; submitted: string; indexed?: string }[];
};

class SearchConsoleError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

async function googleApiFetch<T>(url: string, accessToken: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    throw new SearchConsoleError(`Search Console request to ${url} failed`, res.status);
  }
  return res.json() as Promise<T>;
}

export { SearchConsoleError };

export async function listSearchConsoleSites(accessToken: string): Promise<SearchConsoleSite[]> {
  const data = await googleApiFetch<{ siteEntry?: SearchConsoleSite[] }>(
    `${WEBMASTERS_BASE}/sites`,
    accessToken
  );
  return data.siteEntry ?? [];
}

export async function querySearchAnalytics(
  accessToken: string,
  siteUrl: string,
  body: { startDate: string; endDate: string; dimensions?: string[]; rowLimit?: number }
): Promise<SearchAnalyticsRow[]> {
  const data = await googleApiFetch<{ rows?: SearchAnalyticsRow[] }>(
    `${WEBMASTERS_BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    accessToken,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );
  return data.rows ?? [];
}

export async function listSitemaps(accessToken: string, siteUrl: string): Promise<SearchConsoleSitemap[]> {
  const data = await googleApiFetch<{ sitemap?: SearchConsoleSitemap[] }>(
    `${WEBMASTERS_BASE}/sites/${encodeURIComponent(siteUrl)}/sitemaps`,
    accessToken
  );
  return data.sitemap ?? [];
}

/** Registers (or re-pings) a sitemap feed with Search Console — `sites.sitemaps.submit`. Takes a
 *  feed *path* relative to the site (e.g. "sitemap.xml"), not a full URL. There's no equivalent
 *  submit call for robots.txt — Google discovers and re-crawls it automatically once it's live at
 *  the site's root, it's never "registered" the way a sitemap is. */
export async function submitSitemap(accessToken: string, siteUrl: string, feedpath: string): Promise<void> {
  const res = await fetch(
    `${WEBMASTERS_BASE}/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(feedpath)}`,
    { method: "PUT", headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`Search Console sitemap submit for ${feedpath} failed (${res.status}):`, body);
    throw new SearchConsoleError(`Search Console sitemap submit for ${feedpath} failed: ${body}`, res.status);
  }
}
