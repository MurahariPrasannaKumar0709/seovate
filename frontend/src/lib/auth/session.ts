import crypto from "node:crypto";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "seovate_session";
const SECRET = process.env.SESSION_SECRET ?? "seovate-dev-secret-do-not-use-in-production";

// 400 days is the maximum cookie lifetime Chrome/Chromium will honor
// (anything longer gets silently clamped). The session never expires on
// its own past that point except when the user explicitly logs out —
// verifySessionCookieValue below only checks the signature, never a
// timestamp, so re-issuing this on every login/OTP-verify effectively
// keeps the session alive indefinitely.
export const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

function sign(value: string): string {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

export function createSessionCookieValue(email: string): string {
  const payload = Buffer.from(email).toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionCookieValue(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null;
  const [payload, signature] = cookieValue.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  return Buffer.from(payload, "base64url").toString("utf-8");
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;

export function setSessionCookie(response: NextResponse, email: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, createSessionCookieValue(email), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  });
}
