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

/**
 * Frameworks like Next.js (and Vite/CRA) only serve static files placed under `public/` at the
 * site root — a `sitemap.xml` committed to the repo root is just a source file the running app
 * never exposes, and 404s live even though it's sitting right there in the repo. Detected the hard
 * way: a real scaffolded sitemap.xml at repo root 404'd on the deployed site because the app is
 * Next.js and only serves out of `public/`. Falls back to the repo root for plain static sites
 * that have no such convention.
 */
export function detectStaticAssetDir(entries: GitHubTreeEntry[]): string {
  const isNextJs = entries.some(
    (e) => /^(?:src\/)?(app|pages)\//.test(e.path) || /^next\.config\.(js|ts|mjs|cjs)$/.test(e.path)
  );
  const hasPublicDir = entries.some((e) => e.path === "public" || e.path.startsWith("public/"));
  return isNextJs || hasPublicDir ? "public/" : "";
}

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

/** Pulls the URLs already declared in an existing sitemap.xml, to compare against a freshly
 *  audited URL list and decide whether the file is stale. */
export function extractSitemapUrls(xml: string): string[] {
  const urls: string[] = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) urls.push(m[1].trim());
  return urls;
}

/** Pulls the `Disallow:` rules already declared in an existing robots.txt. */
export function extractRobotsDisallowRules(txt: string): string[] {
  const rules: string[] = [];
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*Disallow:\s*(\S+)\s*$/i);
    if (m) rules.push(m[1]);
  }
  return rules;
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

/** True when an existing sitemap.xml's URLs no longer match what an audit just found — a newly
 *  added/removed page, not just a regenerated <lastmod>. */
export function sitemapNeedsUpdate(existingXml: string, auditedUrls: string[]): boolean {
  return !sameSet(extractSitemapUrls(existingXml), auditedUrls);
}

/** True when an existing robots.txt's Disallow rules no longer match what an audit just derived
 *  from the repo's own directories. */
export function robotsNeedsUpdate(existingTxt: string, auditedDisallowRules: string[]): boolean {
  return !sameSet(extractRobotsDisallowRules(existingTxt), auditedDisallowRules);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
