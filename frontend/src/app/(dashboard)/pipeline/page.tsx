"use client";

import { useEffect, useState } from "react";
import Tag from "@/components/ui/Tag";
import { SketchBox, InfoCallout } from "@/components/ui/SketchBox";
import { apiGet } from "@/lib/api";
import { PIPELINE_STAGES, PIPELINE_RUNS, CUSTOMER } from "@/lib/mockData";

const STATE_CLASSES = {
  complete: "bg-accent text-white border-accent",
  active: "bg-gold-soft text-gold border-gold",
  pending: "bg-neutral-soft text-muted border-[#c9c7ba]",
} as const;

const RUN_STATUS_VARIANT: Record<string, "success" | "pending" | "neutral"> = {
  Complete: "success",
  "In review": "pending",
  Waiting: "neutral",
  Scheduled: "neutral",
};

type Stage = { n: number; title: string; cadence: string; state: keyof typeof STATE_CLASSES };
type Run = { stage: string; last: string; next: string; status: string };
type PipelineResponse = { stages: Stage[]; runs: Run[] };

const FALLBACK: PipelineResponse = { stages: PIPELINE_STAGES, runs: PIPELINE_RUNS };

export default function PipelineStatusPage() {
  const [data, setData] = useState<PipelineResponse>(FALLBACK);

  useEffect(() => {
    apiGet<PipelineResponse>("/api/pipeline")
      .then(setData)
      .catch(() => setData(FALLBACK));
  }, []);

  return (
    <main className="flex-1 bg-paper">
      <header className="border-b-2 border-ink bg-white">
        <div className="mx-auto max-w-[960px] px-4 sm:px-8 py-6">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">How Seovate works</p>
          <h1 className="mt-1 text-2xl font-bold">This week&apos;s pipeline</h1>
        </div>
      </header>

      <div className="mx-auto max-w-[960px] px-4 sm:px-8 py-10">
        <p className="max-w-2xl text-muted">
          A scheduled pipeline, not an open-ended agent — five fixed stages run on a cadence, each
          one auditable on its own. This is what&apos;s running for {CUSTOMER.domain} right now.
        </p>

        <div className="mt-10 overflow-x-auto">
          <div className="relative flex min-w-[560px] items-start justify-between">
            <div className="absolute left-0 right-0 top-5 h-[2px] bg-[#d8d6ca]" />
            {data.stages.map((stage) => (
              <div key={stage.n} className="relative z-10 flex flex-1 flex-col items-center text-center px-1">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${STATE_CLASSES[stage.state]}`}
                >
                  {stage.n}
                </div>
                <div className="mt-2 text-sm font-bold">{stage.title}</div>
                <div className="text-xs text-muted">{stage.cadence}</div>
              </div>
            ))}
          </div>
        </div>

        <SketchBox className="mt-12 overflow-x-auto p-0">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b-2 border-ink p-4 text-left">Stage</th>
                <th className="border-b-2 border-ink p-4 text-left">Last run</th>
                <th className="border-b-2 border-ink p-4 text-left">Next run</th>
                <th className="border-b-2 border-ink p-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.runs.map((run, i) => (
                <tr key={run.stage} className={i !== data.runs.length - 1 ? "border-b border-[#eeece2]" : ""}>
                  <td className="p-4 font-medium">{run.stage}</td>
                  <td className="p-4 text-muted">{run.last}</td>
                  <td className="p-4 text-muted">{run.next}</td>
                  <td className="p-4">
                    <Tag variant={RUN_STATUS_VARIANT[run.status] ?? "neutral"}>{run.status}</Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SketchBox>

        <div className="mt-8">
          <InfoCallout>
            Fixed stages, typed inputs and outputs per step — not a free-roaming agent deciding
            what to do next. That&apos;s what makes every action traceable back to a specific
            reason.
          </InfoCallout>
        </div>
      </div>
    </main>
  );
}
