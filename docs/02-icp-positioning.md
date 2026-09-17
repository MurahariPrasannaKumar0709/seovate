# ICP, Persona & Positioning

## Ideal Customer Profile (v1)

**Who:** Owner-operated local service businesses with a WordPress website, 1–20 employees, who currently do zero or minimal SEO.

Good-fit verticals (WordPress-heavy, high local-search intent, clear revenue-per-customer to justify a monthly tool spend):
- Dentists, chiropractors, med-spas, other local healthcare/wellness practices
- Home services: plumbers, electricians, HVAC, roofers, landscapers
- Law firms (small/solo practices)
- Local restaurants, salons, gyms

**Explicitly not v1 ICP:** e-commerce (different SEO problem — product/category pages, not local), enterprise, marketing agencies as end-customers (agencies are a *distribution channel*, see [10-gtm-marketing-plan.md](10-gtm-marketing-plan.md), but agency needs — white-label, multi-client dashboards — are a v2 problem, not v1).

## Persona: "Dana," the owner-operator

- Owns/runs the business day-to-day; marketing is one of ten hats they wear.
- Has a WordPress site, usually built by a freelancer or agency years ago and barely touched since.
- Knows SEO matters ("I should be ranking higher") but has no time, no expertise, and has been burned by or is wary of expensive agencies.
- Budget reality: 52% of SMBs report marketing budgets under $1,000/month total, 41% under $500/month total (aggregator-sourced, see [01-market-research.md](01-market-research.md)) — SEO is not the only line item competing for that budget.
- Will not log into a dashboard weekly. Wants something that "just works" and periodically tells them results (calls, form fills, ranking improvements), not a tool that demands their attention.

This last point is the core product design constraint: **the dashboard is not the product — the autonomous action is the product.** A tool that requires Dana to review and approve content defeats the purpose; that's the "draft + human approval" model, and Dana has already shown she won't do that (that's why the site hasn't been touched in years).

## Positioning statement

> For local business owners who know they need better SEO but have no time or budget for an agency, Seovate is an autonomous SEO agent that plugs into your WordPress site and Google Business Profile and continuously improves your local search visibility — publishing content, fixing technical issues, and posting to Google — without you lifting a finger. Unlike plugin tools (RankMath, Yoast) that give you AI suggestions you still have to act on, and unlike agencies that charge $1,000+/month for a human to do the same work, Seovate does the work itself, safely and within Google's guidelines, for a fraction of the cost.

## Differentiation vs. the two nearest threats

**vs. RankMath/Yoast AI features ($8–28/mo):** those tools generate *suggestions* — the business owner (who has no time, per the persona above) still has to act on them. Seovate acts. This is the single clearest wedge and should be the headline message everywhere.

**vs. Merchynt / "Paige" ($99+/mo/location):** Merchynt's center of gravity, per available research, is Google Business Profile / local-pack management (posts, reviews, citations, images). Seovate's v1 differentiation is going deeper on **on-site, WordPress-native SEO** — actual blog/service-page content, on-page technical fixes, internal linking, schema markup applied directly to the CMS — which is a different and complementary surface than GBP management. If resources allow, GBP automation (see [06-data-sources-apis.md](06-data-sources-apis.md)) should be added as a v1.x feature specifically to compete head-on, but the wedge message should not be "we're another Merchynt" — it should be "we fix and grow your actual website, not just your Google listing."

## The trust problem, and why it's the real product challenge

Every credible SEO buyer has been burned by, or is skeptical of, "black box" automation — and Google's own scaled-content-abuse policy (see [08-legal-compliance-risk.md](08-legal-compliance-risk.md)) means genuinely reckless autonomous publishing can actively tank a customer's site. The product and the marketing both need to lead with **visible, explainable safety** — a public activity log of every action taken, hard-coded volume/quality guardrails, and a plain-English explanation of why each action was taken — not just a claim of "fully autonomous." This becomes a selling point ("the only autonomous SEO tool that shows its work and won't spam your site") rather than a compliance afterthought.
