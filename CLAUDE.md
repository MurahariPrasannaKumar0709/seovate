# Seovate — project notes for Claude

Autonomous SEO product (mock/demo backend for a single fictional customer, "Frisco Plumbing
Co."). See `README.md` for run instructions and `docs/` for the product/strategy docs.

## Structure
- `frontend/` — Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind v4. All UI screens,
  auth, and real OAuth integrations (Postgres via Prisma — see below).
- `backend/` — FastAPI (Python), mock-data-driven endpoints under `app/api/*`, shared fixtures in
  `app/mock_data/store.py`. Unrelated to the Postgres DB — still pure in-memory/mock demo data.
- `docs/` — strategy docs (market research, architecture, roadmap, etc.), not code.
- `docker-compose.yml` (repo root) — local Postgres for the frontend's Prisma-backed auth +
  integrations storage. `docker compose up -d` before running the frontend.

## Conventions
- Data-fetching pages follow the pattern in `frontend/src/app/guardrails/page.tsx`: client
  component, `apiGet`/`apiPost` from `@/lib/api` on mount, falls back to the matching constant in
  `@/lib/mockData` if the backend call fails (so the UI still renders with the backend down).
  `activity`, `pipeline`, `opportunities`, and `gbp-activity` follow this same fetch-with-fallback
  pattern for the FastAPI-backed parts of their data. `github/*` no longer does — see below.
- **Auth** (`frontend/src/app/api/auth/*`, `frontend/src/lib/auth/*`) is email-OTP based, with an
  optional "Continue with Google" OAuth flow. Users and OTP codes are stored in Postgres via
  Prisma (`frontend/prisma/schema.prisma`, models `User`/`OtpCode`) — `lib/auth/store.ts` wraps
  this with the same function signatures the route handlers always used, so
  request-otp/verify-otp/google-callback didn't need to change when this moved off a JSON file.
  Session is an HMAC-signed cookie (`seovate_session`, `lib/auth/session.ts`). Session **reads**
  (for authorization) go through `lib/auth/getSession.ts` (`getSessionEmail`/`getSessionUser`) —
  used by the integrations routes below. The customer-facing demo screens (`/activity`,
  `/pipeline`, `/opportunities`, `/guardrails`, `/gbp-activity`) still aren't session-gated —
  per the product's own positioning ("no dashboard to check") they're intentionally
  public/unauthenticated views of the one mock customer, not per-user data.
- **Real OAuth integrations** (Settings > Integrations, and onboarding's connect-integrations
  step) — Google Search Console, Google Analytics 4, Google Business Profile, and GitHub each go
  through a real OAuth consent screen and persist encrypted tokens in Postgres
  (`Integration` model, keyed by `(userId, provider)`). Provider config lives in
  `lib/integrations/providers.ts`; the 3 Google-based ones share one OAuth client and one
  redirect URI (`/api/integrations/google/callback`) — the specific product travels in the
  signed OAuth `state` (`lib/integrations/state.ts`, same HMAC pattern as the login flow's
  state) and only the requested scope differs (`googleStart.ts`). GitHub is a separate OAuth App.
  Tokens are encrypted at rest with `lib/integrations/crypto.ts` (AES-256-GCM,
  `TOKEN_ENCRYPTION_KEY`). `GET /api/integrations/status` reports connection status for the
  current session (all "not connected" if logged out — it never redirects); each provider has a
  `GET` start route (redirects to `/login?next=...` if logged out, or `?error=<provider>_not_configured`
  back to the calling page if the provider's env vars aren't set) and `POST
  /api/integrations/[provider]/disconnect`. This is entirely separate from the FastAPI backend's
  mock `/api/integrations` endpoint (still used for the non-OAuth rows like "Your website").
  **Search Console data** is now actually pulled live: `lib/integrations/googleClient.ts`
  (`getValidGoogleAccessToken`, refreshes via the stored refresh_token when the access token is
  expired/near-expiry, marking the row `disconnected` if the refresh token itself was revoked) +
  `lib/integrations/searchConsole.ts` (thin wrapper over the `webmasters/v3` REST API) feed
  `GET /api/integrations/google-search-console/data`, rendered at `/search-console`
  (`app/(dashboard)/search-console/page.tsx`) — totals, a daily clicks/impressions trend, top
  queries/pages/countries/devices, and indexing counts derived from `sites.sitemaps.list`
  (there's no bulk index-coverage endpoint in the public API, only per-URL inspection, so this is
  the closest available proxy). GA4/GBP still only connect + persist the account, no data pulled yet.
- **GitHub SEO-scaffolding flow is real end-to-end**, replacing the old FastAPI mock entirely (the
  three `github/*` screens no longer call `/api/github/*` on the FastAPI backend at all — they call
  new session-gated Next.js routes under `app/api/github/*`, plain `fetch`, not `apiGet`/`apiPost`,
  since those target the FastAPI base URL). Flow: connect GitHub (`repo` scope) → **pick a repo and
  a live site URL** at `/github/select-repo` (`POST /api/github/select`, persisted on the
  `Integration` row as `repoFullName`/`siteUrl`/`lastPrNumber`) → `/github/repo-scan`
  (`GET /api/github/scan`) checks the repo for `sitemap.xml`/`robots.txt` via the Contents API →
  `/github/consent` (`GET /api/github/generate` for a dry-run preview) runs `lib/integrations/
  siteCrawler.ts` (same-origin link-following crawler, no JS rendering, capped at 50 pages — a
  real but shallow audit, not a full site-analysis product) only if a file is missing, feeds the
  discovered URLs into `lib/integrations/seoFiles.ts` to generate real file content, and on
  approval `POST /api/github/generate` creates a branch, commits the file(s), and opens a real PR
  via `lib/integrations/githubClient.ts` (mirrors `googleClient.ts`'s pattern; no refresh-token
  branch needed since GitHub's web-flow tokens don't expire) → `/github/pull-request`
  (`GET/POST /api/github/pull-request*`) shows the real PR's files and lets you **merge or close it
  from Seovate**, or follow the real "View on GitHub ↗" link to review/merge there yourself instead
  — both are real GitHub API calls, not simulated. The previous "Request changes" button was
  removed (no real one-call GitHub equivalent — that's a PR review, a separate, heavier API) rather
  than left as a fake local-only state.
- **Google OAuth Cloud Console setup** (needed once per Google Cloud project, not code): both
  `GOOGLE_LOGIN_REDIRECT_URI` and `GOOGLE_INTEGRATIONS_REDIRECT_URI` must be added under
  "Authorized redirect URIs" on the OAuth client matching `GOOGLE_CLIENT_ID` — `redirect_uri_mismatch`
  means one of them is missing there (or the dev server isn't actually on port 3000, so the real
  origin doesn't match what's registered). Separately, while the OAuth consent screen's publishing
  status is "Testing" (the default for a new client), only accounts added under Audience > Test
  users can complete sign-in at all — everyone else gets `Error 403: access_denied`, unrelated to
  redirect_uri config.
- `frontend/AGENTS.md`/`frontend/CLAUDE.md` are auto-generated by `next dev` (Next 16 warns its
  APIs may differ from training data) — don't hand-edit `frontend/CLAUDE.md`.
- This environment ships bleeding-edge tool versions with breaking changes vs. typical
  training-data knowledge — confirmed twice now: Next 16's own AGENTS.md warning, and Prisma's
  `latest` npm tag being an 8.0 release-candidate with an entirely different CLI (pinned to
  `7.10.0` here instead, which still has the classic `prisma migrate dev` workflow). Prisma 7
  also dropped `datasource.url` from `schema.prisma` in favor of `prisma.config.ts` +  a driver
  `adapter` passed to `PrismaClient` (`@prisma/adapter-pg` here, see `lib/prisma.ts`). Check
  actual installed versions/behavior before assuming a library's classic API still applies.

## Known gaps (intentionally not fixed — would require adding new screens/endpoints)
- Landing page (`/`) links to `/privacy` and `/contact`, which don't exist as screens. Left as-is
  since the instruction was to fix only screens that already exist, not add new ones.
- `/settings/integrations` "Manage" action for the FastAPI-mock rows (e.g. "Your website", "Google
  Analytics 4" when shown as a mock row) has no backend counterpart, so it's disabled rather than
  faked as working. The 4 real-OAuth rows (GSC/GA4/GBP/GitHub) have real Connect/Disconnect.
- GitHub scaffolding only checks/generates `sitemap.xml` and `robots.txt` (matching what
  `repo-scan` actually scans for) — the older mock also mentioned a `public/schema/local-business.json`
  file; that's dropped since generating meaningful LocalBusiness schema needs real business-profile
  data this app doesn't collect anywhere yet.
- The site crawler (`lib/integrations/siteCrawler.ts`) is same-origin, one level deep, no JS
  rendering, capped at 50 pages — fine for a small marketing site, not a real full-site audit tool.

## Running locally
```
docker compose up -d              # Postgres for frontend auth + integrations (repo root)
cd frontend && npx prisma migrate deploy   # apply migrations (first time / after pulling schema changes)
start-servers.bat                 # or run backend/frontend separately, see README.md
```
Backend: `http://localhost:8000` (FastAPI, `--reload`). Frontend: `http://localhost:3000` (Next
dev). Postgres: `localhost:5435` (mapped to avoid colliding with a native Postgres install on the
default 5432 on this machine — see `docker-compose.yml`).

`frontend/.env.local` has: real Gmail SMTP creds configured for OTP email delivery (signup devCode
is also returned in the API response in non-production for convenience); `DATABASE_URL` for the
app runtime (`frontend/.env`, gitignored like `.env.local`, holds the same value for the Prisma
CLI, which doesn't read `.env.local`); a generated `TOKEN_ENCRYPTION_KEY`; and placeholders for
`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (shared by login + the 3 Google integrations) and
`GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` — fill these in to test real OAuth end-to-end.
