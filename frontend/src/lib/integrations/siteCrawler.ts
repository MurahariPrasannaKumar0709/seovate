const MAX_PAGES = 300;
const FETCH_TIMEOUT_MS = 8000;
const VERIFY_CONCURRENCY = 8;
const CRAWL_CONCURRENCY = 8;
// The technical-SEO audit runs synchronously inside a Next.js API route (no worker/queue), so it
// needs a page cap small enough to finish inside a serverless function's execution limit.
const MAX_AUDIT_PAGES = 40;

export type PageRecord = {
  url: string;
  statusCode: number | null;
  title: string | null;
  metaDescription: string | null;
  h1s: string[];
  canonical: string | null;
  jsonLdTypes: string[];
  internalLinks: string[];
};

/**
 * Same-origin crawler: starts at the homepage and follows internal links breadth-first —
 * every discovered page's links get followed too, not just the homepage's — until either the
 * whole reachable site has been visited or MAX_PAGES is hit. Runs with bounded concurrency so a
 * large site still finishes in a reasonable time. No JS rendering — this only sees links present
 * in server-rendered HTML, same limitation a search engine crawler without JS execution would
 * have.
 */
export async function crawlSite(baseUrl: string): Promise<string[]> {
  const origin = new URL(baseUrl).origin;
  const start = normalizeUrl(baseUrl, origin) ?? baseUrl;
  const seen = new Set<string>([start]);
  const queue: string[] = [start];
  const visited = new Set<string>();
  let active = 0;

  function nextUrl(): string | null {
    while (queue.length > 0) {
      const url = queue.shift()!;
      if (!visited.has(url)) {
        visited.add(url);
        return url;
      }
    }
    return null;
  }

  async function worker() {
    for (;;) {
      if (seen.size >= MAX_PAGES) return;
      const url = nextUrl();
      if (!url) {
        // Queue's empty right now, but another worker may still be fetching a page that turns up
        // more links — only stop once nothing is in flight either.
        if (active === 0) return;
        await new Promise((r) => setTimeout(r, 20));
        continue;
      }
      active++;
      try {
        const html = await fetchHtml(url);
        if (!html) continue;
        for (const link of extractLinks(html, url)) {
          if (seen.size >= MAX_PAGES) break;
          const normalized = normalizeUrl(link, origin);
          if (normalized && !seen.has(normalized)) {
            seen.add(normalized);
            queue.push(normalized);
          }
        }
      } finally {
        active--;
      }
    }
  }

  await Promise.all(Array.from({ length: CRAWL_CONCURRENCY }, worker));
  return Array.from(seen);
}

/**
 * Same-origin BFS crawl like `crawlSite`, but also extracts on-page SEO signals (title, meta
 * description, H1s, canonical, JSON-LD types, internal links, HTTP status) needed by the
 * technical-SEO rule engine — not just the URL list. Kept separate from `crawlSite` so the
 * GitHub sitemap-scaffolding flow (which only needs the URL list) isn't slowed down by the extra
 * parsing work. Capped much lower than `crawlSite` since this runs synchronously in an API route.
 */
export async function crawlSiteDetailed(
  baseUrl: string
): Promise<{ pages: PageRecord[]; truncated: boolean }> {
  const origin = new URL(baseUrl).origin;
  const start = normalizeUrl(baseUrl, origin) ?? baseUrl;
  const seen = new Set<string>([start]);
  const queue: string[] = [start];
  const visited = new Set<string>();
  const pages: PageRecord[] = [];
  let active = 0;

  function nextUrl(): string | null {
    while (queue.length > 0) {
      const url = queue.shift()!;
      if (!visited.has(url)) {
        visited.add(url);
        return url;
      }
    }
    return null;
  }

  async function worker() {
    for (;;) {
      if (seen.size >= MAX_AUDIT_PAGES) return;
      const url = nextUrl();
      if (!url) {
        if (active === 0) return;
        await new Promise((r) => setTimeout(r, 20));
        continue;
      }
      active++;
      try {
        const record = await fetchPageRecord(url);
        pages.push(record);
        for (const link of record.internalLinks) {
          if (seen.size >= MAX_AUDIT_PAGES) break;
          const normalized = normalizeUrl(link, origin);
          if (normalized && !seen.has(normalized)) {
            seen.add(normalized);
            queue.push(normalized);
          }
        }
      } finally {
        active--;
      }
    }
  }

  await Promise.all(Array.from({ length: CRAWL_CONCURRENCY }, worker));
  return { pages, truncated: seen.size >= MAX_AUDIT_PAGES };
}

async function fetchPageRecord(url: string): Promise<PageRecord> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SeovateBot/1.0 (+https://seovate.example/bot)" },
    });
    clearTimeout(timeout);
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !isHtmlContentType(contentType)) {
      return {
        url,
        statusCode: res.status,
        title: null,
        metaDescription: null,
        h1s: [],
        canonical: null,
        jsonLdTypes: [],
        internalLinks: [],
      };
    }
    const html = await res.text();
    return {
      url,
      statusCode: res.status,
      title: extractTitle(html),
      metaDescription: extractMetaDescription(html),
      h1s: extractH1s(html),
      canonical: extractCanonical(html, url),
      jsonLdTypes: extractJsonLdTypes(html),
      internalLinks: extractLinks(html, url),
    };
  } catch {
    return {
      url,
      statusCode: null,
      title: null,
      metaDescription: null,
      h1s: [],
      canonical: null,
      jsonLdTypes: [],
      internalLinks: [],
    };
  }
}

function extractTitle(html: string): string | null {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match ? decodeHtmlEntities(match[1].trim()) || null : null;
}

function extractMetaDescription(html: string): string | null {
  const match = /<meta\s[^>]*name=["']description["'][^>]*>/i.exec(html);
  if (!match) return null;
  const content = /content=["']([^"']*)["']/i.exec(match[0]);
  return content ? decodeHtmlEntities(content[1].trim()) || null : null;
}

function extractH1s(html: string): string[] {
  const h1s: string[] = [];
  const re = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const text = decodeHtmlEntities(match[1].replace(/<[^>]+>/g, "").trim());
    if (text) h1s.push(text);
  }
  return h1s;
}

function extractCanonical(html: string, pageUrl: string): string | null {
  const match = /<link\s[^>]*rel=["']canonical["'][^>]*>/i.exec(html);
  if (!match) return null;
  const href = /href=["']([^"']+)["']/i.exec(match[0]);
  if (!href) return null;
  try {
    return new URL(href[1], pageUrl).toString();
  } catch {
    return null;
  }
}

function extractJsonLdTypes(html: string): string[] {
  const types: string[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    try {
      const parsed = JSON.parse(match[1]);
      const entries = Array.isArray(parsed) ? parsed : [parsed];
      for (const entry of entries) {
        const type = entry?.["@type"];
        if (typeof type === "string") types.push(type);
        else if (Array.isArray(type)) types.push(...type.filter((t) => typeof t === "string"));
      }
    } catch {
      // malformed JSON-LD — skip rather than fail the whole crawl
    }
  }
  return types;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * Confirms each candidate URL actually resolves live (2xx/3xx) before it's allowed into the
 * sitemap. Needed because repo-derived routes (from filenames/framework conventions) are guesses
 * — a repo full of unused template/demo pages, old routes, or draft content would otherwise
 * produce a sitemap full of URLs that 404 on the real site. Runs with bounded concurrency so a
 * repo with dozens of guessed routes doesn't fire dozens of requests at once.
 */
export async function verifyUrlsLive(urls: string[]): Promise<string[]> {
  const live: string[] = [];
  let index = 0;

  async function worker() {
    while (index < urls.length) {
      const url = urls[index++];
      if (await isUrlLive(url)) live.push(url);
    }
  }

  await Promise.all(Array.from({ length: Math.min(VERIFY_CONCURRENCY, urls.length) }, worker));
  return live;
}

async function isUrlLive(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "SeovateBot/1.0 (+https://seovate.example/bot)" },
    });
    // Some servers don't implement HEAD correctly (405/501) — fall back to GET before giving up.
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "SeovateBot/1.0 (+https://seovate.example/bot)" },
      });
    }
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SeovateBot/1.0 (+https://seovate.example/bot)" },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!isHtmlContentType(contentType)) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// Some servers (Google's included) serve real markup as `application/xhtml+xml` rather than
// `text/html` — checking for the substring "html" catches both instead of silently treating a
// valid page as non-HTML and reporting every field on it as missing.
function isHtmlContentType(contentType: string): boolean {
  return contentType.toLowerCase().includes("html");
}

function extractLinks(html: string, pageUrl: string): string[] {
  const links: string[] = [];
  const re = /<a\s[^>]*href=["']([^"'#]+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    try {
      links.push(new URL(match[1], pageUrl).toString());
    } catch {
      // ignore malformed hrefs
    }
  }
  return links;
}

function normalizeUrl(url: string, origin: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== origin) return null;
    if (/\.(png|jpe?g|gif|svg|webp|css|js|pdf|zip|xml)$/i.test(parsed.pathname)) return null;
    parsed.hash = "";
    parsed.search = "";
    if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
