"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Tag from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { SketchBox } from "@/components/ui/SketchBox";
import { apiGet, apiPost } from "@/lib/api";
import { INTEGRATIONS_SETTINGS } from "@/lib/mockData";

type Integration = {
  initials: string;
  name: string;
  meta: string;
  status: "Connected" | "Not connected" | "Pending approval";
  statusVariant: "success" | "neutral" | "pending";
  action: string;
};

const STATUS_VARIANT: Record<string, "success" | "neutral" | "pending"> = {
  Connected: "success",
  "Not connected": "neutral",
  "Pending approval": "pending",
};

const FALLBACK = { integrations: INTEGRATIONS_SETTINGS };

// The 4 rows below are real OAuth connections (Next.js API routes, session-scoped, Postgres-backed)
// rather than the FastAPI demo data — this maps each row's display name to its provider key/start route.
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

type OauthStatus = { provider: string; connected: boolean; label: string | null; connectedAt: string | null };

function oauthErrorMessage(code: string): string {
  if (code.endsWith("_not_configured")) {
    return "That integration isn't configured yet in this environment.";
  }
  if (code.endsWith("_auth_failed") || code.endsWith("_integration_failed")) {
    return "Connecting that account failed. Please try again.";
  }
  return "Something went wrong connecting that account.";
}

export default function IntegrationsSettingsPage() {
  return (
    <Suspense fallback={null}>
      <IntegrationsSettingsPageInner />
    </Suspense>
  );
}

function IntegrationsSettingsPageInner() {
  const searchParams = useSearchParams();
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS_SETTINGS);
  const [oauthStatus, setOauthStatus] = useState<Record<string, OauthStatus>>({});
  const [connecting, setConnecting] = useState<string | null>(null);
  const [notifyByEmail, setNotifyByEmail] = useState(true);
  const [notifySaving, setNotifySaving] = useState(false);
  const [error] = useState<string | null>(() => {
    const code = searchParams.get("error");
    return code ? oauthErrorMessage(code) : null;
  });

  useEffect(() => {
    apiGet<{ integrations: Omit<Integration, "statusVariant">[] }>("/api/integrations")
      .then((data) =>
        setIntegrations(
          data.integrations.map((i) => ({ ...i, statusVariant: STATUS_VARIANT[i.status] ?? "neutral" }))
        )
      )
      .catch(() => setIntegrations(FALLBACK.integrations));

    fetch("/api/integrations/status")
      .then((res) => res.json())
      .then((data: { integrations: OauthStatus[] }) => {
        setOauthStatus(Object.fromEntries(data.integrations.map((i) => [i.provider, i])));
      })
      .catch(() => {});

    fetch("/api/integrations/google-search-console/notifications")
      .then((res) => res.json())
      .then((data: { enabled?: boolean }) => setNotifyByEmail(data.enabled ?? true))
      .catch(() => {});
  }, []);

  async function handleToggleNotify() {
    const next = !notifyByEmail;
    setNotifySaving(true);
    setNotifyByEmail(next);
    try {
      const res = await fetch("/api/integrations/google-search-console/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) setNotifyByEmail(!next);
    } catch {
      setNotifyByEmail(!next);
    } finally {
      setNotifySaving(false);
    }
  }

  async function handleDisconnect(provider: string) {
    setConnecting(provider);
    try {
      const res = await fetch(`/api/integrations/${provider}/disconnect`, { method: "POST" });
      if (!res.ok) return;
      setOauthStatus((s) => ({ ...s, [provider]: { provider, connected: false, label: null, connectedAt: null } }));
    } finally {
      setConnecting(null);
    }
  }

  async function handleAction(integration: Integration) {
    if (integration.action !== "Connect") return;
    setConnecting(integration.name);
    try {
      await apiPost(`/api/integrations/${encodeURIComponent(integration.name)}/connect`);
      setIntegrations((list) =>
        list.map((i) =>
          i.name === integration.name
            ? { ...i, status: "Connected", statusVariant: "success", action: "Manage" }
            : i
        )
      );
    } catch {
      // Backend unreachable — leave state as-is.
    } finally {
      setConnecting(null);
    }
  }

  return (
    <main className="flex-1 bg-paper">
      <header className="border-b-2 border-ink bg-white">
        <div className="mx-auto max-w-[880px] px-8 py-6">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Settings</p>
          <h1 className="mt-1 text-2xl font-bold">Integrations</h1>
        </div>
      </header>

      <div className="mx-auto max-w-[880px] px-8 py-10">
        <p className="text-sm text-muted">
          Manage every account Seovate uses to see and act on your site.
        </p>

        {error && (
          <p className="mt-4 rounded border-2 border-warn bg-warn-soft px-3 py-2 text-sm text-warn">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-4">
          {integrations.map((integration) => {
            const oauth = OAUTH_PROVIDERS[integration.name];
            const status = oauth ? oauthStatus[oauth.provider] : undefined;

            if (oauth) {
              const connected = status?.connected ?? false;
              return (
                <SketchBox
                  key={integration.name}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink text-xs font-bold">
                      {integration.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{integration.name}</span>
                        <Tag variant={connected ? "success" : "neutral"}>
                          {connected ? "Connected" : "Not connected"}
                        </Tag>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {connected && status?.label ? `Connected as ${status.label}` : integration.meta}
                      </p>
                    </div>
                  </div>
                  {connected ? (
                    <div className="flex shrink-0 items-center gap-2">
                      {integration.name === "Google Search Console" && (
                        <label className="flex items-center gap-2 text-xs text-muted">
                          <input
                            type="checkbox"
                            checked={notifyByEmail}
                            disabled={notifySaving}
                            onChange={handleToggleNotify}
                            className="h-4 w-4"
                          />
                          Email me about sitemap issues &amp; weekly reports
                        </label>
                      )}
                      {integration.name === "GitHub" && (
                        <a
                          href="/github/select-repo"
                          className="inline-flex items-center justify-center gap-2 rounded border-2 border-ink bg-white px-4 py-2 text-sm font-bold text-ink transition-opacity hover:bg-neutral-soft"
                        >
                          Manage repo →
                        </a>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={connecting === oauth.provider}
                        onClick={() => handleDisconnect(oauth.provider)}
                      >
                        {connecting === oauth.provider ? "Disconnecting…" : "Disconnect"}
                      </Button>
                    </div>
                  ) : (
                    <a
                      href={`${oauth.startPath}?next=${
                        integration.name === "GitHub" ? "/github/select-repo" : "/settings/integrations"
                      }`}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded border-2 border-ink bg-white px-4 py-2 text-sm font-bold text-ink transition-opacity hover:bg-neutral-soft"
                    >
                      Connect
                    </a>
                  )}
                </SketchBox>
              );
            }

            return (
              <SketchBox key={integration.name} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink text-xs font-bold">
                    {integration.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{integration.name}</span>
                      <Tag variant={integration.statusVariant}>{integration.status}</Tag>
                    </div>
                    <p className="mt-1 text-sm text-muted">{integration.meta}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="shrink-0"
                  disabled={integration.action !== "Connect" || connecting === integration.name}
                  onClick={() => handleAction(integration)}
                >
                  {connecting === integration.name ? "Connecting…" : integration.action}
                </Button>
              </SketchBox>
            );
          })}
        </div>

        <SketchBox className="mt-8 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </div>
            <div>
              <div className="font-bold">Seovate is open source</div>
              <p className="mt-1 text-sm text-muted">
                View the code, self-host your own instance, or open an issue — the repo is public.
              </p>
            </div>
          </div>
          <a
            href="https://github.com/seovate/seovate"
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center rounded border-2 border-ink bg-ink px-4 py-2 text-sm font-bold text-paper hover:opacity-90"
          >
            github.com/seovate/seovate ↗
          </a>
        </SketchBox>
      </div>
    </main>
  );
}
