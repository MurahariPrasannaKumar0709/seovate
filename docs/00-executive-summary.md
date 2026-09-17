# Executive Summary

## The pitch

Seovate is an autonomous SEO agent for small, local businesses (dentists, contractors, salons, restaurants, local service providers) that connects directly to a business's WordPress site and Google Business Profile, and then runs their SEO — keyword research, content publishing, on-page fixes, local citation/GBP posts, rank tracking — continuously, with no human in the approval loop after initial setup. It is priced and scoped to sit in the gap between a $10/mo plugin (does nothing on its own) and a $1,000–$3,000/mo agency retainer (does everything, but with a human and a high price tag)[^pricing-gap].

## Why now

- LLMs (Claude, GPT) are now cheap and reliable enough to write, structure, and publish genuinely usable SEO content and metadata at a marginal cost of cents per page, not dollars.
- WordPress already ships a first-class mechanism for zero-human-interaction publishing (Application Passwords, built into core since WP 5.6) — no fragile scraping or plugin hacking required[^wp-app-pw].
- SEO data (SERP, keyword, backlink) is available via pay-as-you-go APIs like DataForSEO at fractions-of-a-cent per query, which did not exist at this price point five years ago[^dataforseo].
- 61% of small businesses report having made no investment in SEO at all, and over half have marketing budgets under $1,000/month — they are priced out of agencies and don't have time to run tools themselves[^biziq]. That's the wedge.
- The market is heating up (Merchynt, Okara, Sunbeam, NoimosAI all launched or expanded "autonomous AI SEO agent" positioning in 2025–2026) — this validates the thesis, but means the window to establish a beachhead in the SMB/local segment is now, not later.

## Why this is winnable bootstrapped, by a solo founder

- The core loop (crawl → research → generate → publish → measure) is a workflow, not a research problem — it can be built on existing LLM APIs and existing SEO data APIs, not custom ML.
- Zero-human publishing to WordPress removes the single biggest cost driver of traditional SEO services: a human's time reviewing and hand-publishing content.
- A single vertical CMS focus (WordPress) covers roughly 43% of all websites and the overwhelming majority of small-business sites — this is enough addressable market for years without needing multi-CMS support in v1.
- The product doubles as its own marketing channel: if Seovate can't rank Seovate's own site, it isn't credible. This is the cheapest and most defensible GTM channel available to a bootstrapped SEO tool.

## Why this is risky, honestly

- Google's Spam Policies explicitly call out "scaled content abuse," including "using generative AI tools... to generate many pages without adding value for users," and applies "regardless of whether automation, humans, or a combination are involved."[^spam-policy] Fully autonomous publishing at scale is exactly the shape of behavior this policy targets. The MVP must be designed around defensible content quality and volume limits, not just "can we technically auto-publish," or the product actively harms customers' rankings — see [08-legal-compliance-risk.md](08-legal-compliance-risk.md).
- Google Business Profile API access now requires an application/review process (verified profile, documented use case, ~7–10 business day review)[^gbp-api] — this is a real onboarding dependency, not a same-day integration.
- Direct, competent competitors already exist targeting this exact niche (Merchynt's "Paige" agent claims near-zero-touch local SEO automation at $99/mo/location)[^merchynt]. Differentiation has to be real, not just claimed — see [02-icp-positioning.md](02-icp-positioning.md).

## What "MVP" means here

Not a demo. A narrow, real product: one CMS (WordPress), one geography focus (local/US to start), a tightly scoped set of autonomous actions that are individually low-risk and individually valuable, sold to real small businesses for real recurring revenue, starting in weeks not quarters. See [03-mvp-scope.md](03-mvp-scope.md) for exact scope.

---

[^pricing-gap]: See [09-pricing-monetization.md](09-pricing-monetization.md) for full pricing benchmark sourcing (RankMath/Yoast $8–28/mo; SE Ranking/Mangools ~$19–100+/mo; local SEO agencies $700–$2,500/mo, SEOProfy / EvenDigit 2026 benchmarks).
[^wp-app-pw]: WordPress core Application Passwords, documented at developer.wordpress.org/rest-api/using-the-rest-api/authentication/ — no plugin required since WP 5.6.
[^dataforseo]: DataForSEO pricing: Google Organic SERP from $0.6/1,000 requests (Standard queue); dataforseo.com/pricing.
[^biziq]: BiziQ "Local SEO Statistics 2026" — aggregator source, figures not traced to a primary research firm; treat as directional. See [01-market-research.md](01-market-research.md).
[^spam-policy]: Google Search Central, Spam Policies for Google Web Search, "Scaled content abuse" section — developers.google.com/search/docs/essentials/spam-policies.
[^gbp-api]: Google Business Profile API prerequisites — developers.google.com/my-business/content/prereqs.
[^merchynt]: Merchynt "Paige" agent positioning and pricing per merchynt.com marketing/comparison pages (vendor-asserted, not independently audited) — see [01-market-research.md](01-market-research.md).
