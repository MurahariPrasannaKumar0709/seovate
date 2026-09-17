import Logo from "@/components/ui/Logo";
import { LinkButton } from "@/components/ui/Button";
import { SketchBox } from "@/components/ui/SketchBox";
import { IconCheck } from "@/components/ui/Icons";

const FEATURES = [
  "Technical SEO auto-fixes (meta tags, alt text, schema, broken links)",
  "Autonomous content publishing, capped at 2–4 pages/week",
  "Weekly reporting email + public activity log",
  "Rank tracking for a defined keyword set",
  "WordPress + Search Console integration",
  "Zero human approval needed — it just runs",
];

const COMPARISON = [
  { name: "RankMath / Yoast", price: "$8–28/mo" },
  { name: "Local SEO agency", price: "$700–2,500/mo" },
  { name: "Seovate Core", price: "$99/mo" },
];

export default function PricingPage() {
  return (
    <main className="flex-1 bg-paper">
      <header className="border-b-2 border-ink">
        <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-8">
          <Logo />
          <LinkButton href="/signup">Connect your site</LinkButton>
        </div>
      </header>

      <div className="mx-auto max-w-[1240px] px-8 py-16">
        <div className="text-center">
          <h1 className="text-[40px] font-bold">One plan. Everything included.</h1>
          <p className="mt-3 text-base text-muted">
            No tiers to compare. No &quot;suggestions only&quot; starter plan. Seovate does the work.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <SketchBox className="p-8">
            <p className="font-hand text-lg text-accent">Seovate Core</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-hand text-[46px]">$99</span>
              <span className="text-muted">/mo per site</span>
            </div>
            <p className="mt-2 text-sm text-muted">
              Cancel anytime. First fixes ship within 48 hours.
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <IconCheck size={16} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <LinkButton href="/signup" className="mt-8 w-full justify-center">
              Connect your site
            </LinkButton>
          </SketchBox>

          <div className="flex flex-col gap-6">
            <SketchBox border="accent" bg="bg-accent-soft" className="p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-accent">Add-on</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-hand text-3xl">$49</span>
                <span className="text-muted">/mo</span>
              </div>
              <h3 className="mt-2 text-lg font-bold">Google Business Profile</h3>
              <p className="mt-2 text-sm text-muted">
                Autonomous &quot;What&apos;s New&quot; posts and review responses. Ships once GBP API
                access clears — usually weeks after signup, not day one.
              </p>
            </SketchBox>

            <SketchBox className="p-6">
              <h3 className="font-bold">Compared to the alternative</h3>
              <ul className="mt-4 flex flex-col gap-3 text-sm">
                {COMPARISON.map((row) => (
                  <li key={row.name} className="flex items-center justify-between border-b border-[#eeece2] pb-3 last:border-0 last:pb-0">
                    <span>{row.name}</span>
                    <span className="font-bold">{row.price}</span>
                  </li>
                ))}
              </ul>
            </SketchBox>
          </div>
        </div>

        <p className="mt-14 text-center text-[13px] text-muted">
          Card required to start — the trial week itself finds and fixes real issues on your site,
          so you see results before you&apos;re billed.
        </p>
      </div>
    </main>
  );
}
