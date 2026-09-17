import type { GitHubTreeEntry } from "@/lib/integrations/githubClient";

const IGNORED_DIR_SEGMENTS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".vercel",
  ".github",
  "dist",
  "build",
  "out",
  "vendor",
  "coverage",
]);

const PAGE_FILE_EXT = /\.(tsx|ts|jsx|js|mdx)$/;

function isIgnored(path: string): boolean {
  return path.split("/").some((s) => IGNORED_DIR_SEGMENTS.has(s));
}

/** A route segment that can't map to one real URL: dynamic (`[slug]`), route groups (`(marketing)`),
 *  or Next.js private folders (`_lib`). */
function hasUnknownSegment(routeInner: string): boolean {
  return routeInner.split("/").some((s) => s.startsWith("[") || s.startsWith("(") || s.startsWith("_"));
}

/**
 * Best-effort page discovery straight from the repo's file tree — catches pages that exist in the
 * codebase but aren't linked anywhere the live crawler would find them (e.g. no nav link yet).
 * Covers static HTML sites and Next.js (App Router + Pages Router); other frameworks just won't
 * contribute repo-derived routes, and the live crawl still covers them.
 */
export function derivePagesFromRepo(entries: GitHubTreeEntry[]): string[] {
  const routes = new Set<string>();

  for (const { path } of entries) {
    if (isIgnored(path)) continue;

    if (/\.html?$/i.test(path)) {
      let route = path.replace(/^public\//, "").replace(/\.html?$/i, "");
      route = route.replace(/(^|\/)index$/, "");
      routes.add(`/${route}`.replace(/\/+/g, "/"));
      continue;
    }

    const appMatch = path.match(/^(?:src\/)?app\/(.*\/)?page\.(tsx|ts|jsx|js|mdx)$/);
    if (appMatch) {
      const inner = (appMatch[1] ?? "").replace(/\/$/, "");
      if (hasUnknownSegment(inner)) continue;
      routes.add(`/${inner}`.replace(/\/+/g, "/"));
      continue;
    }

    const pagesMatch = path.match(/^(?:src\/)?pages\/(.*)$/);
    if (pagesMatch && PAGE_FILE_EXT.test(pagesMatch[1])) {
      const inner = pagesMatch[1].replace(PAGE_FILE_EXT, "");
      const last = inner.split("/").pop() ?? "";
      if (inner === "api" || inner.startsWith("api/")) continue;
      if (last.startsWith("_")) continue; // _app, _document, _error, etc.
      if (hasUnknownSegment(inner)) continue;
      const route = inner.replace(/(^|\/)index$/, "");
      routes.add(`/${route}`.replace(/\/+/g, "/"));
      continue;
    }
  }

  return Array.from(routes);
}

const DISALLOW_RULES: { test: (path: string) => boolean; disallow: string }[] = [
  { test: (p) => /^(?:src\/)?app\/api\//.test(p) || /^(?:src\/)?pages\/api\//.test(p), disallow: "/api/" },
  { test: (p) => p.startsWith("wp-admin/"), disallow: "/wp-admin/" },
  { test: (p) => /^(?:src\/)?admin\//.test(p), disallow: "/admin/" },
];

/** Real disallow rules derived from directories actually present in the repo, instead of
 *  boilerplate — e.g. only disallows /api/ if the repo actually has an api/ route directory. */
export function deriveDisallowRules(entries: GitHubTreeEntry[]): string[] {
  const disallow = new Set<string>();
  for (const { path } of entries) {
    for (const rule of DISALLOW_RULES) {
      if (rule.test(path)) disallow.add(rule.disallow);
    }
  }
  return Array.from(disallow);
}

export function generateSitemapXml(urls: string[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const entries = urls
    .map((url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

export function generateRobotsTxt(siteUrl: string, disallowRules: string[] = []): string {
  const origin = new URL(siteUrl).origin;
  const disallowLines = disallowRules.map((rule) => `Disallow: ${rule}`).join("\n");
  return `User-agent: *\nAllow: /\n${disallowLines ? disallowLines + "\n" : ""}\nSitemap: ${origin}/sitemap.xml\n`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
