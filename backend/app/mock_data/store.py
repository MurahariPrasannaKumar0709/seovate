CUSTOMER = {
    "name": "Frisco Plumbing Co.",
    "domain": "friscoplumbingco.com",
    "owner_first_name": "Dana",
}

AUDIT = {
    "domain": "frisco-plumbing-co.com",
    "crawled_pages": 41,
    "date": "Sep 15, 2026",
    "score": 62,
    "stats": {"pages_with_issues": 14, "schema_found": 0, "broken_links": 3},
    "issues": [
        {
            "severity": "High",
            "title": "9 pages missing meta descriptions",
            "detail": "Hurts click-through rate from search results — Google writes its own, often poorly.",
        },
        {
            "severity": "High",
            "title": "No LocalBusiness schema markup",
            "detail": "Search engines can't confidently confirm your business type, location, or hours.",
        },
        {
            "severity": "Medium",
            "title": "22 images missing alt text",
            "detail": "Reduces accessibility and image-search visibility.",
        },
        {
            "severity": "Medium",
            "title": "3 broken internal links",
            "detail": "Found on /about, /services, and /contact.",
        },
        {
            "severity": "Low",
            "title": "Largest Contentful Paint: 4.1s",
            "detail": "Slower than 75% of local business sites — mostly uncompressed hero images.",
        },
    ],
}

ACTIVITY_TIMELINE = [
    {
        "icon": "📝",
        "title": "Published: 'Emergency Water Heater Repair in Frisco, TX'",
        "detail": "New service page, targeted to 'water heater repair frisco tx' — a keyword with local search intent and no existing page on your site.",
        "date": "Sep 15, 2026",
        "tag": "Content published",
    },
    {
        "icon": "🛠️",
        "title": "Fixed missing meta description",
        "detail": "/services/drain-cleaning was missing a meta description, which can hurt click-through in search results. Generated and published one.",
        "date": "Sep 14, 2026",
        "tag": "Technical fix",
    },
    {
        "icon": "🔗",
        "title": "Fixed 2 broken internal links",
        "detail": "Found during weekly crawl on /about and /services. Both now point to the correct, live pages.",
        "date": "Sep 13, 2026",
        "tag": "Technical fix",
    },
    {
        "icon": "🏷️",
        "title": "Added FAQ schema markup",
        "detail": "Homepage FAQ section had no structured data — added FAQPage schema so it can appear as a rich result in search.",
        "date": "Sep 11, 2026",
        "tag": "Technical fix",
    },
    {
        "icon": "📍",
        "title": "Posted 'What's New' update to Google Business Profile",
        "detail": '"Now offering same-day drain cleaning" — tied to a seasonal service push.',
        "date": "Sep 10, 2026",
        "tag": "Google Business Profile",
    },
    {
        "icon": "🖼️",
        "title": "Added alt text to 6 images",
        "detail": "Images on /gallery had no alt text, hurting accessibility and image search visibility.",
        "date": "Sep 9, 2026",
        "tag": "Technical fix",
    },
]

PIPELINE_STAGES = [
    {"n": 1, "title": "Crawl & Audit", "cadence": "Daily", "state": "complete"},
    {"n": 2, "title": "Research", "cadence": "Weekly", "state": "complete"},
    {"n": 3, "title": "Generate", "cadence": "On schedule", "state": "active"},
    {"n": 4, "title": "Publish", "cadence": "Capped/wk", "state": "pending"},
    {"n": 5, "title": "Measure", "cadence": "Weekly", "state": "pending"},
]

PIPELINE_RUNS = [
    {"stage": "Crawl & Audit", "last": "Today, 3:02 AM", "next": "Tomorrow, 3:00 AM", "status": "Complete"},
    {"stage": "Research", "last": "Sep 12, 3:15 AM", "next": "Sep 19, 3:00 AM", "status": "Complete"},
    {"stage": "Generate", "last": "Today, 9:14 AM", "next": "In queue", "status": "In review"},
    {"stage": "Publish", "last": "Sep 15, 9:20 AM", "next": "Pending Stage 3", "status": "Waiting"},
    {"stage": "Measure & Report", "last": "Sep 8, 6:00 AM", "next": "Sep 22, 6:00 AM (email)", "status": "Scheduled"},
]

OPPORTUNITIES = [
    {
        "title": '"water heater repair frisco tx"',
        "detail": "No existing page targets this — new service page",
        "type": "New page",
        "volume": "~90/mo",
        "status": "Queued next",
    },
    {
        "title": '"emergency plumber near me" (local intent)',
        "detail": "Existing /services page ranks #14 — optimize title/meta",
        "type": "On-page fix",
        "volume": "~320/mo",
        "status": "Queued next",
    },
    {
        "title": '"tankless water heater installation cost"',
        "detail": "Content gap — competitors rank with an FAQ-style page",
        "type": "New page",
        "volume": "~140/mo",
        "status": "Scheduled",
    },
    {
        "title": '"drain cleaning frisco tx"',
        "detail": "Page exists, missing FAQ schema for rich results",
        "type": "Schema fix",
        "volume": "~70/mo",
        "status": "Scheduled",
    },
    {
        "title": '"24 hour plumber frisco"',
        "detail": "Low competition, no page — flagged for next quarter",
        "type": "New page",
        "volume": "~40/mo",
        "status": "Backlog",
    },
    {
        "title": '"sump pump installation"',
        "detail": "Adjacent service, not yet confirmed offered — needs business-profile check",
        "type": "New page",
        "volume": "~55/mo",
        "status": "Backlog",
    },
]

GUARDRAIL_CHECKS = [
    {
        "title": "Real keyword, real intent",
        "detail": "Targets 'water heater repair frisco tx' — confirmed local search volume, not a generic/templated topic",
        "result": "PASS",
    },
    {
        "title": "Minimum content length & structure",
        "detail": "640 words, has H2 sections and a clear service description — above the 400-word floor",
        "result": "PASS",
    },
    {
        "title": "Duplicate / near-duplicate check",
        "detail": "Compared against all 41 existing pages on this site — 6% overlap, well under the 30% threshold",
        "result": "PASS",
    },
    {
        "title": "Banned-pattern check",
        "detail": "No keyword stuffing, no thin/templated boilerplate detected",
        "result": "PASS",
    },
    {
        "title": "Schema & meta validation",
        "detail": "JSON-LD validates, title 58 chars, meta description 152 chars — both within limits",
        "result": "PASS",
    },
]

GBP_POSTS = [
    {
        "tag": "Seasonal",
        "date": "Sep 12",
        "title": "Now booking fall water heater tune-ups",
        "body": "Tied to seasonal service relevance — auto-generated from your business profile.",
    },
    {
        "tag": "Service",
        "date": "Sep 5",
        "title": "Same-day drain cleaning now available",
        "body": "Highlights a service already listed on your site, posted to keep your profile active.",
    },
]

GBP_REVIEWS = [
    {
        "name": "Maria T.",
        "stars": 5,
        "when": "2 days ago",
        "review": "Fast response, fixed our water heater same day. Highly recommend!",
        "reply": "Thank you, Maria! We're glad we could get your water heater back up and running quickly — we appreciate you taking the time to share this.",
    },
    {
        "name": "James R.",
        "stars": 4,
        "when": "5 days ago",
        "review": "Good work, showed up a bit later than scheduled.",
        "reply": "Thanks for the honest feedback, James — we're working on tightening up our scheduling windows and appreciate you giving us a shot.",
    },
]

GITHUB_FILES = [
    {
        "path": "sitemap.xml",
        "description": "Not found at site root — search engines can't efficiently discover your pages",
        "status": "Missing",
    },
    {
        "path": "robots.txt",
        "description": "Found, but doesn't reference your sitemap",
        "status": "Needs update",
    },
    {
        "path": "public/schema/local-business.json",
        "description": "Not found — no structured LocalBusiness data for this repo's pages",
        "status": "Missing",
    },
    {
        "path": "llms.txt",
        "description": "Found and current — AI crawlers can already read your content guidance",
        "status": "Up to date",
    },
]

INTEGRATIONS_SETTINGS = [
    {
        "initials": "WEB",
        "name": "Your website",
        "meta": "friscoplumbingco.com · connected Sep 8, 2026",
        "status": "Connected",
        "action": "Manage",
    },
    {
        "initials": "GS",
        "name": "Google Search Console",
        "meta": "Verified property · syncing daily",
        "status": "Connected",
        "action": "Manage",
    },
    {
        "initials": "GA",
        "name": "Google Analytics 4",
        "meta": "Not connected — traffic data unavailable",
        "status": "Not connected",
        "action": "Connect",
    },
    {
        "initials": "GB",
        "name": "Google Business Profile",
        "meta": "Application submitted Sep 8 · Google review in progress",
        "status": "Pending approval",
        "action": "View status",
    },
    {
        "initials": "GH",
        "name": "GitHub",
        "meta": "Advanced — for repo-based content pipelines",
        "status": "Not connected",
        "action": "Connect",
    },
]
