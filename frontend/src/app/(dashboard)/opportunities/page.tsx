"use client";

import { useEffect, useState } from "react";
import Tag from "@/components/ui/Tag";
import { SketchBox, StatCard } from "@/components/ui/SketchBox";
import { apiGet } from "@/lib/api";
import { OPPORTUNITIES } from "@/lib/mockData";

const STATUS_VARIANT: Record<string, "success" | "pending" | "neutral"> = {
  "Queued next": "success",
  Scheduled: "pending",
  Backlog: "neutral",
};

type Opportunity = {
  title: string;
  detail: string;
  type: string;
  volume: string;
  status: string;
};

const FALLBACK = { opportunities: OPPORTUNITIES };

export default function OpportunityQueuePage() {
  const [data, setData] = useState<{ opportunities: Opportunity[] }>(FALLBACK);

  useEffect(() => {
    apiGet<{ opportunities: Opportunity[] }>("/api/opportunities")
      .then(setData)
      .catch(() => setData(FALLBACK));
  }, []);

  return (
    <main className="flex-1 bg-paper">
      <header className="border-b-2 border-ink bg-white">
        <div className="mx-auto max-w-[900px] px-8 py-6">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Stage 2 · Research</p>
          <h1 className="mt-1 text-2xl font-bold">Opportunity queue</h1>
        </div>
      </header>

      <div className="mx-auto max-w-[900px] px-8 py-10">
        <p className="max-w-2xl text-muted">
          Keyword and content-gap research runs continuously in the background. Nothing here is
          published yet — this is the backlog, prioritized, waiting for Stage 3 to generate a
          draft and the guardrail layer to clear it.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard value="14" label="Opportunities identified" />
          <StatCard value="2/wk" label="Content publish cap" />
          <StatCard value="3" label="Scheduled for next run" />
        </div>

        <SketchBox className="mt-8 overflow-x-auto p-0">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b-2 border-ink p-4 text-left">Opportunity</th>
                <th className="border-b-2 border-ink p-4 text-left">Type</th>
                <th className="border-b-2 border-ink p-4 text-left">Est. volume</th>
                <th className="border-b-2 border-ink p-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.opportunities.map((opp, i) => (
                <tr key={opp.title} className={i !== data.opportunities.length - 1 ? "border-b border-[#eeece2]" : ""}>
                  <td className="p-4">
                    <div className="font-bold">{opp.title}</div>
                    <div className="mt-1 text-sm text-muted">{opp.detail}</div>
                  </td>
                  <td className="p-4 align-top text-muted">{opp.type}</td>
                  <td className="p-4 align-top text-muted">{opp.volume}</td>
                  <td className="p-4 align-top">
                    <Tag variant={STATUS_VARIANT[opp.status] ?? "neutral"}>{opp.status}</Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SketchBox>

        <p className="mt-6 text-[12.5px] text-muted">
          Next scheduled generation run: <span className="font-bold text-ink">tomorrow, 3:00 AM</span> —
          capped at 2 of these per week.
        </p>
      </div>
    </main>
  );
}
