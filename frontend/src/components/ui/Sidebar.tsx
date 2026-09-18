"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";

const NAV_ITEMS = [
  { href: "/pipeline", label: "Weekly site check" },
  { href: "/search-console", label: "Search Console" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/guardrails", label: "Guardrails" },
  { href: "/gbp-activity", label: "Business Profile" },
  { href: "/settings/integrations", label: "Integrations" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <>
      {/* Mobile/tablet top bar — the full sidebar becomes a slide-in drawer below lg */}
      <div className="flex items-center justify-between border-b-2 border-ink bg-white px-4 py-4 lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded border-2 border-ink"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M2 4.5h14M2 9h14M2 13.5h14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 -translate-x-full flex-col border-r-2 border-ink bg-white transition-transform duration-200 lg:static lg:z-auto lg:w-60 lg:translate-x-0 ${
          open ? "translate-x-0" : ""
        }`}
      >
        <div className="flex items-center justify-between border-b-2 border-ink px-6 py-6">
          <Logo />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded text-ink lg:hidden"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded px-3 py-2 text-sm font-bold transition-colors ${
                  active ? "bg-ink text-paper" : "text-ink hover:bg-neutral-soft"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <a
            href="/activity"
            target="_blank"
            rel="noreferrer"
            className="mt-2 rounded px-3 py-2 text-sm font-bold text-muted hover:bg-neutral-soft hover:text-ink"
          >
            Public activity log ↗
          </a>
        </nav>

        <div className="border-t-2 border-ink p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded px-3 py-2 text-left text-sm font-bold text-muted hover:bg-neutral-soft hover:text-ink"
          >
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
