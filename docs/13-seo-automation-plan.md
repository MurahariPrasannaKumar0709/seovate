# SEO Automation Plan

Every manual step documented in [12-traditional-seo-approach.md](12-traditional-seo-approach.md)
gets automated here. This is the implementation-level plan: for each traditional
activity, what triggers it, which API/data source feeds it, what the guardrail
layer checks before it acts, and what (if anything) still needs a human. Cross-
references [04-technical-architecture.md](04-technical-architecture.md) (the
5-stage pipeline) and [06-data-sources-apis.md](06-data-sources-apis.md) (the APIs
themselves) throughout — this doc is the "how each traditional task maps to the
pipeline," not a re-derivation of either.

**Ground rule carried over from [03-mvp-scope.md](03-mvp-scope.md):** everything
below runs with zero human approval **except one deliberate exception** — creating
or restructuring files in a connected code repository (sitemap.xml, robots.txt,
schema files) always goes through a pull request the user merges themselves. That
exception is scoped narrowly on purpose; it does not extend to routine on-page
fixes or content publishing, which is the entire competitive thesis in
[02-icp-positioning.md](02-icp-positioning.md). See section 7.

## 1. Technical SEO audit → automated

| Traditional manual step | Automated equivalent |
|---|---|
| Run Screaming Frog / Ahrefs Site Audit by hand | Scheduled crawl, sitemap-driven (not brute-force), built on an open-source crawler (Scrapy/Playwright/Crawlee per [06-data-sources-apis.md](06-data-sources-apis.md)) |
| Manually read the crawl report for missing/duplicate meta, alt text, broken links, schema | Automated diff against the previous run's "site health" record — only new/changed issues surface, not the same list every week |
| Pull Core Web Vitals from PageSpeed Insights, page by page | Automated PageSpeed Insights API pull, batched across the site |
| Cross-reference indexing status in Search Console | Automated Search Console API pull (queries, indexing status, CWV) |
| Compile findings into a spreadsheet/PDF | Structured record feeding directly into the public activity log — no separate report format to maintain |
| **For a repo-based site:** manually check whether sitemap.xml / robots.txt / structured-data files exist | Automated repo scan on GitHub connect — flags missing/outdated files, but **stops short of writing anything** until the user approves via the PR consent flow (section 7) |

**Pipeline stage:** Stage 1 (Crawl & Audit), on a recurring schedule per site (not
a one-time thing like the traditional first audit — every run diffs against the
last one).

## 2. Keyword & topic research → automated

| Traditional manual step | Automated equivalent |
|---|---|
| Brainstorm candidate keywords from services + location | Seeded automatically from the business profile captured at onboarding (services, target locations, example customer questions) |
| Look up volume/difficulty/CPC in Ahrefs/Semrush/Keyword Planner | DataForSEO API call, scoped to the business's services + location — no manual tool switching |
| Manually check the live SERP for each keyword to see what content shape ranks | Automated SERP analysis via DataForSEO — competitor content shape and intent extracted programmatically |
| Build a keyword-to-page map / spot content gaps by eye | Automated cross-reference: existing pages (from Stage 1's crawl) vs. keyword list → a prioritized "Opportunity" queue (the data model's `Opportunity` entity in [04-technical-architecture.md](04-technical-architecture.md)) |

**Pipeline stage:** Stage 2 (Research). Where the traditional version is redone
"every few months," this runs on a regular schedule so opportunities don't go
stale.

## 3. On-page optimization & content creation → automated

| Traditional manual step | Automated equivalent |
|---|---|
| Rewrite title tags/meta descriptions by hand | LLM-generated, narrowly-scoped prompt per field (not one "do SEO" prompt) — written back via WordPress REST API |
| Hand-edit JSON-LD for schema markup | LLM-generated schema (LocalBusiness, Service, FAQ), validated against the JSON-LD spec deterministically before publish |
| Add alt text image by image | LLM-generated alt text, batched across all images missing it |
| Write a new page/blog post targeting a keyword | LLM-generated draft from the Stage 2 opportunity + real search intent, not generic filler |
| Manually add internal links from relevant existing pages | Automated internal-linking pass — candidate link targets identified from the site's own crawled structure |
| Log into WordPress, paste content in, hit Publish | Direct write via WordPress REST API (Application Password auth) — **this step never asks for approval**, it's the core "acts, doesn't suggest" wedge |

**Before any of this reaches WordPress**, it passes the guardrail layer
(deterministic, not another LLM call) from [04-technical-architecture.md](04-technical-architecture.md):
publish-volume cap (2–4 new pieces/week, hard-coded), minimum content length/
structure, duplicate/near-duplicate detection, a real-keyword/real-intent check,
schema/meta validation. This guardrail layer is standing in for the editorial
judgment a good human writer/editor applies naturally — it's the single most
important piece of engineering in the whole system, more so than content quality
itself.

**Pipeline stage:** Stage 3 (Generate) → Stage 4 (Publish).

## 4. Local SEO / Google Business Profile → automated

| Traditional manual step | Automated equivalent |
|---|---|
| Log into GBP manager weekly, post a "What's New" update | Auto-generated and auto-published GBP posts, tied to services/seasonal relevance |
| Monitor and respond to new reviews within a day or two | Auto-generated review responses, draft-and-send (GBP API supports this directly) |
| Keep hours/categories/photos current | Not automated in v1 — profile fields stay whatever the customer set; revisit post-MVP if it becomes a real gap |
| Build/monitor local citations across directories | **Explicitly out of scope for MVP** (see [03-mvp-scope.md](03-mvp-scope.md)) — high-effort, low-trust category, not part of the wedge |

**Pipeline stage:** the v1.x GBP feature, gated on Google's ~7–10 business day API
approval lag — the product must already be useful on WordPress alone before this
lands, so it's additive, not a dependency for launch.

## 5. Measurement & reporting → automated

| Traditional manual step | Automated equivalent |
|---|---|
| Manually pull rankings in Search Console or a rank tracker | Automated Search Console + SERP API re-pull, on a lag (SEO impact isn't immediate — the system waits appropriately rather than reporting noise) |
| Compare month-over-month by hand | Automated attribution: ranking/traffic movement linked back to the specific prior action that plausibly caused it, where possible |
| Write a client-facing report | Auto-generated weekly email ("here's what Seovate did this week") + the public activity log page — no login required, updated continuously rather than once a month |

**Pipeline stage:** Stage 5 (Measure & Report).

## 6. Cadence: traditional vs. automated

| Activity | Traditional cadence | Automated cadence |
|---|---|---|
| Technical audit | Once, or quarterly | Continuous, diffed every run |
| Keyword research | Once per quarter | Recurring, opportunity queue kept fresh |
| Content publishing | Irregular, bottlenecked by writer time/budget | Fixed cap, 2–4 pieces/week, every week |
| GBP posts/reviews | Weekly *if disciplined* (often isn't) | Weekly, unconditionally |
| Reporting | Monthly | Weekly email + always-current activity log |

The automation doesn't add new SEO activities beyond what a good traditional
process already does — it removes the two bottlenecks that kill it for a solo
owner (the writer's time, and the owner's attention to review/approve anything)
and runs the same five phases on a tighter, unbroken schedule.

## 7. What still involves a human — the narrow exceptions

Everything above ships with **zero human approval**, per the founder's locked-in
decision. Two categories are the deliberate exceptions, and neither weakens that
thesis for routine SEO work:

- **One-time setup, not ongoing operation.** Connecting WordPress/Search Console/
  GBP, and answering the business-profile questions, happens once at onboarding —
  a human has to authorize access, but Seovate doesn't ask permission for what it
  does with that access afterward.
- **GitHub repo file scaffolding.** If a customer's site or content pipeline lives
  in a code repo (not WordPress admin), creating or restructuring files —
  sitemap.xml, robots.txt, structured-data files — always goes through a pull
  request the user reviews and merges themselves; Seovate never commits directly.
  This is scoped narrowly to *new/structural file changes in code*, not to any
  routine SEO action — see the onboarding/GitHub wireframes for the exact consent
  flow (repo scan → review diffs → open PR → user merges).

Anything not in this section — technical fixes, content publishing, GBP posts and
review replies, reporting — runs autonomously, on schedule, with no approval step,
because that autonomy is the product.
