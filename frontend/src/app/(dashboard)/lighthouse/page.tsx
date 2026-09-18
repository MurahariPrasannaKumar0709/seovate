"use client";

import { useEffect, useState } from "react";
import Tag from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { SketchBox, InfoCallout } from "@/components/ui/SketchBox";

type CategoryKey = "performance" | "accessibility" | "best-practices" | "seo";
const CATEGORY_LABELS: Record<CategoryKey, string> = {
  performance: "Performance",
  accessibility: "Accessibility",
  "best-practices": "Best practices",
  seo: "SEO",
};
const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as CategoryKey[];

type Audit = {
  id: string;
  title: string;
  description: string;
  score: number | null;
  scoreDisplayMode: string;
  displayValue: string | null;
};
type CategorySummary = { title: string; score: number | null; auditIds: string[] };
type AuditReport = {
  url: string;
  fetchedAt: string;
  device: "mobile" | "desktop";
  categories: Partial<Record<CategoryKey, CategorySummary>>;
  audits: Audit[];
};
type AuditResult = AuditReport | { error: string; message?: string };

function scoreVariant(score: number | null): "success" | "pending" | "warn" {
  if (score === null) return "pending";
  if (score >= 0.9) return "success";
  if (score >= 0.5) return "pending";
  return "warn";
}

function ScoreCircle({ label, score }: { label: string; score: number | null }) {
  const variant = scoreVariant(score);
  const color = variant === "success" ? "#2f6b4f" : variant === "pending" ? "#9a6b1c" : "#a1401b";
  const soft = variant === "success" ? "bg-accent-soft" : variant === "pending" ? "bg-gold-soft" : "bg-warn-soft";
  return (
    <SketchBox className={`flex flex-col items-center gap-2 p-5 text-center ${soft}`}>
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full border-4 text-xl font-bold"
        style={{ borderColor: color, color }}
      >
        {score === null ? "—" : Math.round(score * 100)}
      </div>
      <span className="text-sm font-bold">{label}</span>
    </SketchBox>
  );
}

export default function LighthousePage() {
  const [url, setUrl] = useState("");
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [categories, setCategories] = useState<CategoryKey[]>(ALL_CATEGORIES);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lighthouse/audit")
      .then((res) => res.json())
      .then((data: { siteUrl: string | null }) => {
        if (data.siteUrl) setUrl(data.siteUrl);
      })
      .catch(() => {});
  }, []);

  function toggleCategory(cat: CategoryKey) {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  async function runAudit(e: React.FormEvent) {
    e.preventDefault();
    if (!url || categories.length === 0) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/lighthouse/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, device, categories }),
      });
      const data: AuditResult = await res.json();
      if ("error" in data) {
        setError(
          data.error === "lighthouse_not_configured"
            ? "The Lighthouse service isn't configured in this environment yet."
            : (data.message ?? "Couldn't run the audit. Try again in a moment.")
        );
        return;
      }
      setResult(data);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  const report = result && !("error" in result) ? result : null;

  return (
    <main className="flex-1 bg-paper">
      <header className="border-b-2 border-ink bg-white">
        <div className="mx-auto max-w-[960px] px-4 sm:px-8 py-6">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Real audit, not mock data</p>
          <h1 className="mt-1 text-2xl font-bold">Lighthouse audit</h1>
        </div>
      </header>

      <div className="mx-auto max-w-[960px] px-4 sm:px-8 py-10">
        <p className="max-w-2xl text-muted">
          Runs a real Google Lighthouse audit against any public URL — Performance, Accessibility,
          Best Practices, and SEO — using headless Chrome on a dedicated service. Takes about
          15-30 seconds per run.
        </p>

        <SketchBox className="mt-6 p-5">
          <form onSubmit={runAudit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              URL to audit
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://friscoplumbingco.com"
                className="rounded border-2 border-ink px-3.5 py-3 text-sm outline-none focus:border-accent"
              />
            </label>

            <div className="flex flex-col gap-4 sm:flex-row sm:gap-10">
              <div>
                <p className="mb-1.5 text-sm font-bold">Device</p>
                <div className="flex gap-4 text-sm">
                  {(["mobile", "desktop"] as const).map((d) => (
                    <label key={d} className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="device"
                        checked={device === d}
                        onChange={() => setDevice(d)}
                      />
                      {d === "mobile" ? "Mobile" : "Desktop"}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-sm font-bold">Categories</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                  {ALL_CATEGORIES.map((cat) => (
                    <label key={cat} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={categories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                      />
                      {CATEGORY_LABELS[cat]}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <p className="rounded border-2 border-warn bg-warn-soft px-3 py-2 text-sm text-warn">{error}</p>
            )}

            <Button type="submit" disabled={running || categories.length === 0} className="mt-2 w-full justify-center sm:w-auto">
              {running ? "Running audit… (15-30s)" : "Run Lighthouse audit →"}
            </Button>
          </form>
        </SketchBox>

        {report && (
          <>
            <p className="mt-8 text-sm text-muted">
              Audited <span className="font-mono text-ink">{report.url}</span> ·{" "}
              {report.device === "mobile" ? "Mobile" : "Desktop"} ·{" "}
              {new Date(report.fetchedAt).toLocaleString()}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {ALL_CATEGORIES.filter((cat) => report.categories[cat]).map((cat) => (
                <ScoreCircle key={cat} label={CATEGORY_LABELS[cat]} score={report.categories[cat]!.score} />
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-8">
              {ALL_CATEGORIES.filter((cat) => report.categories[cat]).map((cat) => {
                const summary = report.categories[cat]!;
                const auditsById = new Map(report.audits.map((a) => [a.id, a]));
                const categoryAudits = summary.auditIds
                  .map((id) => auditsById.get(id))
                  .filter((a): a is Audit => Boolean(a));

                return (
                  <section key={cat}>
                    <h2 className="text-lg font-bold">{CATEGORY_LABELS[cat]}</h2>
                    <SketchBox className="mt-3 p-0">
                      {categoryAudits.length === 0 && (
                        <p className="p-4 text-sm text-muted">No scored audits in this category.</p>
                      )}
                      {categoryAudits.map((audit, i) => (
                        <div
                          key={audit.id}
                          className={`flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between ${
                            i !== categoryAudits.length - 1 ? "border-b border-[#eeece2]" : ""
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-bold">{audit.title}</div>
                            <p className="mt-1 text-sm text-muted">{audit.description}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {audit.displayValue && (
                              <span className="text-sm text-muted">{audit.displayValue}</span>
                            )}
                            <Tag variant={scoreVariant(audit.score)}>
                              {audit.score === null ? "N/A" : `${Math.round(audit.score * 100)}`}
                            </Tag>
                          </div>
                        </div>
                      ))}
                    </SketchBox>
                  </section>
                );
              })}
            </div>
          </>
        )}

        {!report && !running && (
          <div className="mt-8">
            <InfoCallout>
              Enter a URL above and run an audit — this calls a real Lighthouse instance, not
              mock/demo data.
            </InfoCallout>
          </div>
        )}
      </div>
    </main>
  );
}
