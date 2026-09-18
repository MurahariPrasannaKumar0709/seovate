import { prisma } from "@/lib/prisma";
import { getValidGoogleAccessToken } from "@/lib/integrations/googleClient";
import { listSearchConsoleSites, listSitemaps, querySearchAnalytics } from "@/lib/integrations/searchConsole";
import { sendMail } from "@/lib/auth/mailer";
import {
  buildSitemapIssueEmail,
  buildWeeklyReportEmail,
  extractIssues,
  totalsFromRows,
  type SitemapIssue,
} from "@/lib/integrations/reportEmails";
import { matchGithubSiteToGscProperty } from "@/lib/integrations/siteMatch";
import { getGitHubSelection } from "@/lib/integrations/githubSelection";

type MonitoredIntegration = { id: string; userId: string; lastSitemapIssues: string | null };

function issuesKey(issues: SitemapIssue[]): string {
  return JSON.stringify([...issues].sort((a, b) => a.path.localeCompare(b.path)));
}

/**
 * For one connected Search Console user: finds the property linked to their GitHub-selected site
 * (falls back to their first property if GitHub isn't connected), checks its sitemaps for
 * errors/warnings, and emails the user only when the set of issues is new/changed since the last
 * check — not on every run. Used by the hourly monitoring cron.
 */
export async function checkSitemapHealthForIntegration(
  integration: MonitoredIntegration,
  userEmail: string
): Promise<{ checked: boolean; issues: SitemapIssue[] }> {
  const accessToken = await getValidGoogleAccessToken(integration.userId, "google_search_console");
  if (!accessToken) return { checked: false, issues: [] };

  const sites = await listSearchConsoleSites(accessToken);
  if (sites.length === 0) return { checked: false, issues: [] };

  const githubSelection = await getGitHubSelection(integration.userId);
  const matched = githubSelection ? matchGithubSiteToGscProperty(githubSelection.siteUrl, sites) : null;
  const site = matched ?? sites[0];

  const sitemaps = await listSitemaps(accessToken, site.siteUrl);
  const issues = extractIssues(sitemaps);

  const previousKey = integration.lastSitemapIssues ?? "[]";
  const currentKey = issuesKey(issues);

  if (issues.length > 0 && currentKey !== previousKey) {
    const email = buildSitemapIssueEmail(site.siteUrl, issues);
    await sendMail({ to: userEmail, subject: email.subject, html: email.html, text: email.text });
  }

  await prisma.integration.update({
    where: { id: integration.id },
    data: { lastSitemapCheckAt: new Date(), lastSitemapIssues: currentKey },
  });

  return { checked: true, issues };
}

/** Runs the hourly issue check across every connected Search Console user who has email
 *  notifications enabled. */
export async function runSitemapMonitor(): Promise<{ checked: number; notified: number }> {
  const integrations = await prisma.integration.findMany({
    where: { provider: "google_search_console", status: "connected", notifyByEmail: true },
    include: { user: true },
  });

  let checked = 0;
  let notified = 0;
  for (const integration of integrations) {
    try {
      const result = await checkSitemapHealthForIntegration(integration, integration.user.email);
      if (result.checked) checked += 1;
      if (result.issues.length > 0) notified += 1;
    } catch (err) {
      console.error(`Sitemap monitor failed for user ${integration.userId}:`, err);
    }
  }
  return { checked, notified };
}

/** Sends one user's weekly report email — totals over the last 7 reported days, indexing summary,
 *  and current sitemap issues (if any) with a link back to resubmit. Skips users whose last
 *  report was sent under 6 days ago, so re-running the cron doesn't double-send. */
export async function sendWeeklyReportForIntegration(integration: {
  id: string;
  userId: string;
  lastReportSentAt: Date | null;
}): Promise<{ sent: boolean }> {
  if (integration.lastReportSentAt) {
    const daysSince = (Date.now() - integration.lastReportSentAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 6) return { sent: false };
  }

  const accessToken = await getValidGoogleAccessToken(integration.userId, "google_search_console");
  if (!accessToken) return { sent: false };

  const sites = await listSearchConsoleSites(accessToken);
  if (sites.length === 0) return { sent: false };

  const githubSelection = await getGitHubSelection(integration.userId);
  const matched = githubSelection ? matchGithubSiteToGscProperty(githubSelection.siteUrl, sites) : null;
  const site = matched ?? sites[0];

  const end = new Date();
  end.setDate(end.getDate() - 3);
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  const toDateString = (d: Date) => d.toISOString().slice(0, 10);

  const [totalsRows, sitemaps] = await Promise.all([
    querySearchAnalytics(accessToken, site.siteUrl, {
      startDate: toDateString(start),
      endDate: toDateString(end),
      dimensions: [],
    }).catch(() => []),
    listSitemaps(accessToken, site.siteUrl).catch(() => []),
  ]);

  const totals = totalsFromRows(totalsRows);
  const totalSubmitted = sitemaps.reduce(
    (sum, sm) => sum + (sm.contents ?? []).reduce((s, c) => s + (parseInt(c.submitted, 10) || 0), 0),
    0
  );
  const totalIndexed = sitemaps.reduce(
    (sum, sm) => sum + (sm.contents ?? []).reduce((s, c) => s + (parseInt(c.indexed ?? "0", 10) || 0), 0),
    0
  );
  const issues = extractIssues(sitemaps);

  const user = await prisma.user.findUnique({ where: { id: integration.userId } });
  if (!user) return { sent: false };

  const email = buildWeeklyReportEmail({
    siteUrl: site.siteUrl,
    totals,
    indexing: { totalSubmitted, totalIndexed },
    issues,
  });
  await sendMail({ to: user.email, subject: email.subject, html: email.html, text: email.text });

  await prisma.integration.update({ where: { id: integration.id }, data: { lastReportSentAt: new Date() } });
  return { sent: true };
}

export async function runWeeklyReports(): Promise<{ sent: number }> {
  const integrations = await prisma.integration.findMany({
    where: { provider: "google_search_console", status: "connected", notifyByEmail: true },
  });

  let sent = 0;
  for (const integration of integrations) {
    try {
      const result = await sendWeeklyReportForIntegration(integration);
      if (result.sent) sent += 1;
    } catch (err) {
      console.error(`Weekly report failed for user ${integration.userId}:`, err);
    }
  }
  return { sent };
}
