export const GOOGLE_INTEGRATION_SCOPES = {
  // Read-write: submitting/resubmitting a sitemap (sites.sitemaps.submit) is a write call and
  // 403s under the readonly scope — everything else this app does (analytics queries, sitemap
  // listing) still works fine under the broader scope.
  google_search_console: "https://www.googleapis.com/auth/webmasters",
  google_analytics: "https://www.googleapis.com/auth/analytics.readonly",
  google_business_profile: "https://www.googleapis.com/auth/business.manage",
} as const;

export type GoogleIntegrationProvider = keyof typeof GOOGLE_INTEGRATION_SCOPES;

export const INTEGRATION_PROVIDERS = [...Object.keys(GOOGLE_INTEGRATION_SCOPES), "github"] as const;

export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export function isIntegrationProvider(value: string): value is IntegrationProvider {
  return (INTEGRATION_PROVIDERS as readonly string[]).includes(value);
}

export function isGoogleIntegrationProvider(
  value: IntegrationProvider
): value is GoogleIntegrationProvider {
  return value in GOOGLE_INTEGRATION_SCOPES;
}
