import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/auth/getSession";
import { createState } from "@/lib/integrations/state";

const GITHUB_SCOPE = "repo";

export async function GET(req: NextRequest) {
  const email = getSessionEmail(req);
  const next = req.nextUrl.searchParams.get("next") ?? "/settings/integrations";

  if (!email) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri =
    process.env.GITHUB_REDIRECT_URI ?? "http://localhost:3000/api/integrations/github/callback";

  if (!clientId) {
    const url = new URL(next, req.nextUrl.origin);
    url.searchParams.set("error", "github_not_configured");
    return NextResponse.redirect(url);
  }

  const state = createState({ provider: "github", next, n: Math.random().toString(36).slice(2) });

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", GITHUB_SCOPE);
  authorizeUrl.searchParams.set("state", state);

  return NextResponse.redirect(authorizeUrl.toString());
}
