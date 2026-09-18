import Logo from "@/components/ui/Logo";
import Tag from "@/components/ui/Tag";
import { LinkButton } from "@/components/ui/Button";
import { SketchBox, StatCard } from "@/components/ui/SketchBox";
import { AUDIT_ISSUES } from "@/lib/mockData";

const SEVERITY_VARIANT = {
  High: "warn",
  Medium: "neutral",
  Low: "neutral",
} as const;

export default function AuditReportPage() {
  return (
    <main className="flex-1 bg-paper">
      <header className="border-b-2 border-ink bg-white">
        <div className="mx-auto flex h-[76px] max-w-[900px] items-center justify-between px-4 sm:px-8">
          <Logo />
          <Tag variant="success">Free SEO audit</Tag>
        </div>
      </header>

      <div className="mx-auto max-w-[900px] px-4 sm:px-8 py-14">
        <p className="text-xs font-bold uppercase tracking-wide text-accent">Site audit for</p>
        <h1 className="mt-1 text-[30px] font-bold">frisco-plumbing-co.com</h1>
        <p className="mt-2 text-sm text-muted">
          Crawled 41 pages · Sep 15, 2026 · No account needed to see this
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-[1fr_2fr]">
          <SketchBox className="flex flex-col items-center justify-center gap-1 p-8 text-center">
            <div className="flex items-baseline gap-1">
              <span className="font-hand text-[46px] text-warn">62</span>
              <span className="text-xl text-muted">/100</span>
            </div>
            <span className="text-sm text-muted">SEO health score</span>
          </SketchBox>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard value="14" label="Pages with issues" />
            <StatCard value="0" label="Schema markup found" />
            <StatCard value="3" label="Broken links" />
          </div>
        </div>

        <section className="mt-14">
          <h2 className="text-2xl font-bold">Issues we found</h2>
          <p className="mt-1 text-sm text-muted">
            If you connect your site, Seovate fixes everything below automatically — no developer
            needed.
          </p>
          <div className="mt-6 flex flex-col gap-4">
            {AUDIT_ISSUES.map((issue) => (
              <SketchBox key={issue.title} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <Tag variant={SEVERITY_VARIANT[issue.severity]}>{issue.severity}</Tag>
                  <div>
                    <div className="font-bold">{issue.title}</div>
                    <div className="mt-1 text-sm text-muted">{issue.detail}</div>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-bold text-accent">Auto-fixable</span>
              </SketchBox>
            ))}
          </div>
        </section>

        <SketchBox border="accent" bg="bg-accent-soft" className="mt-14 flex flex-col items-center gap-4 p-10 text-center">
          <h3 className="text-2xl font-bold">Want us to fix all of this?</h3>
          <p className="max-w-lg text-sm text-muted">
            Connect your WordPress site and Seovate starts fixing these issues within 48 hours —
            no approval needed from you.
          </p>
          <LinkButton href="/signup">Connect your site — $99/mo</LinkButton>
        </SketchBox>
      </div>
    </main>
  );
}
