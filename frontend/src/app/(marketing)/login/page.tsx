"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import GoogleIcon from "@/components/ui/GoogleIcon";
import { Button } from "@/components/ui/Button";
import { SketchBox } from "@/components/ui/SketchBox";

const RESEND_COOLDOWN_SECONDS = 60;

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured:
    "Google sign-in isn't configured yet for this environment. Use your email instead.",
  google_auth_failed: "Google sign-in failed. Please try again or use your email instead.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(() => {
    const oauthError = searchParams.get("error");
    return oauthError
      ? (GOOGLE_ERROR_MESSAGES[oauthError] ?? "Something went wrong signing in with Google.")
      : null;
  });
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "login" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (data.previewUrl) setPreviewUrl(data.previewUrl);
      setStep("code");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, purpose: "login" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push("/pipeline");
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-paper px-6 py-16">
      <Logo size={32} />
      <SketchBox className="mt-8 w-full max-w-[420px] p-8">
        {step === "email" ? (
          <>
            <h1 className="text-center text-[22px] font-bold">Log in</h1>
            <p className="mt-2 text-center text-[13.5px] text-muted">
              We&apos;ll email you a 6-digit code — no password to remember.
            </p>

            <a href="/api/auth/google?next=/pipeline">
              <Button variant="ghost" type="button" className="mt-6 w-full justify-center">
                <GoogleIcon />
                Continue with Google
              </Button>
            </a>

            <div className="my-5 flex items-center gap-3 text-xs text-muted">
              <div className="h-px flex-1 bg-[#eeece2]" />
              or
              <div className="h-px flex-1 bg-[#eeece2]" />
            </div>

            {error && (
              <p className="mb-4 rounded border-2 border-warn bg-warn-soft px-3 py-2 text-sm text-warn">
                {error}
              </p>
            )}

            <form onSubmit={requestCode} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Work email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dana@friscoplumbingco.com"
                  className="rounded border-2 border-ink px-3.5 py-3 text-sm outline-none focus:border-accent"
                />
              </label>
              <Button type="submit" disabled={submitting} className="mt-2 w-full justify-center">
                {submitting ? "Sending code…" : "Send verification code"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-center text-[22px] font-bold">Check your email</h1>
            <p className="mt-2 text-center text-[13.5px] text-muted">
              Enter the 6-digit code we sent to <span className="font-medium text-ink">{email}</span>.
            </p>

            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block text-center text-xs font-bold text-accent hover:opacity-70"
              >
                (Dev preview) View the sent email →
              </a>
            )}

            {error && (
              <p className="mb-4 mt-4 rounded border-2 border-warn bg-warn-soft px-3 py-2 text-sm text-warn">
                {error}
              </p>
            )}

            <form onSubmit={verifyCode} className="mt-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Verification code
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="rounded border-2 border-ink px-3.5 py-3 text-center text-lg font-bold tracking-[0.4em] outline-none focus:border-accent"
                />
              </label>
              <Button type="submit" disabled={submitting || code.length !== 6} className="w-full justify-center">
                {submitting ? "Verifying…" : "Verify & log in"}
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                }}
                className="text-muted hover:opacity-70"
              >
                ← Change email
              </button>
              <button
                type="button"
                disabled={cooldown > 0 || submitting}
                onClick={() => requestCode()}
                className="font-bold text-accent hover:opacity-70 disabled:opacity-40"
              >
                {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
              </button>
            </div>
          </>
        )}
      </SketchBox>

      <p className="mt-6 text-[13px]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-bold hover:opacity-70">
          Create one
        </Link>
      </p>
    </main>
  );
}
