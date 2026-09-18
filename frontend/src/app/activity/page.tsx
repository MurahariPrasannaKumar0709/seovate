"use client";

import { useEffect, useMemo, useState } from "react";
import Logo from "@/components/ui/Logo";
import Tag from "@/components/ui/Tag";
import { SketchBox, StatCard, InfoCallout } from "@/components/ui/SketchBox";
import { apiGet } from "@/lib/api";
import { ACTIVITY_TIMELINE, CUSTOMER } from "@/lib/mockData";

const FILTERS = ["All activity", "Content published", "Technical fixes", "Google Business Profile"];

const FILTER_TAG: Record<string, string | null> = {
  "All activity": null,
  "Content published": "Content published",
  "Technical fixes": "Technical fix",
  "Google Business Profile": "Google Business Profile",
};

const TAG_VARIANT: Record<string, "success" | "neutral" | "pending"> = {
  "Content published": "success",
  "Technical fix": "neutral",
  "Google Business Profile": "pending",
};

type ActivityItem = {
  icon: string;
  title: string;
  detail: string;
  date: string;
  tag: string;
};

type ActivityResponse = {
  customer: { name: string; domain: string };
  timeline: ActivityItem[];
};

const FALLBACK: ActivityResponse = { customer: CUSTOMER, timeline: ACTIVITY_TIMELINE };

export default function ActivityLogPage() {
  const [activeFilter, setActiveFilter] = useState("All activity");
  const [data, setData] = useState<ActivityResponse>(FALLBACK);

  useEffect(() => {
    apiGet<ActivityResponse>("/api/activity")
      .then(setData)
      .catch(() => setData(FALLBACK));
  }, []);

  const items = useMemo(() => {
    const wanted = FILTER_TAG[activeFilter];
    return wanted ? data.timeline.filter((i) => i.tag === wanted) : data.timeline;
  }, [activeFilter, data.timeline]);

  return (
    <main className="flex-1 bg-paper">
      <header className="border-b-2 border-ink bg-white">
        <div className="mx-auto flex max-w-[920px] items-center justify-between px-4 sm:px-8 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">
              Public activity log
            </p>
            <h1 className="mt-1 text-2xl font-bold">{data.customer.name}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            Powered by <Logo size={20} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[920px] px-4 sm:px-8 py-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard value="11" label="Issues fixed this week" />
          <StatCard value="2" label="New pages published this week" />
          <StatCard value="+4" label="Keywords moved up in rank" />
        </div>

        <div className="mt-6">
          <InfoCallout>
            Seovate publishes at most 3 new pages per week on this site — a deliberate limit to
            stay well within Google&apos;s guidelines, not a technical cap.
          </InfoCallout>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-medium ${
                activeFilter === f
                  ? "border-ink bg-ink text-paper"
                  : "border-ink bg-white text-ink hover:bg-neutral-soft"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <ol className="relative mt-8 flex flex-col gap-6 border-l-2 border-[#e4e2d8] pl-8">
          {items.map((item) => (
            <li key={item.title} className="relative">
              <span className="absolute -left-[42px] top-4 flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-paper text-sm">
                {item.icon}
              </span>
              <SketchBox className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">{item.title}</span>
                  <span className="text-sm text-muted">{item.date}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{item.detail}</p>
                <div className="mt-3">
                  <Tag variant={TAG_VARIANT[item.tag] ?? "neutral"}>{item.tag}</Tag>
                </div>
              </SketchBox>
            </li>
          ))}
        </ol>

        <a href="#" className="mt-6 inline-block text-sm font-bold text-accent hover:opacity-70">
          Load earlier activity →
        </a>
      </div>
    </main>
  );
}
