import Logo from "@/components/ui/Logo";
import { LinkButton } from "@/components/ui/Button";
import { SketchBox } from "@/components/ui/SketchBox";
import { IconCheck } from "@/components/ui/Icons";
import { CUSTOMER } from "@/lib/mockData";

const ACTIONS = [
  "Published 2 new service pages targeted to local search intent",
  "Fixed 11 technical SEO issues (meta tags, alt text, broken links)",
  "Added structured data (schema) to 2 pages",
  "Posted 1 update to your Google Business Profile",
  "Responded to 2 new customer reviews",
];

const RANKINGS = [
  { keyword: '"plumber frisco tx"', before: "#14", after: "#9" },
  { keyword: '"emergency drain cleaning"', before: "#22", after: "#16" },
  { keyword: '"water heater repair frisco"', before: "—", after: "#31" },
];

export default function EmailReportPage() {
  return (
    <main className="flex flex-1 flex-col items-center bg-[#ece9df] px-6 py-14">
      <div className="w-full max-w-[560px]">
        <SketchBox className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Subject</p>
          <p className="mt-1 font-bold">
            Seovate — here&apos;s what happened on your site this week
          </p>
          <p className="mt-1 text-sm text-muted">from Seovate &lt;reports@seovate.com&gt;</p>
        </SketchBox>

        <SketchBox className="mt-5 p-9">
          <Logo />
          <h1 className="mt-6 text-2xl font-bold">
            Here&apos;s what Seovate did for {CUSTOMER.name} this week
          </h1>
          <p className="mt-1 text-sm text-muted">Week of Sep 9–15, 2026</p>

          <ul className="mt-6 flex flex-col">
            {ACTIONS.map((action, i) => (
              <li
                key={action}
                className={`flex items-start gap-2 py-3 text-sm ${
                  i !== ACTIONS.length - 1 ? "border-b border-[#eeece2]" : ""
                }`}
              >
                <IconCheck size={16} />
                <span>{action}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded bg-accent-soft p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-accent">
              Ranking movement
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {RANKINGS.map((r) => (
                <li key={r.keyword} className="flex items-center justify-between">
                  <span>{r.keyword}</span>
                  <span className="font-bold">
                    {r.before} → {r.after}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 text-center">
            <LinkButton href="/activity">View full activity log →</LinkButton>
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            We publish at most 3 new pages a week, by design — a guardrail, not a limitation.
          </p>
        </SketchBox>

        <p className="mt-5 text-center text-xs text-muted">
          {CUSTOMER.name} ·{" "}
          <a href="#" className="underline hover:text-ink">
            Unsubscribe from weekly reports
          </a>
        </p>
      </div>
    </main>
  );
}
