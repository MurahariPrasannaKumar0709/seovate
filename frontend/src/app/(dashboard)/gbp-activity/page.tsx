"use client";

import { useEffect, useState } from "react";
import Tag from "@/components/ui/Tag";
import { SketchBox } from "@/components/ui/SketchBox";
import { apiGet } from "@/lib/api";
import { GBP_POSTS, GBP_REVIEWS } from "@/lib/mockData";

type GbpPost = { tag: string; date: string; title: string; body: string };
type GbpReview = { name: string; stars: number; when: string; review: string; reply: string };
type GbpResponse = { posts: GbpPost[]; reviews: GbpReview[] };

const FALLBACK: GbpResponse = { posts: GBP_POSTS, reviews: GBP_REVIEWS };

function Stars({ count }: { count: number }) {
  return (
    <span className="text-gold">
      {"★".repeat(count)}
      <span className="text-[#d8d6ca]">{"★".repeat(5 - count)}</span>
    </span>
  );
}

export default function GBPActivityPage() {
  const [data, setData] = useState<GbpResponse>(FALLBACK);

  useEffect(() => {
    apiGet<GbpResponse>("/api/gbp")
      .then(setData)
      .catch(() => setData(FALLBACK));
  }, []);

  return (
    <main className="flex-1 bg-paper">
      <header className="border-b-2 border-ink bg-white">
        <div className="mx-auto max-w-[860px] px-8 py-6">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            v1.x · Local presence
          </p>
          <h1 className="mt-1 text-2xl font-bold">Google Business Profile activity</h1>
        </div>
      </header>

      <div className="mx-auto max-w-[860px] px-8 py-10">
        <section>
          <h2 className="text-lg font-bold">What&apos;s New posts</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {data.posts.map((post) => (
              <SketchBox key={post.title} className="p-5">
                <div className="flex items-center justify-between">
                  <Tag variant="pending">{post.tag}</Tag>
                  <span className="text-sm text-muted">{post.date}</span>
                </div>
                <h3 className="mt-3 font-bold">{post.title}</h3>
                <p className="mt-1 text-sm text-muted">{post.body}</p>
              </SketchBox>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold">Review responses</h2>
          <div className="mt-4 flex flex-col gap-4">
            {data.reviews.map((r) => (
              <SketchBox key={r.name} className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink font-bold">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold">{r.name}</div>
                    <div className="flex items-center gap-2 text-sm">
                      <Stars count={r.stars} />
                      <span className="text-muted">{r.when}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm italic text-muted">&quot;{r.review}&quot;</p>
                <div className="mt-3 border-l-2 border-accent pl-4 text-sm">
                  <div className="text-xs font-bold uppercase tracking-wide text-accent">
                    Seovate replied automatically
                  </div>
                  <p className="mt-1">{r.reply}</p>
                </div>
              </SketchBox>
            ))}
          </div>
        </section>

        <div className="mt-8 rounded bg-gold-soft p-4 text-sm text-gold">
          Citations and directory listings (Yelp, Apple Maps, etc.) are not automated — out of
          scope for this feature, by design.
        </div>
      </div>
    </main>
  );
}
