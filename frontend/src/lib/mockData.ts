export const CUSTOMER = {
  name: "Frisco Plumbing Co.",
  domain: "friscoplumbingco.com",
  ownerFirstName: "Dana",
};

export const HERO_ACTIVITY = [
  { title: "Fixed missing meta description", meta: "/services/emergency-plumbing" },
  { title: 'Published: "Water Heater Repair in Frisco, TX"', meta: "new service page" },
  { title: "Added FAQ schema markup", meta: "homepage" },
  { title: "Fixed 3 broken internal links", meta: "site-wide crawl" },
];

export const AUDIT_ISSUES = [
  {
    severity: "High" as const,
    title: "9 pages missing meta descriptions",
    detail: "Hurts click-through rate from search results — Google writes its own, often poorly.",
  },
  {
    severity: "High" as const,
    title: "No LocalBusiness schema markup",
    detail: "Search engines can't confidently confirm your business type, location, or hours.",
  },
  {
    severity: "Medium" as const,
    title: "22 images missing alt text",
    detail: "Reduces accessibility and image-search visibility.",
  },
  {
    severity: "Medium" as const,
    title: "3 broken internal links",
    detail: "Found on /about, /services, and /contact.",
  },
  {
    severity: "Low" as const,
    title: "Largest Contentful Paint: 4.1s",
    detail: "Slower than 75% of local business sites — mostly uncompressed hero images.",
  },
];

export const ACTIVITY_TIMELINE = [
  {
    icon: "📝",
    title: "Published: 'Emergency Water Heater Repair in Frisco, TX'",
    detail:
      "New service page, targeted to 'water heater repair frisco tx' — a keyword with local search intent and no existing page on your site.",
    date: "Sep 15, 2026",
    tag: "Content published",
    tagVariant: "success" as const,
  },
  {
    icon: "🛠️",
    title: "Fixed missing meta description",
    detail:
      "/services/drain-cleaning was missing a meta description, which can hurt click-through in search results. Generated and published one.",
    date: "Sep 14, 2026",
    tag: "Technical fix",
    tagVariant: "neutral" as const,
  },
  {
    icon: "🔗",
    title: "Fixed 2 broken internal links",
    detail:
      "Found during weekly crawl on /about and /services. Both now point to the correct, live pages.",
    date: "Sep 13, 2026",
    tag: "Technical fix",
    tagVariant: "neutral" as const,
  },
  {
    icon: "🏷️",
    title: "Added FAQ schema markup",
    detail:
      "Homepage FAQ section had no structured data — added FAQPage schema so it can appear as a rich result in search.",
    date: "Sep 11, 2026",
    tag: "Technical fix",
    tagVariant: "neutral" as const,
  },
  {
    icon: "📍",
    title: "Posted 'What's New' update to Google Business Profile",
    detail: '"Now offering same-day drain cleaning" — tied to a seasonal service push.',
    date: "Sep 10, 2026",
    tag: "Google Business Profile",
    tagVariant: "pending" as const,
  },
  {
    icon: "🖼️",
    title: "Added alt text to 6 images",
    detail: "Images on /gallery had no alt text, hurting accessibility and image search visibility.",
    date: "Sep 9, 2026",
    tag: "Technical fix",
    tagVariant: "neutral" as const,
  },
];

export const INTEGRATIONS_ONBOARDING = [
  {
    initials: "WEB",
    name: "Your website",
    description: `${CUSTOMER.domain} — publishing target`,
    optional: false,
    connected: true,
  },
  {
    initials: "GS",
    name: "Google Search Console",
    description: "Rankings, impressions, indexing baseline",
    optional: false,
    connected: true,
  },
  {
    initials: "GA",
    name: "Google Analytics 4",
    description: "Traffic, conversions, on-site behavior",
    optional: true,
    connected: false,
  },
  {
    initials: "GB",
    name: "Google Business Profile",
    description: "Local pack posts & review replies · ~7–10 day approval",
    optional: true,
    connected: false,
  },
  {
    initials: "GH",
    name: "GitHub",
    description: "Advanced — connect a repo if your content lives in code",
    optional: true,
    connected: false,
  },
];

export const INTEGRATIONS_SETTINGS = [
  {
    initials: "WEB",
    name: "Your website",
    meta: `${CUSTOMER.domain} · connected Sep 8, 2026`,
    status: "Connected" as const,
    statusVariant: "success" as const,
    action: "Manage",
  },
  {
    initials: "GS",
    name: "Google Search Console",
    meta: "Verified property · syncing daily",
    status: "Connected" as const,
    statusVariant: "success" as const,
    action: "Manage",
  },
  {
    initials: "GA",
    name: "Google Analytics 4",
    meta: "Not connected — traffic data unavailable",
    status: "Not connected" as const,
    statusVariant: "neutral" as const,
    action: "Connect",
  },
  {
    initials: "GB",
    name: "Google Business Profile",
    meta: "Application submitted Sep 8 · Google review in progress",
    status: "Pending approval" as const,
    statusVariant: "pending" as const,
    action: "View status",
  },
  {
    initials: "GH",
    name: "GitHub",
    meta: "Advanced — for repo-based content pipelines",
    status: "Not connected" as const,
    statusVariant: "neutral" as const,
    action: "Connect",
  },
];

export const GITHUB_FILES = [
  {
    path: "sitemap.xml",
    description: "Not found at site root — search engines can't efficiently discover your pages",
    status: "Missing",
    variant: "warn" as const,
  },
  {
    path: "robots.txt",
    description: "Found, but doesn't reference your sitemap",
    status: "Needs update",
    variant: "pending" as const,
  },
  {
    path: "public/schema/local-business.json",
    description: "Not found — no structured LocalBusiness data for this repo's pages",
    status: "Missing",
    variant: "warn" as const,
  },
  {
    path: "llms.txt",
    description: "Found and current — AI crawlers can already read your content guidance",
    status: "Up to date",
    variant: "success" as const,
  },
];

export const PIPELINE_STAGES = [
  { n: 1, title: "Crawl & Audit", cadence: "Daily", state: "complete" as const },
  { n: 2, title: "Research", cadence: "Weekly", state: "complete" as const },
  { n: 3, title: "Generate", cadence: "On schedule", state: "active" as const },
  { n: 4, title: "Publish", cadence: "Capped/wk", state: "pending" as const },
  { n: 5, title: "Measure", cadence: "Weekly", state: "pending" as const },
];

export const PIPELINE_RUNS = [
  { stage: "Crawl & Audit", last: "Today, 3:02 AM", next: "Tomorrow, 3:00 AM", status: "Complete", variant: "success" as const },
  { stage: "Research", last: "Sep 12, 3:15 AM", next: "Sep 19, 3:00 AM", status: "Complete", variant: "success" as const },
  { stage: "Generate", last: "Today, 9:14 AM", next: "In queue", status: "In review", variant: "pending" as const },
  { stage: "Publish", last: "Sep 15, 9:20 AM", next: "Pending Stage 3", status: "Waiting", variant: "neutral" as const },
  { stage: "Measure & Report", last: "Sep 8, 6:00 AM", next: "Sep 22, 6:00 AM (email)", status: "Scheduled", variant: "neutral" as const },
];

export const OPPORTUNITIES = [
  {
    title: '"water heater repair frisco tx"',
    detail: "No existing page targets this — new service page",
    type: "New page",
    volume: "~90/mo",
    status: "Queued next",
    variant: "success" as const,
  },
  {
    title: '"emergency plumber near me" (local intent)',
    detail: "Existing /services page ranks #14 — optimize title/meta",
    type: "On-page fix",
    volume: "~320/mo",
    status: "Queued next",
    variant: "success" as const,
  },
  {
    title: '"tankless water heater installation cost"',
    detail: "Content gap — competitors rank with an FAQ-style page",
    type: "New page",
    volume: "~140/mo",
    status: "Scheduled",
    variant: "pending" as const,
  },
  {
    title: '"drain cleaning frisco tx"',
    detail: "Page exists, missing FAQ schema for rich results",
    type: "Schema fix",
    volume: "~70/mo",
    status: "Scheduled",
    variant: "pending" as const,
  },
  {
    title: '"24 hour plumber frisco"',
    detail: "Low competition, no page — flagged for next quarter",
    type: "New page",
    volume: "~40/mo",
    status: "Backlog",
    variant: "neutral" as const,
  },
  {
    title: '"sump pump installation"',
    detail: "Adjacent service, not yet confirmed offered — needs business-profile check",
    type: "New page",
    volume: "~55/mo",
    status: "Backlog",
    variant: "neutral" as const,
  },
];

export const GUARDRAIL_CHECKS = [
  {
    title: "Real keyword, real intent",
    detail: 'Targets "water heater repair frisco tx" — confirmed local search volume, not a generic/templated topic',
  },
  {
    title: "Minimum content length & structure",
    detail: "640 words, has H2 sections and a clear service description — above the 400-word floor",
  },
  {
    title: "Duplicate / near-duplicate check",
    detail: "Compared against all 41 existing pages on this site — 6% overlap, well under the 30% threshold",
  },
  {
    title: "Banned-pattern check",
    detail: "No keyword stuffing, no thin/templated boilerplate detected",
  },
  {
    title: "Schema & meta validation",
    detail: "JSON-LD validates, title 58 chars, meta description 152 chars — both within limits",
  },
];

export const GBP_POSTS = [
  {
    tag: "Seasonal",
    date: "Sep 12",
    title: "Now booking fall water heater tune-ups",
    body: "Tied to seasonal service relevance — auto-generated from your business profile.",
  },
  {
    tag: "Service",
    date: "Sep 5",
    title: "Same-day drain cleaning now available",
    body: "Highlights a service already listed on your site, posted to keep your profile active.",
  },
];

export const GBP_REVIEWS = [
  {
    name: "Maria T.",
    stars: 5,
    when: "2 days ago",
    review: "Fast response, fixed our water heater same day. Highly recommend!",
    reply:
      "Thank you, Maria! We're glad we could get your water heater back up and running quickly — we appreciate you taking the time to share this.",
  },
  {
    name: "James R.",
    stars: 4,
    when: "5 days ago",
    review: "Good work, showed up a bit later than scheduled.",
    reply:
      "Thanks for the honest feedback, James — we're working on tightening up our scheduling windows and appreciate you giving us a shot.",
  },
];
