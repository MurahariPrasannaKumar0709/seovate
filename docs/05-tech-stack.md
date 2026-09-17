# Tech Stack

Chosen for a solo founder, bootstrapped, <$500/mo budget target at low customer counts, scaling cost roughly linearly with customers/revenue. No code is written here — this names specific tools/frameworks and why, so implementation can start directly from this doc.

## Guiding principles

1. **Managed/serverless over self-hosted infrastructure** wherever possible — a solo founder's scarcest resource is time, not marginal dollars, at MVP scale.
2. **Pay-as-you-go APIs over subscriptions** wherever both exist — matches the "10 customers" starting point better than a flat monthly commit sized for scale not yet reached.
3. **Cheapest model that meets the quality bar, per task** — not one model for everything. This is the single biggest lever on gross margin for an LLM-native product.

## LLM layer (the core "intelligence")

Using the Claude API directly (Messages API + tool use), not a hosted "agent platform," because the pipeline architecture in [04-technical-architecture.md](04-technical-architecture.md) is a set of well-defined stages, not an open-ended agent — plain API calls with structured outputs are the simplest sufficient tool per the "start simple" guidance for this kind of workload.

Current Anthropic API pricing (per 1M tokens, verified as of this session):

| Model | Input | Output | Use in the pipeline |
|---|---|---|---|
| Claude Opus 5 | $5.00 | $25.00 | Content generation (Stage 3) — the task where output quality directly determines whether a page ranks and whether it passes the "real value, not thin content" guardrail. Worth the premium here. |
| Claude Sonnet 5 | $2.00 | $10.00 | Research/audit synthesis (Stage 2), SERP/competitor analysis summarization, GBP post drafting. Good quality/cost balance for structured-but-not-flagship-critical tasks. |
| Claude Haiku 4.5 | $1.00 | $5.00 | High-volume, low-complexity tasks: alt-text generation, meta title/description generation, duplicate-content classification checks. |

Use **prompt caching** aggressively for the business-profile/site-context that's reused across every pipeline run for a given customer (same prefix, changes rarely) — meaningfully cuts input-token cost at scale, and use **Batch API** for non-latency-sensitive bulk tasks (e.g., a first-time full-site audit's meta-tag generation for every existing page) at ~50% cost. Structured outputs (`output_config.format`) should be used for every generation step that feeds the deterministic guardrail layer, so outputs are always parseable, not a free-text response that needs fragile parsing.

**Do not use the LLM as the guardrail.** The guardrail/policy layer described in the architecture doc must be deterministic code (length checks, regex/pattern checks, duplicate detection via embeddings or simple hashing), not another LLM call asked "is this okay?" — probabilistic-checking-probabilistic-output is the wrong reliability model for a zero-human-review publishing system.

## Backend / orchestration

- **Language/runtime:** Node.js/TypeScript or Python — either is fine; pick whichever the founder is more fluent in, since this determines how much external help is needed. (No existing codebase in this repo to constrain the choice.)
- **Job scheduling/orchestration:** a managed queue/cron system (e.g., a hosted service like Trigger.dev, Inngest, or a simple cron-triggered serverless function per pipeline stage) rather than a self-hosted job server — avoids owning infrastructure uptime as a solo founder.
- **Database:** a managed Postgres (e.g., Supabase or Neon) — both have workable free/low tiers for early customer counts, avoid self-hosting a database, and Supabase additionally bundles auth if a customer-facing login is needed for the activity-log page.

## Hosting

- **Application/API hosting:** a managed platform (e.g., Railway, Render, or Vercel for any web frontend) — again prioritizing zero-ops over cost-optimization at this scale; the monthly cost difference between these and self-managed infra is small relative to founder time.
- **Frontend (marketing site + minimal customer activity-log page):** static/server-rendered site on the same or similar managed platform; this site is also the primary GTM asset (see [10-gtm-marketing-plan.md](10-gtm-marketing-plan.md)) so it should itself be built to be genuinely well-optimized — dogfooding starts here.

## Third-party SEO/publishing APIs

See [06-data-sources-apis.md](06-data-sources-apis.md) for the full, sourced breakdown of every external API (DataForSEO, Google Search Console, Google Business Profile, PageSpeed Insights, WordPress REST API) including pricing and access-process caveats — those specifics live there rather than being duplicated here.

## Estimated monthly infra cost at MVP scale (10–30 customers)

Rough, defensible-order-of-magnitude estimate, not a guaranteed figure — actual usage-based costs (LLM tokens, DataForSEO queries) depend heavily on real content volume per site:

| Line item | Est. monthly cost |
|---|---|
| App/DB hosting (managed, low tier) | $0–$50 |
| DataForSEO (SERP + keyword + on-page, pay-as-you-go, light volume) | $30–$100 |
| LLM API (Claude, mixed model usage per table above, ~10–30 sites at MVP content volume) | $50–$200 |
| Domain, email, misc SaaS (transactional email, error monitoring) | $20–$50 |
| **Total** | **~$100–$400/mo** |

This comfortably fits inside the founder's stated <$500/mo budget at MVP scale, with headroom, and scales with paying-customer count rather than being a large fixed commitment upfront — consistent with the bootstrapped-solo-founder resourcing decision.

## What NOT to build in-house for MVP

- No custom web crawler framework — reuse an existing library (open-source Python/Node crawling libraries) or a crawling API rather than building crawl infrastructure from scratch; this is commodity work, not differentiated.
- No custom LLM fine-tuning or hosting — prompt engineering + structured outputs against the Claude API is sufficient and dramatically cheaper/faster to iterate on than training/hosting a custom model.
- No custom analytics/BI platform for the customer-facing report — a simple templated email + static activity-log page beats building a dashboard product nobody asked for (per the persona in [02-icp-positioning.md](02-icp-positioning.md), Dana won't log in anyway).
