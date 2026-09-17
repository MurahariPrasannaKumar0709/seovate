# Pricing & Monetization

## Market pricing benchmarks (sourced)

| Tier | Examples | Monthly price (sourced) |
|---|---|---|
| DIY plugin (suggestions only, human still acts) | RankMath Pro, Yoast Premium | $8–$28/mo |
| Mid-tier SEO SaaS (tools, not automation) | Mangools, SE Ranking | ~$19–$100+/mo |
| Autonomous/near-autonomous AI SEO agent | Merchynt (Paige) | From $99/mo/location |
| Freelance SEO service | — | ~$1,350/mo average (SEOProfy/EvenDigit 2026 benchmarks) |
| Local SEO agency (full service) | — | $700–$2,500/mo typical; 68% of small businesses reportedly pay $1,000–$3,000/mo (Search Engine Journal, per aggregator citation) |
| Managed local-SEO platform (done-for-you) | BrightLocal managed | $799–$1,299/location/mo |

**Reading:** there's a real, wide gap between the $8–30/mo plugin tier (where the customer still does the work) and the $700+/mo agency tier (where a human does the work). The $99–$250/mo band is where "autonomous agent" products are already landing (Merchynt at $99/mo/location; Okara at a contested $99–$249/mo). This is the validated positioning band for Seovate.

## Recommended MVP pricing

**Single core plan, priced to be a no-brainer replacement for "doing nothing" (the 61% baseline) and a clear discount vs. an agency, while still being sustainable given real LLM/API marginal cost per site (see [05-tech-stack.md](05-tech-stack.md)):**

- **Seovate Core — $99/mo per site.** Matches the validated competitive price point (Merchynt), includes: technical SEO auto-fixes, autonomous content publishing (within volume caps), weekly reporting/activity log, rank tracking for a defined keyword set.
- **GBP/local add-on — $49/mo** (once the Google Business Profile API integration ships, per [03-mvp-scope.md](03-mvp-scope.md)) — keeps the core plan launchable before GBP API approval lands, and lets local-pack-focused customers pay for exactly the feature that competes most directly with Merchynt.
- No lower "starter" tier at MVP — a cheaper tier invites the "suggestions only" comparison to RankMath/Yoast that Seovate is explicitly differentiating against (see [02-icp-positioning.md](02-icp-positioning.md)); better to be unambiguously "does the work" at one clear price than to create a confusing ladder this early.

**Why not price lower to undercut everyone:** at $99/mo, ~30 customers is $2,970 MRR — enough to matter to a solo founder and to validate willingness-to-pay meaningfully, while still being a fraction of agency cost for the customer. Racing to the bottom against $8/mo plugins would put Seovate in a category (and cost structure) it can't win from, since actual autonomous LLM-driven work costs real marginal dollars per site, unlike a static plugin.

## Unit economics sanity check (per site, per month, rough)

| Item | Est. cost |
|---|---|
| LLM API usage (mixed models, MVP content volume per site) | ~$3–$10 |
| DataForSEO usage (keyword/SERP research per site) | ~$2–$8 |
| Hosting/infra amortized per site at 10–30 customer scale | ~$5–$15 |
| **Total marginal cost per site** | **~$10–$35/mo** |
| **Price** | **$99/mo** |
| **Gross margin** | **~65–90%**, improving further as fixed hosting cost amortizes across more customers |

This is a healthy SaaS-like margin even before scale efficiencies (prompt caching, batch API discounts per [05-tech-stack.md](05-tech-stack.md)) are fully optimized — pricing has real room, not a knife's-edge economics story.

## Free trial vs. no-CC trial

Sourced data point: opt-in/no-credit-card trials convert at ~8.9%, credit-card-required trials at ~31.4% — nearly 3x difference on the same traffic (Userpilot 2025 benchmark). **Recommendation: require a card for trial signup**, but make the trial genuinely demonstrate value fast (the technical-fix category in [03-mvp-scope.md](03-mvp-scope.md) is the right trial-week feature — visible, fast, low-risk, "look what we already found and fixed" within days) rather than relying on a long free period to build trust.

## AppSumo / lifetime deal — a real but risky lever, not for MVP launch

Research finding: LTD marketplaces split revenue roughly 60% platform / 40% maker, typical SEO-tool LTD price points $39–$99 one-time, and can rapidly build an initial user base (cited example: one tool went from 50 to 6,000 users in two months via AppSumo). But roughly a third of LTD-listed products later struggle or shut down, often because lifetime customers create disproportionate support load while permanently forgoing recurring revenue.

**Recommendation:** do not launch on AppSumo first. Prove the core autonomous-publishing guardrails are safe and reliable on a small number of full-price monthly customers first (the MVP success criteria in [03-mvp-scope.md](03-mvp-scope.md) — zero incidents, real ranking wins). An LTD push is a legitimate later lever for a cash injection and initial scale (e.g., once the product can safely absorb a volume of new sites at once), not a way to validate a product whose core risk is unattended production writes to customer websites.

## Revenue milestones (tied to the roadmap in [11-roadmap-90day.md](11-roadmap-90day.md))

- **First dollar:** 1 paying customer, price validated, guardrails proven on one real live site.
- **First $1,000 MRR:** ~10 customers at $99/mo — the MVP success threshold from [03-mvp-scope.md](03-mvp-scope.md).
- **First $5,000 MRR:** ~50 customers — likely requires the GBP add-on shipped and at least one working GTM channel proven repeatable (see [10-gtm-marketing-plan.md](10-gtm-marketing-plan.md)), not just founder-led manual outreach.
