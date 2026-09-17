# MVP Scope

Principle: every feature in v1 must (a) be autonomous with zero human approval, (b) be individually low-risk if it goes wrong, and (c) be something Dana (see [02-icp-positioning.md](02-icp-positioning.md)) would notice and value without logging into a dashboard.

## In scope for MVP

### 1. Onboarding (one-time human setup, then autonomous)
- Connect WordPress site via Application Password (self-serve, guided flow — see [07-cms-publishing-safety.md](07-cms-publishing-safety.md)).
- Connect Google Search Console (OAuth) — required for baseline rankings/traffic and indexing signals.
- Connect Google Business Profile (OAuth + API application process — see [06-data-sources-apis.md](06-data-sources-apis.md); this has a ~7–10 business day Google review lag, so **the product must be useful on WordPress alone before GBP access is approved**).
- Basic business profile: services offered, target locations, a few example customer questions ("what makes you different"). This seeds keyword targeting.

### 2. Autonomous technical SEO fixes (highest-value, lowest-risk starting point)
- Missing/duplicate meta titles & descriptions → auto-generated and written back via REST API.
- Missing alt text on images → auto-generated.
- Broken internal links → detected and either fixed or flagged.
- Missing/invalid schema markup (LocalBusiness, Service, FAQ) → auto-injected.
- Core Web Vitals / PageSpeed issues surfaced via PageSpeed Insights API → flagged with fix where safe to automate (e.g., image compression suggestions), otherwise surfaced as a report item (not auto-fixed if it requires touching theme/plugin code — too risky for zero-review v1).

This category ships first because it's reversible, low-volume (doesn't trigger scaled-content-abuse concerns), and immediately demonstrable ("we found and fixed 14 SEO issues on your site this week").

### 3. Autonomous content publishing (the core differentiator, shipped with hard guardrails)
- Keyword/topic research scoped to the business's services + location (via DataForSEO or equivalent — see [06-data-sources-apis.md](06-data-sources-apis.md)).
- LLM-generated service pages / blog posts, published directly via WordPress REST API.
- **Hard-coded volume cap in v1: e.g., max 2–4 new pieces of content per week per site.** This is a deliberate, defensible-by-design limit against Google's scaled-content-abuse policy (see [08-legal-compliance-risk.md](08-legal-compliance-risk.md)) — not a technical limitation, a policy-risk mitigation that should be explicit in the product and the marketing.
- Every piece of content is tied to a real, specific local keyword/intent (not generic filler) — enforced by the generation pipeline, not left to the LLM's discretion.

### 4. Local presence (Google Business Profile posts) — v1.x, gated on API approval
- Auto-publish "What's New" GBP posts tied to services/seasonal relevance.
- Auto-generated review responses (draft-and-send, since GBP API supports this).
- Shipped after core WordPress functionality, both because of the API approval lag and because it's the area where Merchynt already has a head start — better to be genuinely good at it on a slightly later timeline than to ship a weak version fast.

### 5. Reporting (the only "dashboard" feature in v1)
- Weekly automated email: "here's what Seovate did this week" (content published, fixes made, ranking movement) + a simple public-facing activity log page. No login required to see it — reduces friction and builds the trust story from [02-icp-positioning.md](02-icp-positioning.md).
- Rank tracking for a small set of target keywords (via SERP API) shown as simple before/after, not a complex dashboard.

## Explicitly out of scope for MVP

- **Multi-CMS support** (Shopify, Wix, Squarespace, custom sites) — WordPress only. Revisit after PMF.
- **Link building / outreach automation** — high-risk, low-trust category (easy to look spammy, easy to violate policy), and not needed to prove the core value prop.
- **Agency/white-label features** (multi-client management, reseller dashboards) — real GTM channel later (see [10-gtm-marketing-plan.md](10-gtm-marketing-plan.md)) but a distinct product surface; don't build until direct-to-SMB PMF is proven.
- **Paid ad management (Google Ads/Meta)** — different product entirely (PPC, not SEO); scope creep to avoid.
- **Human review/approval workflows** — explicitly rejected per the founder's decision; if this is added later as an option, it's a segmentation decision (some customers may want a "review" tier), not a v1 feature.
- **Custom/enterprise integrations, API access for customers, white-glove onboarding calls** — anything that doesn't scale to a solo founder serving many SMB customers simultaneously.

## MVP success criteria (what "done" means)

Not a private beta with friends — the founder's brief is explicit that this needs real users and real revenue. MVP is "done" and ready for the next phase when:
- At least 10 paying customers are live on the platform, each with autonomous actions actually running on their real site.
- At least one documented case of a measurable ranking/traffic improvement attributable to Seovate's actions, verified via Search Console data (not just "trust us").
- Zero incidents of Google action/penalty or customer-visible site breakage caused by an autonomous action — the guardrails in [07-cms-publishing-safety.md](07-cms-publishing-safety.md) and [08-legal-compliance-risk.md](08-legal-compliance-risk.md) have to actually hold up against real usage, not just look good on paper.
