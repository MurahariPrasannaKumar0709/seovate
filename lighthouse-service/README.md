# Seovate Lighthouse service

Standalone Node/Express service that runs real Google Lighthouse audits (Performance,
Accessibility, Best Practices, SEO) against a given URL using headless Chromium (via
Playwright's bundled browser + `chrome-launcher` + the `lighthouse` npm package).

Deployed separately from the main FastAPI backend so a slow/crashing audit run can never affect
the rest of the product — it's a single-purpose service with one real endpoint.

## Running locally

```
cd lighthouse-service
npm install                 # also downloads Playwright's Chromium via postinstall
cp .env.example .env        # fill in LIGHTHOUSE_SERVICE_SECRET
npm start
```

## API

`POST /audit` (requires `Authorization: Bearer <LIGHTHOUSE_SERVICE_SECRET>`)

```json
{ "url": "https://example.com", "device": "mobile", "categories": ["performance", "seo", "accessibility", "best-practices"] }
```

`device` is `"mobile"` (default) or `"desktop"`. `categories` defaults to all four. Only public
http(s) URLs are allowed — the service resolves the hostname and rejects private/internal IP
ranges before running an audit, since this endpoint accepts an arbitrary caller-supplied URL.

Returns `{ url, fetchedAt, device, categories: {performance, accessibility, "best-practices", seo},
audits: [{id, title, description, score, scoreDisplayMode, displayValue}] }`.

`GET /health` — plain liveness check, no auth.

## Deploying on Render

Create a new **Web Service** (Node), root directory `lighthouse-service`, build command
`npm install`, start command `npm start`. Set `LIGHTHOUSE_SERVICE_SECRET` in its Environment tab
— same value goes into the frontend's `LIGHTHOUSE_SERVICE_SECRET` env var, and the frontend's
`LIGHTHOUSE_SERVICE_URL` should point at this service's Render URL. A free-tier instance is
enough for on-demand use but will cold-start after idling (Chromium launch + a full Lighthouse
run already takes 15-30s even warm).
