import { NextRequest, NextResponse } from "next/server";
import { verifyState } from "@/lib/integrations/state";
import { getSessionUser } from "@/lib/auth/getSession";
import { encryptToken } from "@/lib/integrations/crypto";
import { prisma } from "@/lib/prisma";

type State = { provider: "github"; next: string };

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = verifyState<State>(req.nextUrl.searchParams.get("state"));

  const errorRedirect = (reason: string, next?: string) => {
    const url = new URL(next || "/settings/integrations", req.nextUrl.origin);
    url.searchParams.set("error", reason);
    return NextResponse.redirect(url);
  };

  if (!state || state.provider !== "github") return errorRedirect("github_integration_failed");
  if (!code) return errorRedirect("github_not_configured", state.next);

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri =
    process.env.GITHUB_REDIRECT_URI ?? "http://localhost:3000/api/integrations/github/callback";

  if (!clientId || !clientSecret) return errorRedirect("github_not_configured", state.next);

  const user = await getSessionUser(req);
  if (!user) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("next", state.next);
    return NextResponse.redirect(url);
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) return errorRedirect("github_auth_failed", state.next);
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return errorRedirect("github_auth_failed", state.next);

    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: "application/vnd.github+json" },
    });
    const githubUser = userRes.ok ? await userRes.json() : null;

    await prisma.integration.upsert({
      where: { userId_provider: { userId: user.id, provider: "github" } },
      create: {
        userId: user.id,
        provider: "github",
        status: "connected",
        accessTokenEnc: encryptToken(tokenData.access_token),
        scope: tokenData.scope ?? null,
        externalLabel: githubUser?.login ?? null,
      },
      update: {
        status: "connected",
        accessTokenEnc: encryptToken(tokenData.access_token),
        scope: tokenData.scope ?? null,
        externalLabel: githubUser?.login ?? null,
      },
    });

    return NextResponse.redirect(new URL(state.next || "/settings/integrations", req.nextUrl.origin));
  } catch (err) {
    console.error("GitHub integration callback failed:", err);
    return errorRedirect("github_auth_failed", state.next);
  }
}
