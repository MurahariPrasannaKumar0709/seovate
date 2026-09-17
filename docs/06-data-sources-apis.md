# Data Sources & APIs

Every figure below is from live research (2026-09-11). Anything not independently confirmed is explicitly flagged — re-verify before committing spend or writing contracts against these numbers.

## Keyword / SERP / rank data

| API | What it provides | Pricing (sourced) | Notes |
|---|---|---|---|
| **DataForSEO** | SERP, Keywords Data, backlinks, On-Page crawl API | Pay-as-you-go, no subscription, $50 min deposit. Google Organic SERP: Standard $0.6/1,000 requests, Priority $1.2/1,000, Live $2/1,000. Backlinks: $0.024/request + $0.000036/data row. On-Page crawl: ~$0.000125–$0.00425/page depending on rendering. | **Recommended primary data provider** — cheapest verified pay-as-you-go option, no big subscription commit, fits bootstrapped budget. |
| SEMrush API | Keyword/SERP/domain data | Requires Advanced plan ($549/mo) as entry point; per-unit API pricing not publicly published (quote-gated) | Too expensive as an MVP entry point; revisit only if a specific dataset is unavailable elsewhere. |
| Ahrefs API v3 | Keyword/SERP/backlink data | Bundled in subscription; Lite $129/mo = 100k units/mo | Same issue — subscription-gated, not pay-as-you-go; revisit post-revenue. |
| SerpApi | SERP scraping-as-a-service | Free tier 250 searches/mo; Starter $25/mo (1,000 searches) up to $275/mo (30,000) | Viable alternative/backup to DataForSEO for SERP-specific needs. |
| Keywords Everywhere | Keyword volume/CPC/competition | Credit-based, annual: $84/yr (100k credits) to $1,440/yr (8M) | Cheap for light keyword-volume lookups; credits expire yearly (a real commitment risk if usage is bursty). |
| Google Keyword Planner (via Google Ads API) | Keyword volume (Google's own data) | Free to use, but requires an active Google Ads account + developer token; token access now tiered (Test/Basic/Standard) with brand verification for higher tiers | Best-quality free keyword data if the account/token hurdle is cleared — worth doing once, not per-customer. |
| Google Trends | Trend data | **No general-availability official API as of Sept 2026** — official API is alpha/application-gated; unofficial libraries (e.g. pytrends) are the practical fallback | Do not build a load-bearing feature on an unofficial Trends scraper; treat as nice-to-have, not core. |

## Google's official free/low-cost APIs (core to the product)

| API | What it does | Access & quotas | Critical caveat |
|---|---|---|---|
| **Search Console API** | Query/click/impression/position data by page & query; sitemap submission; URL Inspection | OAuth2, free. Search Analytics: 1,200 QPM/site-user, 30M QPD project-wide. URL Inspection: 2,000 QPD/site, 600 QPM/site. | Core to Stage 1 (audit) and Stage 5 (measure) in the architecture — this is the ground truth for "did our changes work." |
| **Google Business Profile API** | Locations, Posts, media, reviews/replies, hours, attributes | Requires "Basic API Access" application: verified GBP profile 60+ days old, GCP project, documented use case, **~7–10 business day review**. Video posts unsupported. | **This is a real onboarding dependency, not a same-day integration** — must be applied for early (before first customer onboarding, ideally before launch) since it gates the local/GBP feature set in [03-mvp-scope.md](03-mvp-scope.md). |
| **PageSpeed Insights API** | CrUX field data + Lighthouse lab data (Core Web Vitals) | Free; commonly cited quota (~25,000/day) is **not confirmed on an official page** — unverified, budget conservatively | Feeds the technical-SEO audit stage. |
| **Google Indexing API** | Request expedited crawling of a URL | Free, 200 publish requests/day/project default | **Critical limitation, verified directly from Google docs: officially restricted to pages with JobPosting or BroadcastEvent structured data only.** It cannot legitimately be used to force-index arbitrary new blog/service pages. Do not architect any feature around "we'll instantly index your new content via the Indexing API" — that would misrepresent what the API is for and risks API access being revoked. Rely on sitemap submission + normal crawl instead. |
| Rich Results Test | Structured data validation | **No standalone public API** — closest option is Search Console URL Inspection API, but only for already-indexed URLs in a verified property | For pre-publish schema validation, validate against the JSON-LD spec directly (deterministic, in the guardrail layer) rather than depending on a Google validation API that doesn't exist in the needed form. |

## Technical crawling

- Build on an existing open-source crawling library (Python: Scrapy/BeautifulSoup+requests; Node: Crawlee/Playwright) rather than a paid crawling service for the core site-audit function — this is commodity capability and the sites being crawled are small (SMB sites, not enterprise-scale).
- DataForSEO's On-Page API is a viable low-cost alternative if avoiding self-hosted crawling infrastructure is worth the small per-page cost (~fractions of a cent).
- Screaming Frog CLI (~€245/yr, unlimited) is a reasonable manual/semi-automated fallback for one-off deep audits but is a desktop tool, not built for multi-tenant automated pipelines — not recommended as the core engine.

## WordPress integration (the core publishing mechanism)

- **Application Passwords**, built into WordPress core since version 5.6 — no plugin required. This is the correct, supported, zero-human-interaction authentication mechanism for the REST API (`wp/v2/posts` and related endpoints support full CRUD). Confirmed directly from WordPress developer documentation.
- **No native rate limiting** at the WordPress core level (individual hosts may impose their own) — the system's own guardrail layer (see [04-technical-architecture.md](04-technical-architecture.md)) is the actual rate control, not something to rely on WordPress or the host to enforce.
- **Important gotcha, verified:** Yoast/RankMath SEO meta fields (the actual title/meta-description fields those plugins use) are **not exposed via the REST API by default**. If a customer already has Yoast or RankMath installed (likely, given their popularity), Seovate either needs plugin-specific REST support or must register the relevant post meta fields (`register_post_meta`) to be able to autonomously update SEO metadata through the existing plugin's fields, rather than writing to WordPress's native (and less commonly used) title/excerpt fields. **This must be handled explicitly during onboarding detection — check what SEO plugin (if any) is installed and adapt accordingly** — it is a real integration risk, not an edge case, given how common these plugins are.

## Shopify (out of scope for MVP, documented for future reference)

- New public apps must use the **GraphQL Admin API** (REST Admin API is legacy as of Oct 2024). Product `seo` (title/description) and `handle` (slug) fields are directly accessible. Custom apps can use a static access token post-authorization (no full OAuth flow needed) — this would support autonomous updates similarly to WordPress if/when e-commerce is added post-MVP.

## Google policy note (cross-reference)

Google's Spam Policies explicitly define "scaled content abuse" to include generative-AI-produced pages "without adding value for users," applying "regardless of whether automation, humans or a combination are involved" — quoted directly from Google Search Central documentation. This is not a data-source API concern but directly shapes how every API above should be used (e.g., why the Indexing API misuse risk above matters, why volume caps exist in the architecture). Full treatment in [08-legal-compliance-risk.md](08-legal-compliance-risk.md).
