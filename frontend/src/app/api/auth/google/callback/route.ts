import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { upsertUser } from "@/lib/auth/store";
import { setSessionCookie } from "@/lib/auth/session";

const STATE_SECRET = process.env.SESSION_SECRET ?? "seovate-dev-secret-do-not-use-in-production";

function signState(value: string): string {
  return crypto.createHmac("sha256", STATE_SECRET).update(value).digest("hex");
}

function verifyState(state: string): { next: string } | null {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) return null;
  const expected = signState(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_LOGIN_REDIRECT_URI ?? "http://localhost:3000/api/auth/google/callback";

  const errorRedirect = (reason: string) => {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("error", reason);
    return NextResponse.redirect(url);
  };

  if (!clientId || !clientSecret) return errorRedirect("google_not_configured");
  if (!code || !state) return errorRedirect("google_auth_failed");

  const decodedState = verifyState(state);
  if (!decodedState) return errorRedirect("google_auth_failed");

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

    if (!tokenRes.ok) return errorRedirect("google_auth_failed");
    const tokenData = await tokenRes.json();

    const userInfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userInfoRes.ok) return errorRedirect("google_auth_failed");
    const userInfo = await userInfoRes.json();

    if (!userInfo.email) return errorRedirect("google_auth_failed");

    const user = await upsertUser(userInfo.email, { googleSub: userInfo.sub });
    const response = NextResponse.redirect(new URL(decodedState.next || "/pipeline", req.nextUrl.origin));
    setSessionCookie(response, user.email);
    return response;
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    return errorRedirect("google_auth_failed");
  }
}
