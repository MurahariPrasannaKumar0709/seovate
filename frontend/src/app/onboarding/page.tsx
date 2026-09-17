"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OnboardingStepper from "@/components/layout/OnboardingStepper";
import { Button } from "@/components/ui/Button";
import { SketchBox, InfoCallout } from "@/components/ui/SketchBox";
import { apiPost } from "@/lib/api";

const HOSTS = ["WordPress", "Vercel", "AWS", "Render", "Other"];

type DnsRecord = { host: string; type: string; value: string };

const FALLBACK_RECORD: DnsRecord = {
  host: "_seovate-verify.yourbusiness.com",
  type: "TXT",
  value: "seovate-verify=8f2c1e9a04b7",
};

export default function OnboardingStep1Page() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [host, setHost] = useState("Other");
  const [record, setRecord] = useState<DnsRecord | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerateRecord() {
    if (!url) return;
    setLoadingRecord(true);
    setError(null);
    try {
      const data = await apiPost<DnsRecord>("/api/onboarding/dns-record", { url, host });
      setRecord(data);
    } catch {
      setRecord(FALLBACK_RECORD);
    } finally {
      setLoadingRecord(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setError(null);
    try {
      await apiPost("/api/onboarding/verify-domain", { url, host });
      router.push("/onboarding/connect-integrations");
    } catch {
      setError("Couldn't verify the domain right now. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <main className="flex-1 bg-paper px-8 py-12">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-12 lg:flex-row">
        <OnboardingStepper activeStep={1} />

        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-accent">Step 1 of 4</p>
          <h1 className="mt-1 text-[32px] font-bold">Connect your website</h1>
          <p className="mt-3 max-w-[560px] text-muted">
            Works with any host — WordPress, Vercel, AWS, Render, or your own infrastructure.
            Verify you own the domain and pick how Seovate should publish changes to it.
          </p>

          <SketchBox className="mt-8 max-w-[560px] p-6">
            <form onSubmit={handleVerify} className="flex flex-col gap-5">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Your website URL
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={handleGenerateRecord}
                  placeholder="https://yourbusiness.com"
                  className="rounded border-2 border-ink px-3.5 py-3 text-sm outline-none focus:border-accent"
                />
              </label>

              <div>
                <p className="mb-1.5 text-sm font-medium">Where is it hosted?</p>
                <div className="flex flex-wrap gap-2">
                  {HOSTS.map((h) => (
                    <button
                      type="button"
                      key={h}
                      onClick={() => setHost(h)}
                      className={`rounded-full border-2 px-4 py-1.5 text-sm font-medium ${
                        host === h
                          ? "border-accent bg-accent-soft text-accent"
                          : "border-ink bg-white text-ink hover:bg-neutral-soft"
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t-2 border-dashed border-[#e4e2d8] pt-5">
                <p className="text-sm font-bold">Verify domain ownership</p>
                <p className="mt-1 text-sm text-muted">
                  Add this record at your DNS provider — works the same whether you&apos;re on
                  WordPress, a Vercel/Next.js deploy, AWS, Render, or anywhere else.
                </p>
                <div className="mt-3 rounded border-2 border-dashed border-muted bg-neutral-soft p-4 font-mono text-[13px] leading-relaxed">
                  Host: {loadingRecord ? "Generating…" : (record ?? FALLBACK_RECORD).host}
                  <br />
                  Type: {(record ?? FALLBACK_RECORD).type}
                  <br />
                  Value: {loadingRecord ? "Generating…" : (record ?? FALLBACK_RECORD).value}
                </div>
                {!record && !loadingRecord && (
                  <p className="mt-2 text-xs text-muted">
                    Enter your website URL above and click out of the field to generate your unique
                    verification record.
                  </p>
                )}
                <Link
                  href="#"
                  className="mt-3 inline-block text-sm font-medium text-accent hover:opacity-70"
                >
                  On WordPress? Skip DNS — connect with an Application Password instead →
                </Link>
              </div>

              {error && (
                <p className="rounded border-2 border-warn bg-warn-soft px-3 py-2 text-sm text-warn">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={verifying} className="w-full justify-center">
                {verifying ? "Verifying…" : "Verify domain"}
              </Button>
            </form>
          </SketchBox>

          <div className="mt-6 max-w-[560px]">
            <InfoCallout>
              Why we ask: domain verification lets Seovate publish updates no matter how your site
              is hosted — no FTP, no plugin install, no shared admin login.
            </InfoCallout>
          </div>

          <div className="mt-8 flex max-w-[560px] items-center justify-between">
            <Button variant="ghost" type="button" onClick={() => router.push("/signup")}>
              Back
            </Button>
            <button
              type="button"
              onClick={() => router.push("/onboarding/connect-integrations")}
              className="text-sm text-muted hover:opacity-70"
            >
              Skip for now — connect later
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
