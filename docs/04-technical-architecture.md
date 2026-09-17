# Technical Architecture

No code in this document — this defines the system shape so implementation can start from a clear design. See [05-tech-stack.md](05-tech-stack.md) for concrete tool choices.

## High-level shape

Seovate is a **scheduled, multi-stage agent pipeline per customer site**, not a chat-style open-ended agent. This is a deliberate architecture choice: the founder's requirement is "zero human interaction," which means the system must be predictable and boundable, not exploratory. An open-ended autonomous agent that decides what to do next at runtime is harder to constrain against the scaled-content-abuse risk in [08-legal-compliance-risk.md](08-legal-compliance-risk.md) than a fixed pipeline with LLM-powered *steps*

```
[Scheduler] → per customer site, on a cadence (daily/weekly per stage)
     │
     ├─► Stage 1: Crawl & Audit
     │       - Crawl the customer's WordPress site (sitemap-driven, not brute-force)
     │       - Pull Search Console data (queries, indexing status, CWV)
     │       - Pull PageSpeed Insights data
     │       - Output: structured "site health" record, diffed against last run
     │
     ├─► Stage 2: Research
     │       - Keyword/topic research scoped to business profile (services + location)
     │       - SERP analysis for target keywords (competitor content shape, intent)
     │       - Output: prioritized opportunity list (content gaps, technical issues, local opportunities)
     │
     ├─► Stage 3: Generate
     │       - LLM-driven generation of: meta tags, alt text, schema markup, new content drafts,
     │         GBP posts — each a narrowly-scoped prompt/task, not one big "do SEO" prompt
     │       - Deterministic guardrail checks BEFORE anything is queued for publishing:
     │         volume caps, duplicate-content check, minimum content-length/quality heuristics,
     │         banned-pattern check (no keyword stuffing, no thin/templated pages)
     │
     ├─► Stage 4: Publish (the zero-human-interaction step)
     │       - Writes via WordPress REST API (Application Password auth) / GBP API
     │       - Every publish action is logged with: what changed, why (which keyword/issue),
     │         and a rollback reference (previous revision ID)
     │       - Rate-limited per site regardless of how much content Stage 3 produced
     │         (the guardrail lives here too, not just in Stage 3, as defense in depth)
     │
     └─► Stage 5: Measure & Report
             - Re-pull Search Console/rank data on a lag (SEO impact isn't immediate)
             - Attribute movement where possible to prior actions
             - Generate the weekly customer-facing summary (see MVP scope, reporting)
```

## Why a pipeline, not a single "autonomous agent loop"

A single LLM agent with broad tool access (crawl, write, publish) making its own decisions turn-by-turn is the wrong architecture for this product, for three concrete reasons:

1. **Auditability.** Google policy risk and customer trust both require being able to say precisely why a given piece of content or change was made. A fixed pipeline with typed inputs/outputs per stage is trivially auditable; a free-roaming agent's decision trail is not.
2. **Cost control.** SEO actions are inherently low-frequency (you don't need to re-audit a site every hour). A scheduled pipeline lets you use the cheapest model that meets quality bar per stage (see [05-tech-stack.md](05-tech-stack.md)) instead of paying for a large model to sit in a loop "deciding what to do."
3. **Guardrail enforcement.** Hard caps (max N publishes/week) are trivial to enforce as a gate between pipeline stages. They are much harder to guarantee inside an open-ended agent loop that could, in principle, talk itself into more actions.

## Multi-tenancy model

- One pipeline definition, run per-customer-site, isolated by customer ID.
- Each customer's credentials (WP application password, GBP OAuth token, GSC OAuth token) are stored encrypted and scoped — the system should be built from day one so that a bug in one customer's pipeline cannot touch another customer's site (no shared mutable state across tenants; per-tenant job execution).
- Scheduling should be staggered (not all sites processed at the exact same time) both for API rate-limit management (see [06-data-sources-apis.md](06-data-sources-apis.md)) and for cost smoothing (LLM API load spread over the day/week rather than spiky).

## The guardrail layer (the most important non-obvious architectural piece)

Because the entire value proposition depends on zero human review, the system needs an explicit, independent **guardrail/policy layer** that every generated artifact passes through before Stage 4 publishing — not guardrails embedded ad hoc inside prompts. Concretely, this layer should check, deterministically (not via another LLM call, which is a probabilistic check on a probabilistic output — brittle):

- Publish-volume caps (rolling window, per site)
- Minimum content length / structure (reject thin content before it ever reaches WordPress)
- Duplicate/near-duplicate detection against the site's existing content
- A "does this page target a specific, real keyword with real search intent" check (reject generic/templated output)
- Schema/meta validation (valid JSON-LD, title/description length limits)

This layer is what separates "autonomous SEO agent" from "content spam generator" in the eyes of both Google and the customer, and it is the single highest-priority engineering investment in the MVP — more important than making the LLM output "smarter."

## Failure handling

- Every publish action must be reversible: store the pre-change state (previous meta values, previous post revision) so a bad action can be rolled back automatically or manually.
- If a customer's WordPress site is unreachable, returns auth errors, or a plugin conflict is detected, the pipeline should fail safe (skip that stage, alert internally) rather than retry aggressively or degrade its guardrails to "make something work."
- API failures from third-party data providers (DataForSEO, Search Console, etc.) should degrade gracefully — e.g., skip content generation that cycle rather than generate content based on stale/incomplete research.

## Data model (conceptual, not schema-level)

- **Customer / Site**: credentials, business profile, plan tier, guardrail settings.
- **Pipeline Run**: one record per stage execution, with inputs/outputs, timestamps, cost.
- **Action**: one record per autonomous change made (content published, meta updated, GBP post made) — the audit trail and the source for the customer-facing activity log.
- **Opportunity**: the output of Stage 2 (research) — a queue of prioritized, not-yet-acted-on items, so the system's backlog is inspectable even without a UI.
