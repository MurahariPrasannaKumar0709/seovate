"use client";

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

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r-2 border-ink bg-white">
      <div className="border-b-2 border-ink px-6 py-6">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
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
  );
}
