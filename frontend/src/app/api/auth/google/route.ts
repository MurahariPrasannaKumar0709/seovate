import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const STATE_SECRET = process.env.SESSION_SECRET ?? "seovate-dev-secret-do-not-use-in-production";

function signState(value: string): string {
  return crypto.createHmac("sha256", STATE_SECRET).update(value).digest("hex");
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_LOGIN_REDIRECT_URI ?? "http://localhost:3000/api/auth/google/callback";

  const next = req.nextUrl.searchParams.get("next") ?? "/pipeline";

  if (!clientId) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("error", "google_not_configured");
    return NextResponse.redirect(url);
  }

  const payload = Buffer.from(JSON.stringify({ next, n: crypto.randomBytes(8).toString("hex") })).toString(
    "base64url"
  );
  const state = `${payload}.${signState(payload)}`;

  const authorizeUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(authorizeUrl.toString());
}
