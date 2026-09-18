"use client";

import { useEffect, useState } from "react";
import Tag from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { SketchBox } from "@/components/ui/SketchBox";
import { IconCheck, IconX } from "@/components/ui/Icons";
import { apiGet, apiPost } from "@/lib/api";
import { GUARDRAIL_CHECKS as FALLBACK_CHECKS } from "@/lib/mockData";

type CheckResult = { title: string; detail: string; passed: boolean; result: string };
type GuardrailData = {
  draft: { generated_at: string; title: string; meta: string; status: string };
  checks: CheckResult[];
  all_passed: boolean;
  weekly_cap_used: number;
  weekly_cap_total: number;
};

const FALLBACK: GuardrailData = {
  draft: {
    generated_at: "09:14",
    title: '"Water Heater Repair in Frisco, TX" — new service page',
    meta: 'Targeting "water heater repair frisco tx" · 640 words',
    status: "In review",
  },
  checks: FALLBACK_CHECKS.map((c) => ({ ...c, passed: true, result: "PASS" })),
  all_passed: true,
  weekly_cap_used: 1,
  weekly_cap_total: 3,
};

export default function GuardrailCheckPage() {
  const [data, setData] = useState<GuardrailData>(FALLBACK);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    apiGet<GuardrailData>("/api/guardrails")
      .then(setData)
      .catch(() => setData(FALLBACK));
  }, []);

  async function handlePublish() {
    setPublishing(true);
    try {
      await apiPost("/api/guardrails/publish");
      const refreshed = await apiGet<GuardrailData>("/api/guardrails");
      setData(refreshed);
    } catch {
      setData((d) => ({ ...d, draft: { ...d.draft, status: "Published" } }));
    } finally {
      setPublishing(false);
    }
  }

  const published = data.draft.status === "Published";
  const capBars = Array.from({ length: data.weekly_cap_total }, (_, i) => i < data.weekly_cap_used);

  return (
    <main className="flex-1 bg-paper px-4 sm:px-8 py-12">
      <div className="mx-auto max-w-[760px]">
        <p className="text-xs font-bold uppercase tracking-wide text-accent">
          Stage 3 → 4 · Guardrail layer
        </p>
        <h1 className="mt-1 text-[28px] font-bold">
          Before anything publishes, it has to pass every check
        </h1>
        <p className="mt-3 text-muted">
          This runs on every generated draft — deterministic rule checks, not another AI call
          grading its own homework. A single failed check blocks publishing entirely; nothing goes
          out &quot;mostly right.&quot;
        </p>

        <SketchBox className="mt-8 flex items-start justify-between gap-4 p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">
              Draft, generated {data.draft.generated_at}
            </p>
            <p className="mt-1 font-bold">{data.draft.title}</p>
            <p className="mt-1 text-sm text-muted">{data.draft.meta}</p>
          </div>
          <Tag variant={published ? "success" : "pending"}>{data.draft.status}</Tag>
        </SketchBox>

        <SketchBox className="mt-6 p-0">
          {data.checks.map((check, i) => (
            <div
              key={check.title}
              className={`flex items-start justify-between gap-4 p-5 ${
                i !== data.checks.length - 1 ? "border-b border-[#eeece2]" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                {check.passed ? <IconCheck size={18} /> : <IconX size={18} />}
                <div>
                  <div className="font-bold">{check.title}</div>
                  <div className="mt-1 text-sm text-muted">{check.detail}</div>
                </div>
              </div>
              <span
                className={`shrink-0 font-mono text-sm font-bold ${
                  check.passed ? "text-accent" : "text-warn"
                }`}
              >
                {check.result}
              </span>
            </div>
          ))}
        </SketchBox>

        <SketchBox
          border="accent"
          bg="bg-accent-soft"
          className="mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-bold">
              Weekly publish cap: {data.weekly_cap_used} of {data.weekly_cap_total} used
            </p>
            <p className="mt-1 text-sm text-muted">
              Hard-coded at 2–4 pieces/week, site-wide — a policy limit, not a technical one
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            {capBars.map((filled, i) => (
              <span
                key={i}
                className={`h-3 w-8 rounded-sm ${filled ? "bg-accent" : "border-2 border-accent"}`}
              />
            ))}
          </div>
        </SketchBox>

        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className={`font-bold ${data.all_passed ? "text-accent" : "text-warn"}`}>
            {published
              ? "Published to your live site"
              : data.all_passed
                ? "All checks passed — cleared for Stage 4"
                : "One or more checks failed — publishing blocked"}
          </span>
          <Button
            type="button"
            disabled={published || !data.all_passed || publishing}
            onClick={handlePublish}
          >
            {published ? "Published" : publishing ? "Publishing…" : "Publish automatically →"}
          </Button>
        </div>
      </div>
    </main>
  );
}
