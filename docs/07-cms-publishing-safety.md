# CMS Publishing & Safety Rails

This is the document that makes "zero human interaction" responsible rather than reckless. Direct CMS publishing with no human review is the founder's explicit choice — this doc defines the guardrails that make that choice safe for customers, defensible to Google, and safe for the business (liability).

## The core risk being managed

Autonomous, credentialed write-access to a customer's live production website, running unattended, is the highest-blast-radius part of this entire product. A bug or a bad LLM output here doesn't just produce a wrong answer in a chat window — it can break a real small business's website or get it penalized by Google. This document is not optional polish; it is load-bearing for whether the product is safe to sell at all.

## Onboarding: how the connection is established

1. Customer is guided (self-serve, in-product instructions) to create a WordPress Application Password scoped to a dedicated, purpose-built user account — **not** their own admin account. Recommendation: onboarding flow auto-generates instructions to create an "Seovate Agent" user with the `editor` role (can publish/edit posts, cannot install plugins, change themes, or manage other users) rather than `administrator`. This is a critical least-privilege decision: the credential Seovate holds should be incapable of doing catastrophic damage (no plugin/theme edits, no user management) even if something goes wrong downstream.
2. Detect installed SEO plugin (Yoast, RankMath, or none) during onboarding, since their meta fields aren't exposed via REST by default (see [06-data-sources-apis.md](06-data-sources-apis.md)) — the integration must adapt to write to the correct fields for whatever the site already uses, or explicitly ask the customer to install a lightweight companion mechanism if needed.
3. Google Search Console and Google Business Profile connect via OAuth (standard, revocable by the customer at any time from their Google account — this should be stated plainly in onboarding copy, since revocability is a trust signal).

## The guardrail layer (referenced from the architecture doc, detailed here)

Every autonomous action passes through deterministic checks before it touches the live site:

- **Volume caps.** Rolling-window limits on publishes per site (e.g., N new pages/week, M metadata updates/day). These are not soft targets — they are hard stops enforced in code, independent of what the generation stage produced.
- **Content quality floor.** Minimum length/structure checks, a check that the content addresses a specific real keyword/intent (not generic filler), and a duplicate/near-duplicate check against the site's own existing content and (where feasible) against the customer's own past outputs, before anything is queued for publish.
- **Reversibility by construction.** Before any write, the previous state (previous post revision, previous meta value) is captured. Every action is revertible — automatically on detected failure, or manually by the customer/founder on request.
- **Scope limits.** The agent should never be able to: install/update plugins or themes, change site settings, modify other users, delete content outright (only add/edit, with edits reversible), or touch pages outside its designated content categories (e.g., never auto-edit a legal/privacy/checkout page).
- **Kill switch.** A single, obvious customer-facing control ("pause Seovate on this site") that immediately halts all autonomous actions — required both as a trust feature and as an operational safety valve if something is going wrong.

## Transparency as the product's trust mechanism

Per the positioning strategy in [02-icp-positioning.md](02-icp-positioning.md), the public activity log (every action taken, in plain English, with the reason) is not just nice-to-have reporting — it is the mechanism by which a skeptical small-business owner can verify the system isn't doing something reckless without having to personally review each action. This is the product's answer to "how do I trust an AI to touch my website unsupervised."

## Handling multi-tenant blast radius

Per [04-technical-architecture.md](04-technical-architecture.md), no shared mutable state across customer pipelines, and per-tenant credential isolation — a bug affecting one customer's pipeline execution must not be able to read or write another customer's site. This should be a design invariant enforced at the infrastructure level (separate credentials, separate job execution context per tenant), not just application-logic discipline.

## What happens when something goes wrong (it will, eventually)

- Any publish failure, unexpected API error, or guardrail rejection should fail *closed* (skip the action, log it, alert) — never fail *open* into "publish anyway, best effort."
- Maintain an internal incident process even at MVP scale: if an autonomous action visibly harms a customer's site or rankings, the founder needs a fast manual rollback path and a direct communication line to affected customers — at 10–30 customers this can be a manual on-call process, but it must exist from day one given the stakes of unattended production writes.
- Track false-positive/false-negative rates on the guardrail layer itself (how often does it wrongly block good content, how often would a bad-content incident have slipped through) as a first-class metric, not an afterthought — this is effectively the product's core reliability metric.

## Relationship to Google policy compliance

The guardrails above are the direct, practical implementation of the compliance posture defined in [08-legal-compliance-risk.md](08-legal-compliance-risk.md) — volume caps and quality floors exist specifically because of Google's stated scaled-content-abuse policy, not as an arbitrary product decision. Treat that document and this one as a matched pair when making any future change to publishing behavior: a change that increases publishing volume or reduces the quality floor is a policy-risk decision, not just a product one, and should be evaluated as such.
