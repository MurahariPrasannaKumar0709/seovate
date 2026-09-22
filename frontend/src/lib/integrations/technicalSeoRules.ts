import type { PageRecord } from "@/lib/integrations/siteCrawler";

export type Severity = "high" | "medium" | "low";

export type TechnicalSeoFinding = {
  ruleId: string;
  category: string;
  severity: Severity;
  url: string;
  evidence: Record<string, unknown>;
};

/**
 * Deterministic technical-SEO rules (per docs/13-seo-automation-plan.md's V1 rule list) evaluated
 * against a set of already-crawled pages. Pure and synchronous by design — the audit engine's
 * output must be reproducible from the same crawl data, with no network calls or randomness here.
 */
export function runTechnicalSeoRules(pages: PageRecord[], origin: string): TechnicalSeoFinding[] {
  const findings: TechnicalSeoFinding[] = [];
  const byUrl = new Map(pages.map((p) => [p.url, p]));

  const titleGroups = groupBy(pages, (p) => (p.title ? p.title.toLowerCase() : null));
  const descriptionGroups = groupBy(pages, (p) =>
    p.metaDescription ? p.metaDescription.toLowerCase() : null
  );

  for (const page of pages) {
    if (page.statusCode !== null && page.statusCode >= 400) {
      findings.push({
        ruleId: "PAGE_STATUS_ERROR",
        category: "crawlability",
        severity: page.statusCode >= 500 ? "high" : "medium",
        url: page.url,
        evidence: { statusCode: page.statusCode },
      });
      // A broken page has no meaningful title/meta/H1/canonical to check — skip the rest.
      continue;
    }
    if (page.statusCode === null) {
      findings.push({
        ruleId: "PAGE_UNREACHABLE",
        category: "crawlability",
        severity: "high",
        url: page.url,
        evidence: {},
      });
      continue;
    }

    if (!page.title) {
      findings.push({
        ruleId: "TITLE_MISSING",
        category: "metadata",
        severity: "high",
        url: page.url,
        evidence: {},
      });
    } else {
      const dupes = titleGroups.get(page.title.toLowerCase()) ?? [];
      if (dupes.length > 1) {
        findings.push({
          ruleId: "TITLE_DUPLICATE",
          category: "metadata",
          severity: "medium",
          url: page.url,
          evidence: { title: page.title, otherUrls: dupes.map((p) => p.url).filter((u) => u !== page.url) },
        });
      }
    }

    if (!page.metaDescription) {
      findings.push({
        ruleId: "META_DESCRIPTION_MISSING",
        category: "metadata",
        severity: "medium",
        url: page.url,
        evidence: {},
      });
    } else {
      const dupes = descriptionGroups.get(page.metaDescription.toLowerCase()) ?? [];
      if (dupes.length > 1) {
        findings.push({
          ruleId: "META_DESCRIPTION_DUPLICATE",
          category: "metadata",
          severity: "medium",
          url: page.url,
          evidence: {
            metaDescription: page.metaDescription,
            otherUrls: dupes.map((p) => p.url).filter((u) => u !== page.url),
          },
        });
      }
    }

    if (page.h1s.length === 0) {
      findings.push({
        ruleId: "H1_MISSING",
        category: "content-structure",
        severity: "medium",
        url: page.url,
        evidence: {},
      });
    } else if (page.h1s.length > 1) {
      findings.push({
        ruleId: "H1_MULTIPLE",
        category: "content-structure",
        severity: "low",
        url: page.url,
        evidence: { count: page.h1s.length, h1s: page.h1s },
      });
    }

    if (!page.canonical) {
      findings.push({
        ruleId: "CANONICAL_MISSING",
        category: "canonical",
        severity: "medium",
        url: page.url,
        evidence: {},
      });
    } else {
      try {
        const canonicalUrl = new URL(page.canonical);
        if (canonicalUrl.origin === origin) {
          const target = byUrl.get(page.canonical);
          if (target && target.statusCode !== null && target.statusCode >= 400) {
            findings.push({
              ruleId: "CANONICAL_TARGET_ERROR",
              category: "canonical",
              severity: "high",
              url: page.url,
              evidence: { canonical: page.canonical, statusCode: target.statusCode },
            });
          }
        }
      } catch {
        findings.push({
          ruleId: "CANONICAL_INVALID",
          category: "canonical",
          severity: "medium",
          url: page.url,
          evidence: { canonical: page.canonical },
        });
      }
    }
  }

  // Broken internal links: a same-origin href found on some page that points at a URL this crawl
  // also visited and found erroring/unreachable.
  for (const page of pages) {
    for (const link of page.internalLinks) {
      let linkUrl: URL;
      try {
        linkUrl = new URL(link);
      } catch {
        continue;
      }
      if (linkUrl.origin !== origin) continue;
      const target = byUrl.get(link);
      if (target && ((target.statusCode !== null && target.statusCode >= 400) || target.statusCode === null)) {
        findings.push({
          ruleId: "BROKEN_INTERNAL_LINK",
          category: "links",
          severity: "medium",
          url: page.url,
          evidence: { brokenLink: link, statusCode: target.statusCode },
        });
      }
    }
  }

  return findings;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string | null): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    if (key === null) continue;
    const group = map.get(key);
    if (group) group.push(item);
    else map.set(key, [item]);
  }
  return map;
}
