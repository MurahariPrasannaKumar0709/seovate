import type { SearchConsoleSite } from "@/lib/integrations/searchConsole";

/** Reduces a GSC property (`https://example.com/`, `sc-domain:example.com`) or a plain site URL
 *  (GitHub's `siteUrl`, e.g. `https://vigel.vercel.app/`) down to a bare comparable host, so the
 *  two independent "which site is this" concepts (GSC property vs. GitHub-selected live site) can
 *  be matched by domain without caring about protocol, trailing slash, or GSC's domain-property
 *  prefix. */
export function normalizeSiteHost(siteUrl: string): string {
  const withoutPrefix = siteUrl.replace(/^sc-domain:/, "");
  const withProtocol = /^[a-z]+:\/\//i.test(withoutPrefix) ? withoutPrefix : `https://${withoutPrefix}`;
  try {
    return new URL(withProtocol).host.replace(/^www\./, "").toLowerCase();
  } catch {
    return withoutPrefix.replace(/^www\./, "").toLowerCase();
  }
}

/** Finds the GSC property (if any) that corresponds to the site the user picked when connecting
 *  GitHub — the two are stored as unrelated strings on separate Integration rows, so this is a
 *  best-effort domain match, not a stored link. */
export function matchGithubSiteToGscProperty(
  githubSiteUrl: string | null,
  sites: SearchConsoleSite[]
): SearchConsoleSite | null {
  if (!githubSiteUrl) return null;
  const target = normalizeSiteHost(githubSiteUrl);
  return sites.find((s) => normalizeSiteHost(s.siteUrl) === target) ?? null;
}
