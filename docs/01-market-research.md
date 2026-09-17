# Market Research

All findings below are from live research conducted 2026-09-11. Confidence level is noted per claim. Where sources conflict, both figures are shown.

## 1. Competitive landscape

### Direct/near-direct competitors (autonomous or near-autonomous AI SEO agents)

| Tool | What it automates | Autonomy level | Target | Pricing (verified/sourced) |
|---|---|---|---|---|
| **Merchynt ("Paige" agent)** | GBP posts, review auto-replies, geotagged image uploads, citation building (62 directories), YouTube + social auto-posting, schema/FAQ generation, rank tracking | Highest found — vendor claims ~10-min onboarding then largely hands-off | SMB / local + agencies | From **$99/mo per location** (vendor page; not independently audited) |
| **Okara ("AI CMO")** | Multi-agent: SEO, GEO, content, technical fixes via coding-agent + GitHub PRs, social | High — autonomous execution with PR-based technical changes | Startups/SMB | Pricing inconsistent across sources: $99/mo (Okara's own blog) vs. $129–$249/mo (third-party) — **unverified, conflicting** |
| **Sunbeam (Daydream)** | Full SEO program management, branded "fully autonomous" | Claimed fully autonomous | Unclear | Private beta, **no public pricing found** |
| **NoimosAI** | "AI marketing/SEO/GEO department," 24/7 | Claimed autonomous | Unclear | **Low confidence — only listicle sources found, not independently verified** |

### Adjacent competitors (AI-assisted, human-in-the-loop — not autonomous)

| Tool | What it does | Pricing (sourced) |
|---|---|---|
| Alli AI | Auto-pushes on-page/technical code changes, AI-crawler optimization | Business $249/mo, Agency $599/mo, Enterprise $1,199/mo |
| SurferSEO | Content optimization/writing assistant, SERP analysis | Discovery $49/mo → Peace of Mind $299/mo, Enterprise $999/mo+ |
| Semrush (Content Toolkit, ex-ContentShake) | AI article generation, briefs, optimizer; Copilot surfaces prioritized tasks (not autonomous execution) | Content Toolkit $60/mo add-on; core plans start much higher |
| Ahrefs (Brand Radar) | AI/LLM visibility tracking, predictive keywords | Lite $99/mo → Enterprise $999/mo |
| Jasper | AI content generation, SEO mode | Creator $49/mo, Pro $69/mo |
| Frase | Content briefs + AI writing | Solo $15/mo (4 articles) → Team $115/mo |
| Clearscope | Content grading/optimization | Essentials $170/mo → Business $350/mo |
| Scalenut, NeuronWriter, Outranking, RankIQ, Content at Scale | Content optimization/generation | Wide range ($15–$1,500/mo cited); **many figures only from aggregator listicles, not vendor-verified** |
| RankMath (WordPress plugin) | 40+ AI tools, on-page recommendations, credit-based AI usage | Pro **$7.99/mo**, Growth **$24.99/mo** — cheapest AI-adjacent tool found, heavy SMB/WordPress adoption |
| Yoast SEO | AI Generate/Optimize/Summarize in Premium | ~$9.90/mo equiv. (specific 2026 figure unconfirmed) |
| BrightLocal | Local SEO/citations/rank tracking platform (not autonomous-AI-first) | Self-serve ~$39–$120/mo; fully managed $799–$1,299/location/mo |

### Key competitive takeaway

**Merchynt is the closest existing product to what Seovate is proposing** — same customer (local SMB), same claim (autonomous, near-zero-touch), similar price point ($99/mo/location). This is not a green field. Differentiation must be concrete: see [02-icp-positioning.md](02-icp-positioning.md) for how Seovate should differ (content-and-technical-SEO breadth beyond GBP/local pack, direct WordPress CMS-level integration rather than GBP-centric, and pricing/packaging).

Everything else in the table is either enterprise/agency-priced (Alli AI, Clearscope, Ahrefs, Semrush) or requires a human to review and publish (SurferSEO, Frase, Jasper) — i.e., not truly zero-human, and not priced for SMB budgets under $1,000/mo.

## 2. Market size (low confidence — figures conflict across sources)

- Global "SEO software market" 2026 estimates range from **$96.4B–$97.7B**, projected to **$271.9B–$295B by 2034–2035** (13.3–13.65% CAGR) — Fortune Business Insights and Precedence Research disagree on both the base and the endpoint; market scope definitions likely differ between reports. Treat as directional only.
- A separate "AI SEO Software Tools Market" report cites 10.5% CAGR on a different (unspecified) base — not comparable to the above without knowing the base figure.
- **None of these figures were traced to a primary research methodology in this research pass** — do not cite them externally (e.g., in a pitch deck) without re-verifying against the primary report.

## 3. SMB SEO spend and adoption (moderate-low confidence, aggregator-sourced)

- **61% of small businesses report no SEO investment at all** — cited as "the largest performance gap in SMB marketing" (BiziQ, aggregator blog, primary source not confirmed).
- Local-focused SMBs that do invest reportedly spend **$500–$2,000/month**; recommended allocation of 25–50% of marketing budget to SEO (same source).
- **52% of SMBs have monthly marketing budgets under $1,000; 41% under $500** (same source, unverified primary methodology).
- Oft-repeated "$13 return per $1 spent on local SEO" claim — appears across multiple aggregator sites with no traceable original study. **Do not use this figure in customer-facing marketing without a real source**, as it is exactly the kind of unverifiable stat that damages credibility if a prospect checks it.

## 4. Reported gaps / complaints in existing tools

Reddit/G2 direct-quote research was attempted but not successfully retrieved (search tooling returned blog content, not actual threads) — this is a genuine research gap, flagged rather than filled with invented quotes. What surfaced instead, at low confidence:

- SMB owners report "tool sprawl" — bouncing between ChatGPT, Jasper, Surfer, etc. without one clear system.
- SEO is broadly described in SMB-facing content as "a confusing topic for small business owners" — i.e., the market pain is more "I don't understand this and don't have time" than "my current tool has a specific bug."

**Action item before final GTM commitment:** run a direct pass against reddit.com/r/SEO, r/localseo, r/smallbusiness, and actual G2/Capterra review pages for Merchynt, Alli AI, and RankMath, to replace this weak-evidence section with real customer language before writing landing-page copy.

## 5. What this means for MVP scope and positioning

- The addressable pain is real and underserved (61% doing nothing), but the "autonomous AI SEO agent" category is no longer uncontested — Merchynt in particular is a live, funded-feeling competitor with a head start on local/GBP automation.
- Differentiation should lean into **WordPress-native, content-and-technical-SEO breadth** (not just GBP/local-pack management, which is Merchynt's center of gravity) plus **transparent, safe autonomy** (explicit volume/quality guardrails, addressing the scaled-content-abuse risk head-on as a selling point: "we publish carefully, not spam") — see [02-icp-positioning.md](02-icp-positioning.md) and [08-legal-compliance-risk.md](08-legal-compliance-risk.md).
- Pricing should sit between the $8–30/mo plugin tier and the $99+/mo "autonomous agent" competitor tier, or match it while offering broader scope — see [09-pricing-monetization.md](09-pricing-monetization.md).
