# Seovate — Current Status vs. Master Document

Snapshot date: **2026-09-22**. Reference: `SEO_Automation_Platform_End_to_End_Product_Documentation.pdf`
(sections referenced below by number). This file is a status snapshot, not a living spec — re-audit
before trusting it if much time has passed. See `CLAUDE.md` for how things actually work.

## 1. One-line summary

Seovate today is **Technical SEO Automation (real crawl + real rule engine + real GitHub auto-fix
PRs) + real Search Console analytics + real Lighthouse audits + a real single-purpose GitHub
scaffolding flow (sitemap/robots)**. GA4 and Business Profile only connect (no data pulled). No
generic multi-site/multi-tenant project model, no monitoring beyond GSC sitemap-issue diffing, no
broader-SEO or AI layer. This maps to roughly **Phase 6 of the master doc's 14-phase roadmap** (see
§3), with parts of Phase 4, 5, 8 and 9 also done — the phases were not built in the document's
proposed order.

## 2. Master-doc "Current Product" table (§2) — updated

| Existing capability (per doc) | Status now |
|---|---|
| GitHub connection | ✅ Real OAuth, real repo/site selection |
| robots.txt detection | ✅ Real (repo-scan) |
| sitemap.xml detection | ✅ Real (repo-scan) |
| Create/update files | ✅ Real, plus generalized: any file the auto-fix pipeline touches |
| GitHub PR creation | ✅ Real, single-commit multi-file PRs (Git Data API) |
| User consent before merge | ✅ Real — PRs require explicit Merge click, never auto-merged |
| GSC integration | ✅ Real OAuth + **real data**: totals, trends, top queries/pages/countries/devices, indexing via sitemaps.list |
| GA4 integration | ⚠️ Real OAuth connect only — **no data pulled** |
| Business Profile integration | ⚠️ Real OAuth connect only — **no data pulled** |
| Lighthouse | ✅ Real — standalone `lighthouse-service` (Playwright + lighthouse npm pkg), deployed on Render |
| Headless Chrome | ✅ Real, in the Lighthouse service |
| **Technical SEO rule engine** (not in original table — didn't exist) | ✅ **Now real** — see §4 |
| **Automated remediation beyond sitemap/robots** (not in original table) | ✅ **Now real** — see §5 |

## 3. Roadmap phase mapping (master doc §21)

| Phase | Doc's target | Status |
|---|---|---|
| 0 | Repo, environments, auth, database | ✅ Done |
| 1 | Projects + website onboarding | ❌ Not built — no multi-project/multi-website model. One user = one GitHub repo + one site URL, no "Project" entity |
| 2 | GitHub integration | ✅ Done |
| 3 | Crawler + page inventory | ⚠️ Partial — two crawlers now exist (see §6), neither persists a queryable page inventory table; results live only inside a `TechnicalSeoScan`'s findings |
| 4 | Technical rules → reproducible findings | ✅ **Done this cycle** — deterministic rule engine, real crawl-backed findings, stored in Postgres |
| 5 | Robots + sitemap automation | ✅ Done (pre-existing) |
| 6 | Lighthouse | ✅ Done (pre-existing) |
| 7 | GSC + GA4 + GBP data visible | ⚠️ Partial — GSC only |
| 8 | Change proposals + PR | ✅ **Done this cycle**, scoped to auto-fixable rule types (see §5) — not a fully generic proposal system for every finding type |
| 9 | Approval + merge + verification | ⚠️ Partial — approval+merge is real (Merge/Close/Delete, in-platform diff viewer), **and merges are now deploy-checked with one-click revert on failure** (see §9); still **no automated re-crawl to confirm a *successful* merge actually resolved the finding** |
| 10 | Monitoring | ⚠️ Partial — only GSC sitemap-issue diffing (hourly cron, email on change). No crawl-based regression detection, no Lighthouse-score history, no "deployment → SEO incident" correlation |
| 11 | Reports | ❌ Not built — no exportable technical-SEO reports (the old mock `/activity`, `/opportunities` etc. screens are unrelated fake data, not reports of real findings) |
| 12 | AI layer | ❌ Not built — zero LLM integration anywhere. All generated text (titles/descriptions) is template-based, not AI-generated, by design (see §5) |
| 13 | Content/local SEO | ❌ Not built |
| 14 | SaaS scale (teams/plans/billing) | ❌ Not built |

## 4. Technical SEO audit engine (new this cycle)

- **Crawler** (`frontend/src/lib/integrations/siteCrawler.ts`, `crawlSiteDetailed`): same-origin BFS,
  40-page cap (bounded to fit a serverless function's timeout), 8-way concurrency, no JS rendering.
  Extracts per page: HTTP status, title, meta description, all H1s, canonical, JSON-LD `@type`s,
  internal links. Handles `application/xhtml+xml` responses (not just `text/html` — found via real
  testing against `google.com`, which serves some pages that way).
- **Rule engine** (`frontend/src/lib/integrations/technicalSeoRules.ts`), pure/deterministic, no
  network calls: `TITLE_MISSING`, `TITLE_DUPLICATE`, `META_DESCRIPTION_MISSING`,
  `META_DESCRIPTION_DUPLICATE`, `H1_MISSING`, `H1_MULTIPLE`, `CANONICAL_MISSING`,
  `CANONICAL_INVALID`, `CANONICAL_TARGET_ERROR`, `PAGE_STATUS_ERROR`, `PAGE_UNREACHABLE`,
  `BROKEN_INTERNAL_LINK`.
- **Data model**: `TechnicalSeoScan` (siteUrl, status, pagesScanned, truncated, timestamps,
  `fixPrNumber`/`fixPrRepoFullName`) has many `TechnicalSeoFinding` (ruleId, category, severity,
  url, evidence JSON) — this is the master doc's `Finding`/`ChangeProposal` concept, scoped to this
  one feature rather than a platform-wide entity.
- **API**: `GET/POST /api/technical-seo/scan` (session-gated, real crawl on POST, `maxDuration=60`).
- **UI**: `/technical-seo` — real findings list, severity counts, no mock-data fallback (this screen
  either shows real data or an explicit error, unlike the `apiGet`/mockData-fallback convention used
  by the older FastAPI-backed screens).

## 5. Automated remediation (new this cycle)

One PR per scan, **one commit** (Git Data API — blobs/tree/commit/ref, not one Contents-API call
per file), covering every finding type that can be fixed **without fabricating content**:

| Rule | Fix strategy | File |
|---|---|---|
| `CANONICAL_MISSING` | Insert/merge `alternates: { canonical }` into the page's `metadata` export | `pageMetadataFix.ts` |
| `TITLE_MISSING` / `TITLE_DUPLICATE` | Derive title from URL slug; insert or replace (only if existing value is a plain string literal) | `pageMetadataFix.ts` |
| `META_DESCRIPTION_MISSING` / `_DUPLICATE` | Generate a generic, non-fabricated placeholder (`"Learn more about {title}."`); insert or replace | `pageMetadataFix.ts` |
| `H1_MISSING` | Best-effort: inject a visually-hidden (`sr-only`) but real `<h1>` right after the component's root JSX element; skips if structure is ambiguous | `pageMetadataFix.ts` |
| `BROKEN_INTERNAL_LINK` (→ dead page) | **Removes the link**, does not fabricate the missing page (avoids generating fake legal/business content like a Privacy Policy) — handles both plain JSX `href="..."` and nav-data-array (`{ href: "...", label: "..." }`) shapes; masks `//`/`/* */` comments before scanning so dead/commented-out code is never matched or corrupted | `deadLinkFix.ts` |

Safety rules common to all of the above: skip Client Components (`"use client"` can't export
`metadata`), skip dynamic `generateMetadata()` functions, only touch App Router `page.{tsx,jsx,ts,js}`
at the exact conventional path, never partially-apply an edit whose bounds can't be confidently
resolved. File discovery for dead links fetches the **full repo tree + every code file's content**
directly (bounded to 200 files) rather than GitHub's code-search API — confirmed via a real repo
that search-index lag makes the API return zero results for links that are definitely present,
which is common for small/low-traffic repos (this product's actual target audience).

**API**: `GET/POST /api/technical-seo/fix`, `POST fix/merge`, `POST fix/close`, `POST fix/delete`
(closes + deletes the branch — GitHub has no real "delete a PR" API), `GET fix/diff` (unified diffs
via the compare API, rendered inline in the UI instead of requiring a trip to GitHub).

**Deliberately not automated**: duplicate/missing content that would need genuinely new copy beyond
a generic placeholder, and any fix requiring new page content — these remain human-only, listed in
the PR body under "needs a human look."

## 6. Two independent crawlers now exist — a real gap

- `crawlSite` / `verifyUrlsLive` — link-list only, feeds the GitHub sitemap/robots scaffolding flow
  (300-page cap).
- `crawlSiteDetailed` — full page-data extraction, feeds the technical-SEO rule engine (40-page cap).

They don't share a page-inventory table or a unified crawl result — built independently, for
different features, at different times. Unifying them (one crawler, one `Page` table per master
doc §15) is deferred, not attempted.

## 7. Auth/session note relevant to this feature

`/technical-seo` **is** session-gated (unlike `/activity`, `/pipeline`, `/opportunities`,
`/guardrails`, `/gbp-activity`, which are intentionally public per the product's positioning) — it
reads/writes real per-user Postgres rows and drives real GitHub API calls, so it follows the same
session-gating convention as `/search-console`, `/lighthouse`, and `/github/*`.

## 8. Fixed this cycle, unrelated to the audit engine itself

- **GitHub disconnect now actually revokes the OAuth grant** (`DELETE /applications/{client_id}/grant`)
  instead of only deleting the local `Integration` row — previously, reconnecting silently
  re-authorized the same GitHub account without showing a consent screen, since the grant was still
  live on GitHub's side. Confirmed against a real (dead) token before shipping.
- **`lighthouse-service` Docker deploy fixed** (unrelated Chromium/Playwright version-pin issue found
  during initial Render deployment — see `lighthouse-service/README.md`).
- **Loading-timer UX**: every long-running action (crawl, audit, PR open/merge/close/delete, diff
  load, Lighthouse run) now shows a spinner + live elapsed-seconds counter, plus a "Re-run" button
  on both `/technical-seo` and `/lighthouse`.

## 9. Quality gate + deployment safety net (added after a real production incident)

The first real auto-fix PR merged against a live repo (`vigel.vercel.app`) **broke that repo's
Vercel deployment** — a genuine incident, not a hypothetical. Root cause: removing both dead-link
entries from a 2-item nav-data array (`legal: [{href:"/privacy",...}, {href:"/terms",...}]`) left
`legal: []`, which TypeScript infers as `never[]`, breaking `.map((item) => item.label)` at the
call site. The bug was in `deadLinkFix.ts`'s own transformation logic, not anything the user did.
Two things came out of this:

1. **Prevented at the source**: `deadLinkFix.ts` now refuses to remove an array entry if doing so
   would leave the enclosing array with zero remaining object entries — it leaves the dead link in
   place (reported as skipped) rather than risk emptying the array again.
2. **A general two-layer safety net was added**, since the source-level fix only covers this one
   specific pattern:
   - **Pre-commit syntax validation** (`codeValidation.ts`, `ts.transpileModule`): every generated
     file is parsed before it's ever committed; anything that fails is dropped from the PR and
     reported as skipped. Deliberately syntax-only — actually running the connected repo's own
     `npm install`/build on our server would mean executing arbitrary third-party code (a malicious
     `postinstall` script would run with our server's access), which the master doc's own security
     section explicitly rules out. This step could **not** have caught the incident above (it's a
     cross-file type error, not a syntax error) — it's a backstop for a different failure mode
     (a string-splicing edit producing outright malformed JS/TS).
   - **Post-merge deployment monitoring** (`GET fix/deploy-status`, polls GitHub's commit-status
     API — what Vercel's GitHub integration posts to a commit): after clicking Merge, the UI polls
     for up to 2 minutes and shows the real deploy outcome. On failure, a one-click **Revert**
     (`POST fix/revert`) creates a forward `git revert`-equivalent commit (new commit, old tree,
     no force-push/history rewrite) — deliberately not automatic/silent, since every other action
     in this pipeline already requires an explicit click, and auto-reverting someone's real repo
     without asking would be a bigger unilateral action than anything else built here.

This was validated for real: the actual incident above was fixed via this exact revert mechanism
against the live `Vigel` repo (verified the resulting commit redeployed successfully on Vercel and
the live site was restored), not just tested in the abstract.

## 10. Recommended next priority

Per the master doc's own guidance ("finish the loop before adding modules") and what's now the
biggest real gap: **Phase 9's missing half — automated verification**. The loop currently is
Crawl → Findings → PR → Merge → Deploy-check/Revert-if-failed, but nothing re-crawls after a
*successful* merge to confirm the finding actually resolved and close it out. That's the natural
next increment before touching monitoring, reporting, GA4/GBP data, or anything AI-related.
