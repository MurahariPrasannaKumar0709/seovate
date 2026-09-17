import { NextRequest, NextResponse } from "next/server";
import { verifyState } from "@/lib/integrations/state";
import { getSessionUser } from "@/lib/auth/getSession";
import { encryptToken } from "@/lib/integrations/crypto";
import { GOOGLE_INTEGRATION_SCOPES, type GoogleIntegrationProvider } from "@/lib/integrations/providers";
import { prisma } from "@/lib/prisma";

type State = { provider: GoogleIntegrationProvider; next: string };

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = verifyState<State>(req.nextUrl.searchParams.get("state"));

  const errorRedirect = (reason: string, next?: string) => {
    const url = new URL(next || "/settings/integrations", req.nextUrl.origin);
    url.searchParams.set("error", reason);
    return NextResponse.redirect(url);
  };

  if (!state || !(state.provider in GOOGLE_INTEGRATION_SCOPES)) {
    return errorRedirect("google_integration_failed");
  }
  if (!code) return errorRedirect(`${state.provider}_not_configured`, state.next);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_INTEGRATIONS_REDIRECT_URI ??
    "http://localhost:3000/api/integrations/google/callback";

  if (!clientId || !clientSecret) return errorRedirect(`${state.provider}_not_configured`, state.next);

  const user = await getSessionUser(req);
  if (!user) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("next", state.next);
    return NextResponse.redirect(url);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return errorRedirect(`${state.provider}_auth_failed`, state.next);
    const tokenData = await tokenRes.json();

    const userInfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = userInfoRes.ok ? await userInfoRes.json() : null;

    await prisma.integration.upsert({
      where: { userId_provider: { userId: user.id, provider: state.provider } },
      create: {
        userId: user.id,
        provider: state.provider,
        status: "connected",
        accessTokenEnc: encryptToken(tokenData.access_token),
        refreshTokenEnc: tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : null,
        scope: tokenData.scope ?? GOOGLE_INTEGRATION_SCOPES[state.provider],
        externalLabel: userInfo?.email ?? null,
        tokenExpiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
      },
      update: {
        status: "connected",
        accessTokenEnc: encryptToken(tokenData.access_token),
        // Google only returns a refresh_token on the first consent — keep the existing one
        // if this is a re-connect that didn't get a new one.
        ...(tokenData.refresh_token ? { refreshTokenEnc: encryptToken(tokenData.refresh_token) } : {}),
        scope: tokenData.scope ?? GOOGLE_INTEGRATION_SCOPES[state.provider],
        externalLabel: userInfo?.email ?? null,
        tokenExpiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
      },
    });

    return NextResponse.redirect(new URL(state.next || "/settings/integrations", req.nextUrl.origin));
  } catch (err) {
    console.error(`Google integration (${state.provider}) callback failed:`, err);
    return errorRedirect(`${state.provider}_auth_failed`, state.next);
  }
}
