import type { SearchAnalyticsRow } from "@/lib/integrations/searchConsole";

// Google's sitemap resource reports `errors`/`warnings` as *counts* (numeric strings like "0" or
// "3"), not message text — confirmed live against the real API. Model them as numbers so a
// count of 0 isn't mistaken for "an issue is present" (a bare truthy-string check would treat
// "0" as an issue, which is wrong).
export type SitemapIssue = { path: string; errors: number; warnings: number };
export type EmailContent = { subject: string; html: string; text: string };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function describeIssue(i: SitemapIssue): string {
  const parts: string[] = [];
  if (i.errors > 0) parts.push(`${i.errors} error${i.errors === 1 ? "" : "s"}`);
  if (i.warnings > 0) parts.push(`${i.warnings} warning${i.warnings === 1 ? "" : "s"}`);
  return parts.join(", ");
}

/** Inline HTML template strings, no templating library — matches the pattern already used for
 *  OTP emails in `app/api/auth/request-otp/route.ts`. */
export function buildSitemapIssueEmail(siteUrl: string, issues: SitemapIssue[]): EmailContent {
  const rows = issues.map((i) => `<li><strong>${i.path}</strong> — ${describeIssue(i)}</li>`).join("");
  const link = `${APP_URL}/search-console`;

  return {
    subject: `Search Console found issues with ${siteUrl}`,
    text: `Search Console reported issues with the sitemap(s) for ${siteUrl}:\n${issues
      .map((i) => `- ${i.path}: ${describeIssue(i)}`)
      .join("\n")}\n\nReview and resubmit at ${link}`,
    html: `
      <p>Search Console reported issues with the sitemap(s) for <strong>${siteUrl}</strong>:</p>
      <ul>${rows}</ul>
      <p><a href="${link}">Review and resubmit in Seovate →</a></p>
      <p style="color:#8a8a8a;font-size:12px;">You're getting this because sitemap monitoring is
      enabled for this site. You can turn it off from Settings → Integrations.</p>
    `,
  };
}

export type WeeklyReportData = {
  siteUrl: string;
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  indexing: { totalSubmitted: number; totalIndexed: number };
  issues: SitemapIssue[];
};

export function buildWeeklyReportEmail(data: WeeklyReportData): EmailContent {
  const { siteUrl, totals, indexing, issues } = data;
  const link = `${APP_URL}/search-console`;
  const issueLine =
    issues.length > 0
      ? `<p style="color:#b8562f;">${issues.length} sitemap issue(s) still need attention — resubmit from the link below.</p>`
      : `<p style="color:#2f6b4f;">No sitemap issues detected this week.</p>`;

  return {
    subject: `Your weekly Search Console report — ${siteUrl}`,
    text: `Weekly report for ${siteUrl}:
Clicks: ${totals.clicks}
Impressions: ${totals.impressions}
Average CTR: ${(totals.ctr * 100).toFixed(1)}%
Average position: ${totals.position.toFixed(1)}
Indexed: ${indexing.totalIndexed}/${indexing.totalSubmitted} submitted URLs
${issues.length > 0 ? `${issues.length} sitemap issue(s) need attention.` : "No sitemap issues detected."}

Full report and resubmit option: ${link}`,
    html: `
      <p>Here's this week's Search Console summary for <strong>${siteUrl}</strong>:</p>
      <table cellpadding="6" style="border-collapse:collapse;">
        <tr><td>Clicks</td><td><strong>${totals.clicks}</strong></td></tr>
        <tr><td>Impressions</td><td><strong>${totals.impressions}</strong></td></tr>
        <tr><td>Average CTR</td><td><strong>${(totals.ctr * 100).toFixed(1)}%</strong></td></tr>
        <tr><td>Average position</td><td><strong>${totals.position.toFixed(1)}</strong></td></tr>
        <tr><td>Indexed</td><td><strong>${indexing.totalIndexed}/${indexing.totalSubmitted}</strong> submitted URLs</td></tr>
      </table>
      ${issueLine}
      <p><a href="${link}">View full report / resubmit sitemap in Seovate →</a></p>
      <p style="color:#8a8a8a;font-size:12px;">You're getting this because weekly reports are
      enabled for this site. You can turn it off from Settings → Integrations.</p>
    `,
  };
}

export function extractIssues(
  sitemaps: { path: string; errors?: string | null; warnings?: string | null }[]
): SitemapIssue[] {
  return sitemaps
    .map((s) => ({ path: s.path, errors: parseInt(s.errors ?? "0", 10) || 0, warnings: parseInt(s.warnings ?? "0", 10) || 0 }))
    .filter((s) => s.errors > 0 || s.warnings > 0);
}

export function totalsFromRows(rows: SearchAnalyticsRow[]) {
  return rows[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
}
