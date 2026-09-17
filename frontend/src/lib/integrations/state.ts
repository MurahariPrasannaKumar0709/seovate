import crypto from "node:crypto";

const STATE_SECRET = process.env.SESSION_SECRET ?? "seovate-dev-secret-do-not-use-in-production";

function sign(value: string): string {
  return crypto.createHmac("sha256", STATE_SECRET).update(value).digest("hex");
}

/** Same signed-state pattern as api/auth/google/route.ts, generalized for any JSON payload. */
export function createState<T extends object>(payload: T): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyState<T extends object>(state: string | null): T | null {
  if (!state) return null;
  const [payload, signature] = state.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as T;
  } catch {
    return null;
  }
}
