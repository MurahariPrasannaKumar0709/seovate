# Traditional SEO Approach (Before Automation)

This explains how a real person — an SEO consultant, an agency, or someone doing
marketing in-house — normally does this work by hand. This is the everyday process
Seovate is going to automate. It lines up with the 5-stage pipeline in
[04-technical-architecture.md](04-technical-architecture.md), and each section below
says which stage it turns into once it's automated.

## 1. Checking the site for problems (the "audit")

**Who does this:** An SEO consultant, or the business owner poking around with a
free tool.

**How it normally works:**
- Someone runs the whole website through a crawler tool (Screaming Frog is the
  classic one, or an online tool like Ahrefs or Semrush) that scans every page.
- They go through the results by hand and look for: pages missing a title or
  description, pages that have the same title as another page, images with no alt
  text, broken links, pages that redirect through three other pages before landing
  anywhere, missing or broken schema markup (the behind-the-scenes tags that help
  Google understand what a page is about), thin or duplicate content, and pages
  that nothing else on the site links to.
- They check Google PageSpeed Insights to see how fast the site loads and whether
  it passes Google's "Core Web Vitals" (basically, does the page load fast and
  feel responsive).
- They check Google Search Console to see which pages Google has actually indexed
  and which ones it's ignoring, and try to figure out why.
- All of this gets written up — usually a spreadsheet or a PDF — with the problems
  sorted into "fix this now," "fix this soon," and "nice to have."

**How long it takes:** For a normal small-business site (30–50 pages), a
consultant doing this properly the first time spends 3–6 hours on it.

**→ This becomes Stage 1 (Crawl & Audit).** Same three things get checked — the
crawl, the page-speed data, the Search Console data — but instead of a person
reading through a report once, the system checks every day and only flags what's
new or changed since last time.

## 2. Figuring out what to write about (keyword research)

**Who does this:** The same consultant, or someone whose job is just content
strategy.

**How it normally works:**
- Start with what the business actually does and where it operates — "plumber in
  Frisco TX," "emergency drain cleaning Frisco," that kind of thing.
- Type those phrases into a keyword tool (Ahrefs, Semrush, or the free Google
  Keyword Planner) to see roughly how many people search for each one per month,
  how hard it'd be to rank for it, and whether people searching it are likely to
  actually buy something.
- Manually look at who's currently ranking in the top 10 for each phrase — is it
  mostly service pages? Blog posts? Directory listings? What do those pages cover
  that yours doesn't?
- Put together a list: which existing pages should be tweaked to target which
  phrase, and which good phrases don't have a page at all yet (a "gap" worth
  filling).

**How long it takes:** A few hours to work through 10–20 keywords, and most
businesses only redo this every few months — not something anyone keeps up with
continuously.

**→ This becomes Stage 2 (Research).** Instead of a person manually looking things
up in a keyword tool, DataForSEO's data feeds in automatically, and the system
keeps finding new "gaps" on an ongoing schedule instead of once a quarter.

## 3. Actually writing and fixing things (content & on-page work)

**Who does this:** A copywriter, or the consultant themselves. If a business owner
is trying to do this solo, this is usually the step that just never happens — it's
exactly why most small-business sites sit untouched for years (see the "Dana"
persona in [02-icp-positioning.md](02-icp-positioning.md)).

**How it normally works:**
- For pages that already exist: rewrite the title and description to include the
  target keyword (and keep them under Google's length limits), fix or add the
  behind-the-scenes schema markup by hand, and go through the images one by one
  adding alt text.
- For new pages: actually write something genuinely useful about the topic —
  not just stuffed with the keyword, but matching what people are really searching
  for, based on the research from step 2.
- Add links from other relevant pages on the site pointing to the new or updated
  page.
- Then publish it — log into WordPress, paste it in, format it, hit the button.

**How long it takes:** 1–3 hours per page for a decent writer. This is the biggest
bottleneck in the whole process — it's the main reason small-business sites don't
get updated.

**→ This becomes Stage 3 (Generate) and Stage 4 (Publish).** An AI model writes
the draft instead of a copywriter, and it gets posted straight to WordPress through
its API instead of someone logging in and pasting it. A set of automatic checks
(don't publish too much at once, don't repeat existing content, meet a minimum
quality bar) does the job a good editor would normally do by eye.

## 4. Keeping the Google Business listing active (local SEO)

**Who does this:** Often a different person entirely — local SEO is its own
specialty, separate from working on the actual website.

**How it normally works:**
- Log into Google Business Profile roughly once a week and post an update — a
  promotion, a seasonal service, a quick tip.
- Watch for new customer reviews and reply to them — ideally within a day or two,
  since how fast and how well you respond actually affects your local ranking.
- Keep business hours, categories, service areas, and photos up to date.
- Make sure the business's name, address, and phone number are listed the same
  way everywhere online (Yelp, Apple Maps, etc.) — often handed off to a separate
  citation-building service.

**How long it takes:** 20–30 minutes a week if someone's actually disciplined
about it — which, for a solo business owner, it usually isn't.

**→ This becomes the later "v1.x" GBP feature** described in
[03-mvp-scope.md](03-mvp-scope.md), once Google approves API access — the weekly
posts and review replies are the parts that get automated. Keeping listings
consistent across other directories is not something Seovate does in the MVP.

## 5. Checking whether any of it worked (reporting)

**Who does this:** The consultant, once a month.

**How it normally works:**
- Check where the target keywords are ranking now versus last month, either by
  hand in Search Console or with a rank-tracking tool.
- Compare the numbers month to month — impressions, clicks, average position —
  and, if the business actually tracks it, try to connect that to real phone
  calls or form submissions.
- Turn it into a report for the client. This is usually the thing an agency
  charges for every single month, and it's often the weakest part of the whole
  relationship — a lot of agencies just auto-generate a generic report with no
  real insight in it (a trust problem covered in
  [01-market-research.md](01-market-research.md)).

**How long it takes:** 1–2 hours per client per month for an agency doing it
properly.

**→ This becomes Stage 5 (Measure & Report).** Instead of a report once a month,
it's a short email every week plus a public page anyone can check anytime — faster
and more honest than the usual monthly agency report.

## Putting it all together

A normal agency relationship looks like: audit the site once (maybe again every
few months), research keywords once a quarter, publish new content whenever the
writer/budget allows (often much less than once a week), touch the Google listing
weekly if someone's disciplined about it, and send a report once a month.

Seovate isn't inventing new SEO work — it's the exact same five things a good
consultant already does. What changes is the pace (all five run on a steady
schedule instead of in occasional bursts) and the two things that normally break
the whole process for a solo business owner: having someone available to actually
write the content, and having someone available to review and approve it.
