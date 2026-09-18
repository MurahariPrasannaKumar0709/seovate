"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/ui/Logo";
import Tag from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { SketchBox, InfoCallout } from "@/components/ui/SketchBox";
import { IconCheck } from "@/components/ui/Icons";
import { INTEGRATIONS_ONBOARDING } from "@/lib/mockData";

// Real OAuth connections (Next.js API routes, session-scoped, Postgres-backed) for these 4 rows.
const OAUTH_PROVIDERS: Record<string, { provider: string; startPath: string }> = {
  "Google Search Console": {
    provider: "google_search_console",
    startPath: "/api/integrations/google-search-console",
  },
  "Google Analytics 4": { provider: "google_analytics", startPath: "/api/integrations/google-analytics" },
  "Google Business Profile": {
    provider: "google_business_profile",
    startPath: "/api/integrations/google-business-profile",
  },
  GitHub: { provider: "github", startPath: "/api/integrations/github" },
};

type OauthStatus = { provider: string; connected: boolean; label: string | null };

function oauthErrorMessage(code: string): string {
  if (code.endsWith("_not_configured")) {
    return "That integration isn't configured yet in this environment.";
  }
  return "Connecting that account failed. Please try again.";
}

export default function ConnectIntegrationsPage() {
  return (
    <Suspense fallback={null}>
      <ConnectIntegrationsPageInner />
    </Suspense>
  );
}

function ConnectIntegrationsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [oauthStatus, setOauthStatus] = useState<Record<string, OauthStatus>>({});
  const [error] = useState<string | null>(() => {
    const code = searchParams.get("error");
    return code ? oauthErrorMessage(code) : null;
  });

  useEffect(() => {
    fetch("/api/integrations/status")
      .then((res) => res.json())
      .then((data: { integrations: OauthStatus[] }) => {
        setOauthStatus(Object.fromEntries(data.integrations.map((i) => [i.provider, i])));
      })
      .catch(() => {});
  }, []);

  return (
    <main className="flex-1 bg-paper px-4 sm:px-8 py-12">
      <div className="mx-auto max-w-[760px]">
        <Logo />
        <p className="mt-8 text-xs font-bold uppercase tracking-wide text-accent">Step 2 of 4</p>
        <h1 className="mt-1 text-[30px] font-bold">Connect your data sources</h1>
        <p className="mt-3 text-muted">
          Your website is already connected. Everything below is optional at signup, but the more
          Seovate can see, the better its decisions — connect what you can now, add the rest later
          from Settings.
        </p>

        {error && (
          <p className="mt-4 rounded border-2 border-warn bg-warn-soft px-3 py-2 text-sm text-warn">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-4">
          {INTEGRATIONS_ONBOARDING.map((integration) => {
            const oauth = OAUTH_PROVIDERS[integration.name];
            const isConnected = oauth ? (oauthStatus[oauth.provider]?.connected ?? false) : integration.connected;
            return (
              <SketchBox key={integration.name} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink text-xs font-bold">
                    {integration.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{integration.name}</span>
                      {integration.optional && <Tag variant="neutral">Optional</Tag>}
                    </div>
                    <p className="mt-1 text-sm text-muted">{integration.description}</p>
                  </div>
                </div>
                {isConnected ? (
                  <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-accent">
                    <IconCheck size={16} /> Connected
                  </span>
                ) : oauth ? (
                  <a
                    href={`${oauth.startPath}?next=/onboarding/connect-integrations`}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded border-2 border-ink bg-white px-4 py-2 text-sm font-bold text-ink transition-opacity hover:bg-neutral-soft"
                  >
                    Connect
                  </a>
                ) : (
                  <span className="shrink-0 text-sm text-muted">Connected automatically</span>
                )}
              </SketchBox>
            );
          })}
        </div>

        <div className="mt-6">
          <InfoCallout>
            GitHub is for teams whose site or content pipeline lives in a repo rather than a CMS
            admin panel — most customers can skip it. Seovate&apos;s own codebase is open source,
            too: you can view or self-host it from the same connection screen in Settings.
          </InfoCallout>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" type="button" onClick={() => router.push("/onboarding")}>
            Back
          </Button>
          <Button type="button" onClick={() => router.push("/onboarding/setup-complete")}>
            Continue
          </Button>
        </div>
      </div>
    </main>
  );
}
