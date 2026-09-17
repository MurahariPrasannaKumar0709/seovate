import { NextRequest, NextResponse } from "next/server";
import { GOOGLE_INTEGRATION_SCOPES, type GoogleIntegrationProvider } from "@/lib/integrations/providers";
import { createState } from "@/lib/integrations/state";
import { getSessionEmail } from "@/lib/auth/getSession";

/**
 * All 3 Google-based integrations (Search Console, Analytics, Business Profile) share one Google
 * OAuth client and one redirect URI (/api/integrations/google/callback) — only the requested
 * scope differs, and the specific product travels in the signed `state` param.
 */
export function createGoogleStartHandler(provider: GoogleIntegrationProvider) {
  return function GET(req: NextRequest) {
    const email = getSessionEmail(req);
    const next = req.nextUrl.searchParams.get("next") ?? "/settings/integrations";

    if (!email) {
      const url = new URL("/login", req.nextUrl.origin);
      url.searchParams.set("next", next);
      return NextResponse.redirect(url);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri =
      process.env.GOOGLE_INTEGRATIONS_REDIRECT_URI ??
      "http://localhost:3000/api/integrations/google/callback";

    const errorRedirect = (reason: string) => {
      const url = new URL(next, req.nextUrl.origin);
      url.searchParams.set("error", reason);
      return NextResponse.redirect(url);
    };

    if (!clientId) return errorRedirect(`${provider}_not_configured`);

    const state = createState({ provider, next, n: Math.random().toString(36).slice(2) });

    const authorizeUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", GOOGLE_INTEGRATION_SCOPES[provider]);
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("access_type", "offline");
    authorizeUrl.searchParams.set("prompt", "consent");
    authorizeUrl.searchParams.set("login_hint", email);

    return NextResponse.redirect(authorizeUrl.toString());
  };
}
