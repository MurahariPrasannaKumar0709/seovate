import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { getGitHubSelection } from "@/lib/integrations/githubSelection";

/** Prefills the audit form with the site the user already told Seovate about (via the GitHub
 *  scaffolding flow), if any — purely a UI convenience, not required to run an audit. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ siteUrl: null });

  const selection = await getGitHubSelection(user.id);
  return NextResponse.json({ siteUrl: selection?.siteUrl ?? null });
}

/** Forwards to the standalone Lighthouse service (separate Node deploy — see
 *  lighthouse-service/README.md) so the actual headless-Chrome audit run never touches this
 *  process. Session-gated the same way as the rest of the dashboard's API routes. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  const serviceUrl = process.env.LIGHTHOUSE_SERVICE_URL;
  const serviceSecret = process.env.LIGHTHOUSE_SERVICE_SECRET;
  if (!serviceUrl || !serviceSecret) {
    return NextResponse.json({ error: "lighthouse_not_configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const url = typeof body.url === "string" ? body.url : null;
  const device = body.device === "desktop" ? "desktop" : "mobile";
  const categories = Array.isArray(body.categories) ? body.categories : undefined;
  if (!url) return NextResponse.json({ error: "missing_url" }, { status: 400 });

  try {
    const res = await fetch(`${serviceUrl.replace(/\/$/, "")}/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceSecret}` },
      body: JSON.stringify({ url, device, categories }),
      // A full Lighthouse run routinely takes 15-30s — don't let Next's own defaults cut it off.
      signal: AbortSignal.timeout(90_000),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error ?? "audit_failed", message: data.message }, { status: 200 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("Lighthouse service request failed:", err);
    return NextResponse.json({ error: "audit_failed", message: "Couldn't reach the Lighthouse service." }, { status: 200 });
  }
}
