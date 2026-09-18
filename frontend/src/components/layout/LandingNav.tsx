"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { LinkButton } from "@/components/ui/Button";

const SOLUTIONS_COLUMNS = [
  {
    heading: "By team",
    links: [
      { href: "/activity", label: "For Content Marketers" },
      { href: "/guardrails", label: "For SEO Teams" },
    ],
  },
  {
    heading: "By segment",
    links: [
      { href: "/gbp-activity", label: "For Agencies" },
      { href: "/opportunities", label: "For Enterprise" },
    ],
  },
  {
    heading: "Proof",
    links: [{ href: "/activity", label: "Customer Stories" }],
  },
];

export default function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b-2 border-ink">
      <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-4 sm:px-8">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 text-[15px] font-medium text-ink lg:flex">
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
                {SOLUTIONS_COLUMNS.map((col) => (
                  <div key={col.heading}>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted">{col.heading}</p>
                    <div className="mt-3 flex flex-col gap-1">
                      {col.links.map((l) => (
                        <Link key={l.label} href={l.href} className="rounded px-2 py-1.5 text-sm hover:bg-accent-soft">
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
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

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="flex h-9 w-9 items-center justify-center rounded border-2 border-ink lg:hidden"
        >
          {mobileOpen ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t-2 border-ink px-4 py-4 sm:px-8 lg:hidden">
          <nav className="flex flex-col gap-1 text-[15px] font-medium text-ink">
            <Link href="/pipeline" className="rounded px-2 py-2 hover:bg-neutral-soft" onClick={() => setMobileOpen(false)}>
              Platform
            </Link>
            {SOLUTIONS_COLUMNS.flatMap((col) => col.links).map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="rounded px-2 py-2 hover:bg-neutral-soft"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/guardrails" className="rounded px-2 py-2 hover:bg-neutral-soft" onClick={() => setMobileOpen(false)}>
              Resources
            </Link>
            <Link href="/pricing" className="rounded px-2 py-2 hover:bg-neutral-soft" onClick={() => setMobileOpen(false)}>
              Pricing
            </Link>
            <Link href="/login" className="rounded px-2 py-2 hover:bg-neutral-soft" onClick={() => setMobileOpen(false)}>
              Log in
            </Link>
            <LinkButton href="/signup" className="mt-2 justify-center rounded-full!">
              Start free trial →
            </LinkButton>
          </nav>
        </div>
      )}
    </header>
  );
}
