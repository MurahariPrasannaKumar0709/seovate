import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { getValidGoogleAccessToken } from "@/lib/integrations/googleClient";
import { SearchConsoleError, listSearchConsoleSites, submitSitemap } from "@/lib/integrations/searchConsole";

/** A GSC "site" is either a URL-prefix property (`https://example.com/`) or a domain property
 *  (`sc-domain:example.com`, no scheme) — sites.sitemaps.submit always needs a real, fully
 *  qualified sitemap URL regardless of which kind the property is. */
function siteOrigin(siteUrl: string): string {
  if (siteUrl.startsWith("sc-domain:")) return `https://${siteUrl.slice("sc-domain:".length)}`;
  return siteUrl.replace(/\/$/, "");
}

/** Registers a sitemap feed (default "sitemap.xml") with the given GSC property. Only used for
 *  sitemap.xml — robots.txt has no equivalent "submit" concept in the Search Console API.
 *
 *  `sites.sitemaps.submit`'s `feedpath` parameter is NOT a relative path — it must be the sitemap's
 *  full, absolute URL (e.g. `https://example.com/sitemap.xml`). Passing just "sitemap.xml" 400s
 *  with `reason: invalidParameter, location: feedpath` — confirmed against the live API. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  const accessToken = await getValidGoogleAccessToken(user.id, "google_search_console");
  if (!accessToken) return NextResponse.json({ error: "not_connected" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const siteUrl = typeof body.siteUrl === "string" ? body.siteUrl : null;
  const filename =
    typeof body.feedpath === "string" && body.feedpath ? body.feedpath.replace(/^\//, "") : "sitemap.xml";
  if (!siteUrl) return NextResponse.json({ error: "missing_site" }, { status: 400 });

  try {
    // Confirm the caller actually has this property connected before submitting to it.
    const sites = await listSearchConsoleSites(accessToken);
    if (!sites.some((s) => s.siteUrl === siteUrl)) {
      return NextResponse.json({ error: "site_not_found" }, { status: 400 });
    }

    const sitemapUrl = `${siteOrigin(siteUrl)}/${filename}`;
    await submitSitemap(accessToken, siteUrl, sitemapUrl);
    return NextResponse.json({ status: "submitted", feedpath: sitemapUrl });
  } catch (err) {
    const status = err instanceof SearchConsoleError ? err.status : 500;
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("submit-sitemap failed:", message);
    return NextResponse.json({ error: "submit_failed", status }, { status: 200 });
  }
}
