import Link from "next/link";
import Logo from "@/components/ui/Logo";
import Tag from "@/components/ui/Tag";
import { LinkButton } from "@/components/ui/Button";
import { SketchBox } from "@/components/ui/SketchBox";
import { IconCheck } from "@/components/ui/Icons";
import { HERO_ACTIVITY } from "@/lib/mockData";

const HOW_IT_WORKS = [
  {
    n: "1",
    title: "Connect your site",
    body: "WordPress application password, Google Search Console, and (optional) Google Business Profile. Takes about 5 minutes.",
  },
  {
    n: "2",
    title: "Seovate gets to work",
    body: "Technical fixes ship first — meta tags, alt text, schema, broken links. Content and GBP posts follow, capped and reviewed by guardrails.",
  },
  {
    n: "3",
    title: "You get told, not asked",
    body: "A weekly email and a public activity log show exactly what changed and why. No dashboard to log into.",
  },
];

const COMPARISON_ROWS = [
  { label: "Finds SEO issues", rankmath: "Yes", agency: "Yes", seovate: "Yes" },
  {
    label: "Fixes issues automatically",
    rankmath: "No — you fix them",
    agency: "Manual, billed hourly",
    seovate: "Yes, autonomously",
  },
  {
    label: "Publishes new content",
    rankmath: "Drafts suggestions",
    agency: "Slow, expensive",
    seovate: "Yes, capped & guardrailed",
  },
  { label: "Monthly cost", rankmath: "$8–28/mo", agency: "$1,000+/mo", seovate: "$99/mo" },
];

export default function LandingPage() {
  return (
    <main className="flex-1 bg-paper">
      {/* Nav */}
      <header className="border-b-2 border-ink">
        <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-8">
          <Logo />
          <nav className="flex items-center gap-8 text-[15px] font-medium text-ink">
            <Link href="/pipeline" className="hover:opacity-70">
              Platform
            </Link>

            <div className="group relative">
              <button type="button" className="flex items-center gap-1 text-accent">
                Solutions
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="rotate-180">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
                </svg>
              </button>
              <div className="invisible absolute left-1/2 top-full z-10 w-140 -translate-x-1/2 pt-3 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
                <div className="grid grid-cols-3 gap-6 rounded-xl border border-[#eeece2] bg-white p-6 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">By team</p>
                    <div className="mt-3 flex flex-col gap-1">
                      <Link href="/activity" className="rounded px-2 py-1.5 text-sm hover:bg-accent-soft">
                        For Content Marketers
                      </Link>
                      <Link href="/guardrails" className="rounded px-2 py-1.5 text-sm text-accent hover:bg-accent-soft">
                        For SEO Teams
                      </Link>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">By segment</p>
                    <div className="mt-3 flex flex-col gap-1">
                      <Link href="/gbp-activity" className="rounded px-2 py-1.5 text-sm hover:bg-accent-soft">
                        For Agencies
                      </Link>
                      <Link href="/opportunities" className="rounded px-2 py-1.5 text-sm hover:bg-accent-soft">
                        For Enterprise
                      </Link>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">Proof</p>
                    <div className="mt-3 flex flex-col gap-1">
                      <Link href="/activity" className="rounded px-2 py-1.5 text-sm hover:bg-accent-soft">
                        Customer Stories
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Link href="/guardrails" className="hover:opacity-70">
              Resources
            </Link>
            <Link href="/pricing" className="hover:opacity-70">
              Pricing
            </Link>

            <Link href="/login" className="hover:opacity-70">
              Log in
            </Link>
            <LinkButton href="/signup" className="rounded-full!">
              Start free trial →
            </LinkButton>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-[1240px] grid-cols-1 gap-12 px-8 py-20 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Tag variant="success">Autonomous SEO agent</Tag>
          <h1 className="mt-5 max-w-xl text-[52px] font-bold leading-[1.08]">
            Your website&apos;s SEO, handled — without you lifting a finger.
          </h1>
          <p className="mt-5 max-w-[520px] text-[19px] text-muted">
            Seovate plugs into your WordPress site and Google Business Profile, then quietly fixes
            technical issues, publishes local content, and posts updates — every week, with zero
            approvals needed from you.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <LinkButton href="/audit-report" className="!px-7 !py-4 !text-base">
              Connect your site — free
            </LinkButton>
            <Link href="/activity" className="font-semibold text-accent hover:opacity-70">
              See a real activity log →
            </Link>
          </div>
          <p className="mt-4 text-[13px] text-muted">No credit card. No dashboard you have to check.</p>
        </div>

        <div className="flex items-start justify-center">
          <SketchBox className="w-full max-w-md rotate-1 p-5 shadow-[6px_6px_0_var(--ink)]">
            <div className="flex items-center justify-between border-b border-[#eeece2] pb-3">
              <span className="font-bold">This week on your site</span>
              <Tag variant="success">Live</Tag>
            </div>
            <ul className="mt-3 flex flex-col gap-3">
              {HERO_ACTIVITY.map((item) => (
                <li key={item.title} className="flex items-start gap-2 text-sm">
                  <IconCheck size={16} />
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-muted">{item.meta}</div>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/activity"
              className="mt-4 block text-[12px] font-bold text-accent hover:opacity-70"
            >
              → Full public log, no login needed
            </Link>
          </SketchBox>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y-2 border-ink bg-accent-soft py-4">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-center gap-x-10 gap-y-2 px-8 text-center text-sm font-bold">
          <span>✓ Max 3 new pages / week — by design</span>
          <span>✓ Every action shown in a public log</span>
          <span>✓ Nothing touches your site without a written reason</span>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-[1240px] px-8 py-20">
        <p className="font-hand text-lg text-accent">how it works</p>
        <h2 className="mt-1 text-[36px] font-bold">Three steps. Then it just runs.</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {HOW_IT_WORKS.map((step) => (
            <SketchBox key={step.n} className="p-6">
              <div className="font-hand text-[34px] text-accent">{step.n}</div>
              <h3 className="mt-2 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted">{step.body}</p>
            </SketchBox>
          ))}
        </div>
      </section>

      {/* Differentiation table */}
      <section className="mx-auto max-w-[1240px] px-8 py-10">
        <p className="font-hand text-lg text-accent">why not a plugin, why not an agency</p>
        <h2 className="mt-1 text-[36px] font-bold">Suggestions vs. action</h2>
        <SketchBox className="mt-8 overflow-x-auto p-0">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b-2 border-ink p-4 text-left"></th>
                <th className="border-b-2 border-ink p-4 text-left font-bold">RankMath / Yoast</th>
                <th className="border-b-2 border-ink p-4 text-left font-bold">SEO Agency</th>
                <th className="border-b-2 border-ink bg-accent-soft p-4 text-left font-bold text-accent">
                  Seovate
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={row.label} className={i !== COMPARISON_ROWS.length - 1 ? "border-b border-[#eeece2]" : ""}>
                  <td className="p-4 font-medium">{row.label}</td>
                  <td className="p-4 text-muted">{row.rankmath}</td>
                  <td className="p-4 text-muted">{row.agency}</td>
                  <td className="bg-accent-soft p-4 font-bold">{row.seovate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SketchBox>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-[1240px] px-8 py-14">
        <SketchBox border="dashed" className="flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-hand text-base text-accent">pricing</p>
            <h3 className="mt-1 text-2xl font-bold">Seovate Core — $99/mo per site.</h3>
            <p className="mt-2 text-sm text-muted">
              Technical fixes, content publishing, reporting. GBP add-on $49/mo. Cancel anytime.
            </p>
          </div>
          <LinkButton href="/pricing">See full pricing →</LinkButton>
        </SketchBox>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-ink">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-8 py-6 text-[13px] text-muted">
          <span>© Seovate</span>
          <div className="flex flex-wrap gap-6">
            <Link href="/privacy" className="hover:opacity-70">
              Privacy
            </Link>
            <Link href="/guardrails" className="hover:opacity-70">
              How guardrails work
            </Link>
            <Link href="/contact" className="hover:opacity-70">
              Contact
            </Link>
            <a
              href="https://github.com/seovate/seovate"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-ink hover:opacity-70"
            >
              Open source ↗
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
