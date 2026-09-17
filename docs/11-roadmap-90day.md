# 90-Day Roadmap

Sequenced for a solo, bootstrapped founder. Each phase produces something sellable/demonstrable, not just internal progress — consistent with the founder's directive that this needs real users and real revenue, not a long silent build phase.

## Phase 1 (Weeks 1–3): Audit engine + GTM foundations, in parallel

**Build:**
- Stage 1 (Crawl & Audit) and the technical-fix category from [03-mvp-scope.md](03-mvp-scope.md) — this is the fastest-to-build, lowest-risk, most-demonstrable piece (no autonomous publishing yet, just detection + reporting), and doubles as the cold-outreach hook in [10-gtm-marketing-plan.md](10-gtm-marketing-plan.md).
- WordPress Application Password onboarding flow, with least-privilege user setup per [07-cms-publishing-safety.md](07-cms-publishing-safety.md).
- Search Console OAuth integration (baseline data + measurement foundation).
- Apply for Google Business Profile API access immediately (the ~7–10 business day review means this should start in week 1, not when GBP features are actually being built — see [06-data-sources-apis.md](06-data-sources-apis.md)).

**GTM (starts immediately, not after building):**
- Start the dogfooding site and its own content/SEO effort (Channel 1).
- Begin genuine participation in r/SEO, r/smallbusiness, Indie Hackers (Channel 2) — trust-building, no pitching yet.

## Phase 2 (Weeks 4–6): Autonomous technical fixes go live + first real customers

**Build:**
- Auto-fix write-back via WordPress REST API (meta tags, alt text, schema) with the full guardrail/reversibility layer from [07-cms-publishing-safety.md](07-cms-publishing-safety.md) — this is the first autonomous, zero-human-review publishing capability, and it ships before content generation specifically because it's lower-risk (structural fixes, not new pages) and thus a safer place to prove the guardrail system works in production.
- Weekly reporting email + public activity log (MVP's only "dashboard" surface).

**GTM:**
- Begin personalized cold outreach (Channel 3) using the audit engine itself to generate the pitch — target 1–2 verticals only.
- **Goal: first paying customer by end of Phase 2.** Manually onboard them personally (a solo founder doing white-glove setup for the first handful of customers is correct at this stage, even though it doesn't scale — the goal here is validating the guardrails on real sites, not scaling yet).

## Phase 3 (Weeks 7–10): Autonomous content publishing goes live

**Build:**
- Stage 2 (Research) and Stage 3 (Generate) from [04-technical-architecture.md](04-technical-architecture.md) — keyword/topic research and LLM content generation, gated behind the full guardrail layer (volume caps, quality floor, duplicate detection) before Stage 4 publishing is allowed to touch this new capability.
- This phase carries the most policy/reliability risk in the entire roadmap (per [08-legal-compliance-risk.md](08-legal-compliance-risk.md)) — do not rush it to hit a date; the guardrail layer must genuinely hold up on the existing paying customers' real sites before expanding.

**GTM:**
- Continue outreach and community presence.
- Start capturing the first measurable ranking/traffic win (Search Console before/after) from an early customer — this becomes the core proof point for all future marketing copy and outreach.

## Phase 4 (Weeks 11–13): GBP/local feature (if API access has cleared) + push toward 10 customers

**Build:**
- If Google Business Profile API access has been approved (applied for in Phase 1), ship the GBP posting/review-response feature and the $49/mo add-on from [09-pricing-monetization.md](09-pricing-monetization.md).
- If not yet approved, this phase becomes hardening/iteration on the existing product based on real customer feedback from Phases 2–3 — a legitimate and expected outcome, not a failure, given the API's documented review lag.

**GTM:**
- Evaluate a Product Hunt launch (Channel 5) only if the product is genuinely demo-ready with a fast "wow" moment.
- **Target: 10 paying customers, ~$1,000 MRR — the MVP success criteria from [03-mvp-scope.md](03-mvp-scope.md).**

## What "success at day 90" looks like

- 10+ real paying customers on real live WordPress sites, autonomous actions genuinely running unattended.
- Zero guardrail-failure incidents (no site breakage, no evident Google penalty traceable to Seovate's actions).
- At least one documented, Search-Console-verified ranking or traffic improvement to point to in all future marketing and outreach.
- A GTM channel that's showing early repeatability (not just founder-led one-off outreach) — community presence and/or dogfooding content starting to produce inbound interest.
- Clear, evidence-based answer to "should we now build the agency/white-label channel, push GBP harder, or expand verticals" — a decision made from real data, not guesswork, which is the actual point of an MVP.

## What to explicitly resist doing in these 90 days

- Building multi-CMS support before WordPress is proven.
- Building agency/white-label features before direct-to-SMB traction exists.
- Chasing an AppSumo/LTD launch before the guardrail system has real-world proof.
- Adding a "human review" option — that's a valid future segmentation decision, but adding it now would undermine the entire zero-human-interaction thesis this MVP exists to test.
