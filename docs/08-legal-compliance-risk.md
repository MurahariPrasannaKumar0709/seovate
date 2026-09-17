# Legal, Compliance & Risk

Not legal advice — this is a research-grounded risk map to inform product and business decisions. A real lawyer should review terms of service, liability language, and data-handling practices before commercial launch, especially once the product is writing to customers' live websites and Google accounts.

## 1. Google Search spam policy risk (the central risk of this entire product category)

Quoted directly from Google Search Central's current Spam Policies documentation:

> "Scaled content abuse is when many pages are generated for the primary purpose of manipulating search rankings and not helping users." This explicitly includes "using generative AI tools or other similar tools to generate many pages without adding value for users," and the policy applies "regardless of whether automation, humans or a combination are involved."

**Implication:** This is not a theoretical risk to design around abstractly — it is a precise description of what a poorly-built version of this exact product would do. The product's entire technical and business defensibility rests on the guardrail layer in [07-cms-publishing-safety.md](07-cms-publishing-safety.md) — provably low, keyword-specific, quality-floored publishing volume — being real and enforced, not just a marketing claim. If a customer's site is penalized because Seovate published low-value content at scale, that is an existential liability event for the business (reputational and likely contractual), not just a bug.

**Mitigations that should be treated as non-negotiable product requirements, not nice-to-haves:**
- Hard volume caps (see MVP scope and CMS safety docs).
- Every generated page tied to genuine, specific local search intent — never templated filler across locations/keywords.
- No auto-generated "doorway pages" (near-identical pages varying only by city/keyword swap) — this is one of the most explicitly named abuse patterns in Google's guidelines and must be a hard-coded rejection rule in the guardrail layer.

## 2. Google Business Profile policy risk

The GBP API access process itself (application, ~7–10 business day review, requires a documented use case) is Google's own gatekeeping against automated abuse of local listings — a history of bad actors auto-posting spam/fake reviews responses. Implication: Seovate's own GBP API application should proactively describe the guardrails in place (this is likely to matter for approval), and any auto-generated review responses or posts should be held to the same quality-floor standard as website content — generic, obviously-templated responses are both a customer-trust risk and a potential API-access risk if Google detects abuse patterns.

## 3. Data access & privacy

- OAuth scopes for Search Console and GBP should be requested at minimum necessary scope, and the product should have a clear, simple data-retention and deletion policy (what happens to a customer's site/business data if they cancel).
- WordPress Application Password credentials and OAuth tokens are high-sensitivity secrets (they grant write access to a customer's live site and Google accounts) — encrypted storage, least-privilege access even internally, and a documented incident-response plan for credential compromise are baseline requirements before handling real customer credentials, not later hardening.
- If serving EU or California customers, standard privacy-policy/data-processing obligations (GDPR/CCPA-style) apply to any personal data handled (customer contact info, potentially site visitor data via Search Console) — standard SaaS practice, not unique to this product, but worth a real privacy policy from day one rather than a placeholder.

## 4. Liability & terms of service

- The service is making unattended changes to a customer's production website and public Google presence. The Terms of Service must clearly disclose: what the system is authorized to do, the existence and limits of the guardrail system, that SEO outcomes are not guaranteed (standard and necessary in this industry — no legitimate SEO service can guarantee rankings), and a reasonable limitation of liability for unintended site changes, paired with the actual reversibility mechanism in [07-cms-publishing-safety.md](07-cms-publishing-safety.md) as the practical backstop.
- Least-privilege WordPress user roles (see CMS safety doc) double as a liability mitigation, not just a technical safeguard — bounding what the system is even capable of doing bounds the worst-case liability exposure.

## 5. Competitive/IP risk

- LLM-generated content should be original per-customer (not templated boilerplate reused verbatim across customers), both for SEO quality reasons (duplicate content across many customer sites would itself be a red flag) and to avoid any question of content originality/copyright issues.
- No indication found in research of a specific legal barrier to building this kind of tool (WordPress, Google APIs, and SEO data providers all have documented, permitted commercial-use paths per [06-data-sources-apis.md](06-data-sources-apis.md)) — the risk here is policy/ToS compliance in *how* the tool is used, not whether it's legally permissible to build.

## 6. Honest assessment of residual risk

Even with every guardrail above implemented well, there is real residual risk: Google's spam-policy enforcement is algorithmic and not fully predictable, and a customer's site could still be affected by a broader algorithm update unrelated to Seovate's actions, which a customer may (fairly or not) attribute to the tool. This should be planned for operationally (clear communication, a documented "if this happens" customer response process) rather than assumed away. This risk is inherent to the entire "autonomous AI SEO agent" product category (it applies equally to every competitor named in [01-market-research.md](01-market-research.md)) — it is a reason to build the guardrails seriously, not a reason not to build the product.
